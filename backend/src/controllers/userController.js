import { User } from '../models/User.js';
import { sendSuccess } from '../utils/sendResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

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
  const { page = 1, limit = 20, role, search, platformRole } = req.query;
  const query = {};
  if (role) query.role = role;
  if (platformRole) query.platformRole = platformRole;
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

  // College admins can only manage users in their college
  if (req.user.role === 'college-admin' && String(user.college) !== String(req.user.college)) {
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

  if (req.user.role === 'college-admin' && String(user.college) !== String(req.user.college)) {
    throw ApiError.forbidden('Cannot manage users outside your college');
  }

  user.role = role;
  await user.save();

  sendSuccess(res, user, 'User role updated');
});
