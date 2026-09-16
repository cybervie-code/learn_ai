import crypto from 'crypto';
import { User } from '../models/User.js';
import { College } from '../models/College.js';
import { sendSuccess } from '../utils/sendResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { requestOtp } from '../services/otpService.js';
import { sendInviteEmail } from '../services/emailService.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Roles an admin is allowed to create. Platform roles are never assignable here.
const CREATABLE_ROLES = ['college-admin', 'department-admin', 'faculty', 'placement-officer', 'student'];
const ROLE_LABELS = {
  'college-admin': 'College Admin',
  'department-admin': 'Department Admin',
  faculty: 'Faculty',
  'placement-officer': 'Placement Officer',
  student: 'Student',
};

// Invite links stay valid for 72 hours
const INVITE_TTL_MS = 72 * 60 * 60 * 1000;

// College admin: list users in their college
export const listCollegeUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search, status } = req.query;
  const query = { college: req.user.college };
  if (role) query.role = role;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .select('name email avatarUrl role branch rollNumber graduationYear status learningXP streak lastLoginAt')
    .populate('department', 'name code')
    .populate('cohort', 'name');

  const total = await User.countDocuments(query);

  sendSuccess(res, { users, total, page: Number(page), pages: Math.ceil(total / limit) }, 'Users fetched');
});

// Superadmin: list all users
export const listAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search, platformRole, college } = req.query;
  const query = {};
  if (role) query.role = role;
  if (platformRole) query.platformRole = platformRole;
  if (college) query.college = college;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .select('name email avatarUrl role platformRole college status learningXP lastLoginAt')
    .populate('college', 'name shortCode');

  const total = await User.countDocuments(query);

  sendSuccess(res, { users, total, page: Number(page), pages: Math.ceil(total / limit) }, 'Users fetched');
});

// Update user status (suspend/activate)
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['active', 'suspended', 'deactivated'];
  if (!validStatuses.includes(status)) throw ApiError.badRequest('Invalid status');

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  // College admins/owners can only manage users in their college
  const isCollegeStaff = ['college-admin', 'college-owner'].includes(req.user.role);
  if (isCollegeStaff && String(user.college) !== String(req.user.college)) {
    throw ApiError.forbidden('Cannot manage users outside your college');
  }

  user.status = status;
  await user.save();

  sendSuccess(res, user, `User status updated to ${status}`);
});

// Update user role (within college)
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const validRoles = ['college-admin', 'faculty', 'placement-officer', 'student', 'department-admin'];
  if (!validRoles.includes(role)) throw ApiError.badRequest('Invalid role');

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  const isCollegeStaff = ['college-admin', 'college-owner'].includes(req.user.role);
  if (isCollegeStaff && String(user.college) !== String(req.user.college)) {
    throw ApiError.forbidden('Cannot manage users outside your college');
  }

  user.role = role;
  await user.save();

  sendSuccess(res, user, 'User role updated');
});

/**
 * Create (invite) a user account.
 * - Superadmin / platform-ops: any college, any creatable role.
 * - College admin / owner: their own college only; only a college-owner can
 *   create another college-admin.
 * The account starts as 'invited' with no password. A one-time code is emailed
 * so the person can set their own password via the reset-password flow.
 */
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, role, collegeId } = req.body || {};

  const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
  if (!EMAIL_RE.test(normalizedEmail)) throw ApiError.badRequest('Please provide a valid email address');
  if (typeof name !== 'string' || name.trim().length < 2) throw ApiError.badRequest('Please provide a full name');
  if (!CREATABLE_ROLES.includes(role)) {
    throw ApiError.badRequest(`Role must be one of: ${CREATABLE_ROLES.join(', ')}`);
  }

  const isPlatformStaff = ['superadmin', 'platform-ops'].includes(req.user.platformRole);
  const isCollegeOwner = req.user.role === 'college-owner';

  // Resolve target college
  let college = null;
  if (isPlatformStaff) {
    if (!collegeId) throw ApiError.badRequest('collegeId is required');
    college = await College.findById(collegeId);
    if (!college) throw ApiError.notFound('College not found');
  } else {
    // College admins/owners are locked to their own college
    if (!req.user.college) throw ApiError.badRequest('Your account is not linked to a college');
    college = await College.findById(req.user.college);
    if (!college) throw ApiError.notFound('College not found');
    // Only a college-owner can create another college-admin
    if (role === 'college-admin' && !isCollegeOwner) {
      throw ApiError.forbidden('Only a college owner can create another college admin');
    }
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const user = await User.create({
    email: normalizedEmail,
    name: name.trim(),
    role,
    college: college._id,
    status: 'invited',
    emailVerified: false,
  });

  // Email a one-click invite link carrying a long, single-use token (stored
  // through the same reset-password OTP plumbing, just with a 72h TTL).
  // If delivery fails the account still exists — Forgot Password works too.
  let emailSent = true;
  try {
    const token = crypto.randomBytes(32).toString('hex');
    await requestOtp(normalizedEmail, 'reset-password', { send: false, otp: token, ttlMs: INVITE_TTL_MS });
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteUrl = `${baseUrl}/login?invite=${token}&email=${encodeURIComponent(normalizedEmail)}`;
    await sendInviteEmail(normalizedEmail, {
      name: user.name,
      role: ROLE_LABELS[role] || role,
      collegeName: college.name,
      inviteUrl,
    });
  } catch (err) {
    console.error('Invite email failed:', err.message);
    emailSent = false;
  }

  sendSuccess(
    res,
    { user, emailSent },
    emailSent
      ? `${ROLE_LABELS[role]} account created and invite sent to ${normalizedEmail}`
      : 'Account created, but the invite email could not be sent. Ask them to use "Forgot password" on the sign-in page.',
    201
  );
});
