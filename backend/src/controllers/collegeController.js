import { College } from '../models/College.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Cohort } from '../models/Cohort.js';
import { AuditLog } from '../models/AuditLog.js';
import { sendSuccess } from '../utils/sendResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import crypto from 'crypto';

// Superadmin: create a new college
export const createCollege = asyncHandler(async (req, res) => {
  const {
    name, legalName, shortCode, website, city, state, aicteId, accreditation,
    primaryColor, secondaryColor, plan, seatLimit,
  } = req.body;

  if (!name) throw ApiError.badRequest('College name is required');

  const college = new College({
    name,
    legalName: legalName || name,
    shortCode: shortCode || '',
    website: website || '',
    city: city || '',
    state: state || '',
    aicteId: aicteId || '',
    accreditation: accreditation || '',
    primaryColor: primaryColor || '#6366f1',
    secondaryColor: secondaryColor || '#8b5cf6',
    lifecycle: 'verification',
    subscription: {
      plan: plan || 'trial',
      seatLimit: seatLimit || 100,
    },
  });

  await college.save();

  await AuditLog.create({
    actor: req.user._id,
    actorRole: req.user.platformRole,
    action: 'college.create',
    resource: 'College',
    resourceId: college._id,
    details: { name: college.name },
  });

  sendSuccess(res, college, 'College created', 201);
});

// Superadmin: list all colleges
export const listColleges = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, lifecycle, status } = req.query;
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { legalName: { $regex: search, $options: 'i' } },
      { shortCode: { $regex: search, $options: 'i' } },
    ];
  }
  if (lifecycle) query.lifecycle = lifecycle;
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const colleges = await College.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('owner', 'name email');

  const total = await College.countDocuments(query);

  sendSuccess(res, { colleges, total, page: Number(page), pages: Math.ceil(total / limit) }, 'Colleges fetched');
});

// Get a single college
export const getCollege = asyncHandler(async (req, res) => {
  const isStaff = Boolean(req.user.platformRole);
  // Non-staff may only view their own college
  if (!isStaff && String(req.user.college) !== req.params.id) {
    throw ApiError.forbidden('Cannot view another college');
  }
  let query = College.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('admins', 'name email role');
  // Domain verification secrets are staff-only
  if (!isStaff) query = query.select('-domains.verificationToken');
  const college = await query;
  if (!college) throw ApiError.notFound('College not found');
  sendSuccess(res, college, 'College fetched');
});

// Update college
export const updateCollege = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  delete updates.domains; // handle domains separately
  delete updates.subscription;

  const college = await College.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!college) throw ApiError.notFound('College not found');

  await AuditLog.create({
    actor: req.user._id,
    actorRole: req.user.platformRole || req.user.role,
    action: 'college.update',
    resource: 'College',
    resourceId: college._id,
    details: updates,
  });

  sendSuccess(res, college, 'College updated');
});

// Add a domain to a college (generates verification token)
export const addDomain = asyncHandler(async (req, res) => {
  const { domain } = req.body;
  if (!domain) throw ApiError.badRequest('Domain is required');

  const college = await College.findById(req.params.id);
  if (!college) throw ApiError.notFound('College not found');

  const cleanDomain = domain.toLowerCase().trim();

  // Check if domain is already verified by another college
  const existing = await College.findOne({
    _id: { $ne: college._id },
    'domains.domain': cleanDomain,
    'domains.verified': true,
  });
  if (existing) throw ApiError.conflict('Domain is already verified by another college');

  const verificationToken = crypto.randomBytes(16).toString('hex');

  college.domains.push({
    domain: cleanDomain,
    verificationMethod: 'dns-txt',
    verificationToken: `cybervie-verify=${verificationToken}`,
    verified: false,
  });

  await college.save();

  sendSuccess(res, college, 'Domain added. Please add the DNS TXT record to verify.', 201);
});

// Verify a domain (check DNS TXT record - simplified for MVP: manual verification)
export const verifyDomain = asyncHandler(async (req, res) => {
  const { domain, method } = req.body;
  const college = await College.findById(req.params.id);
  if (!college) throw ApiError.notFound('College not found');

  const domainEntry = college.domains.find((d) => d.domain === domain.toLowerCase().trim());
  if (!domainEntry) throw ApiError.notFound('Domain not found in college');

  if (domainEntry.verified) throw ApiError.conflict('Domain already verified');

  // In production: actually check DNS TXT record
  // For MVP: allow manual verification by superadmin
  if (method === 'manual' && req.user.platformRole === 'superadmin') {
    domainEntry.verified = true;
    domainEntry.verifiedAt = new Date();
    domainEntry.verifiedBy = req.user._id;
    domainEntry.verificationMethod = 'manual';

    // Update lifecycle if this is the first verified domain
    if (college.lifecycle === 'verification') {
      college.lifecycle = 'identity-configured';
    }

    await college.save();

    await AuditLog.create({
      actor: req.user._id,
      actorRole: req.user.platformRole,
      action: 'college.domain.verify',
      resource: 'College',
      resourceId: college._id,
      details: { domain: domainEntry.domain },
    });

    return sendSuccess(res, college, 'Domain verified successfully');
  }

  throw ApiError.badRequest('Verification method not supported or insufficient permissions');
});

// Remove a domain
export const removeDomain = asyncHandler(async (req, res) => {
  const { domain } = req.body;
  const college = await College.findById(req.params.id);
  if (!college) throw ApiError.notFound('College not found');

  college.domains = college.domains.filter((d) => d.domain !== domain.toLowerCase().trim());
  await college.save();

  sendSuccess(res, college, 'Domain removed');
});

// Get college stats
export const getCollegeStats = asyncHandler(async (req, res) => {
  const collegeId = req.params.id;

  // Non-platform users may only read their own college's stats
  if (!req.user.platformRole && String(req.user.college) !== collegeId) {
    throw ApiError.forbidden('Cannot view stats for another college');
  }
  const [studentCount, facultyCount, departmentCount, cohortCount] = await Promise.all([
    User.countDocuments({ college: collegeId, role: 'student', status: 'active' }),
    User.countDocuments({ college: collegeId, role: { $in: ['faculty', 'college-admin', 'college-owner'] }, status: 'active' }),
    Department.countDocuments({ college: collegeId, isActive: true }),
    Cohort.countDocuments({ college: collegeId, isActive: true }),
  ]);

  const college = await College.findById(collegeId);

  sendSuccess(res, {
    students: studentCount,
    faculty: facultyCount,
    departments: departmentCount,
    cohorts: cohortCount,
    seatsUsed: studentCount,
    seatsAvailable: (college?.subscription?.seatLimit || 0) - studentCount,
    seatUtilization: college?.subscription?.seatLimit
      ? Math.round((studentCount / college.subscription.seatLimit) * 100)
      : 0,
  }, 'College stats fetched');
});
