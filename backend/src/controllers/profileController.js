import { User } from '../models/User.js';
import { Attempt } from '../models/Attempt.js';
import { LearningPath } from '../models/LearningPath.js';
import { Badge } from '../models/Badge.js';
import { sendSuccess } from '../utils/sendResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// Get own profile (full data)
export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('college', 'name shortCode city state')
    .populate('department', 'name code')
    .populate('cohort', 'name programme branch')
    .populate('badges')
    .lean();

  // Get recent attempts
  const recentAttempts = await Attempt.find({ user: req.user._id, status: 'finalised' })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('quizTitle mode percentage correctCount totalPoints earnedPoints xpAwarded createdAt');

  // Get stats
  const totalAttempts = await Attempt.countDocuments({ user: req.user._id, status: 'finalised' });
  const totalQuizzes = await Attempt.distinct('quiz', { user: req.user._id, status: 'finalised' });
  const avgScore = await Attempt.aggregate([
    { $match: { user: req.user._id, status: 'finalised' } },
    { $group: { _id: null, avg: { $avg: '$percentage' } } },
  ]);

  sendSuccess(res, {
    ...user,
    stats: {
      totalAttempts,
      totalQuizzes: totalQuizzes.length,
      averageScore: avgScore[0]?.avg ? Math.round(avgScore[0].avg) : 0,
    },
    recentAttempts,
  }, 'Profile fetched');
});

// Update own profile
export const updateMyProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'bio', 'headline', 'avatarUrl', 'isProfilePublic', 'publicDisplayName', 'branch', 'graduationYear', 'currentSemester'];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('college', 'name shortCode');

  sendSuccess(res, user, 'Profile updated');
});

// Get public profile by user ID
export const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    isProfilePublic: true,
    status: 'active',
  })
    .populate('college', 'name shortCode city state')
    .populate('badges')
    .select('name publicDisplayName avatarUrl headline bio branch graduationYear learningXP streak badges college isProfilePublic')
    .lean();

  if (!user) throw ApiError.notFound('Public profile not found or not public');

  // Get public attempt stats
  const totalAttempts = await Attempt.countDocuments({ user: req.params.id, status: 'finalised' });
  const avgScore = await Attempt.aggregate([
    { $match: { user: req.user?._id || null, status: 'finalised' } },
    { $group: { _id: null, avg: { $avg: '$percentage' } } },
  ]);

  // Get ranking
  const higherRanked = await User.countDocuments({
    learningXP: { $gt: user.learningXP },
    status: 'active',
  });

  sendSuccess(res, {
    ...user,
    stats: {
      totalAttempts,
      averageScore: avgScore[0]?.avg ? Math.round(avgScore[0].avg) : 0,
      globalRank: higherRanked + 1,
    },
  }, 'Public profile fetched');
});
