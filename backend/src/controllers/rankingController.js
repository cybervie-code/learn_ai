import { User } from '../models/User.js';
import { Attempt } from '../models/Attempt.js';
import { College } from '../models/College.js';
import { sendSuccess } from '../utils/sendResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Global leaderboard - top students by learning XP
 * Names are always shown (publicDisplayName or real name); other profile
 * fields stay masked unless the student opted into a public profile.
 */
export const getGlobalRankings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, scope = 'global' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const matchStage = { status: 'active', learningXP: { $gt: 0 } };

  if (scope === 'college' && req.user?.college) {
    matchStage.college = req.user.college;
  }

  const pipeline = [
    { $match: matchStage },
    { $sort: { learningXP: -1, createdAt: 1 } },
    { $skip: skip },
    { $limit: Number(limit) },
    {
      $lookup: {
        from: 'colleges',
        localField: 'college',
        foreignField: '_id',
        as: 'collegeInfo',
      },
    },
    {
      $project: {
        name: 1,
        publicDisplayName: 1,
        isProfilePublic: 1,
        avatarUrl: 1,
        learningXP: 1,
        streak: 1,
        branch: 1,
        graduationYear: 1,
        collegeName: { $arrayElemAt: ['$collegeInfo.name', 0] },
      },
    },
  ];

  const rankedUsers = await User.aggregate(pipeline);

  // Names are always public on the leaderboard; profile details stay masked
  const ranked = rankedUsers.map((u, index) => ({
    rank: skip + index + 1,
    displayName: (u.publicDisplayName || '').trim() || u.name,
    avatarUrl: u.isProfilePublic ? u.avatarUrl : '',
    learningXP: u.learningXP,
    streak: u.streak,
    branch: u.isProfilePublic ? u.branch : '',
    collegeName: u.isProfilePublic ? u.collegeName : '',
    graduationYear: u.isProfilePublic ? u.graduationYear : null,
    isPublic: u.isProfilePublic,
  }));

  const total = await User.countDocuments(matchStage);

  sendSuccess(res, { rankings: ranked, total, page: Number(page), pages: Math.ceil(total / limit) }, 'Rankings fetched');
});

/**
 * College leaderboard - rank students within a college
 */
export const getCollegeRankings = asyncHandler(async (req, res) => {
  const collegeId = req.params.collegeId || req.user?.college;
  if (!collegeId) throw ApiError.badRequest('College ID required');

  const { page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const matchStage = {
    status: 'active',
    college: collegeId instanceof Object ? collegeId : null,
    learningXP: { $gt: 0 },
  };

  // Handle string collegeId
  if (typeof collegeId === 'string') {
    matchStage.college = collegeId;
  }

  const rankedUsers = await User.find(matchStage)
    .sort({ learningXP: -1, createdAt: 1 })
    .skip(skip)
    .limit(Number(limit))
    .select('name publicDisplayName isProfilePublic avatarUrl learningXP streak branch graduationYear rollNumber')
    .lean();

  const ranked = rankedUsers.map((u, index) => ({
    rank: skip + index + 1,
    displayName: (u.publicDisplayName || '').trim() || u.name,
    avatarUrl: u.isProfilePublic ? u.avatarUrl : '',
    learningXP: u.learningXP,
    streak: u.streak,
    branch: u.isProfilePublic ? u.branch : '',
    graduationYear: u.isProfilePublic ? u.graduationYear : null,
    isPublic: u.isProfilePublic,
  }));

  const total = await User.countDocuments(matchStage);

  sendSuccess(res, { rankings: ranked, total, page: Number(page), pages: Math.ceil(total / limit) }, 'College rankings fetched');
});

/**
 * College rankings - rank colleges by aggregate student XP
 */
export const getCollegeLeaderboard = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const pipeline = [
    { $match: { status: 'active', college: { $ne: null }, learningXP: { $gt: 0 } } },
    {
      $group: {
        _id: '$college',
        totalXP: { $sum: '$learningXP' },
        activeStudents: { $sum: 1 },
        avgXP: { $avg: '$learningXP' },
      },
    },
    { $sort: { totalXP: -1 } },
    { $skip: skip },
    { $limit: Number(limit) },
    {
      $lookup: {
        from: 'colleges',
        localField: '_id',
        foreignField: '_id',
        as: 'collegeInfo',
      },
    },
    {
      $project: {
        collegeName: { $arrayElemAt: ['$collegeInfo.name', 0] },
        collegeShortCode: { $arrayElemAt: ['$collegeInfo.shortCode', 0] },
        collegeCity: { $arrayElemAt: ['$collegeInfo.city', 0] },
        collegeState: { $arrayElemAt: ['$collegeInfo.state', 0] },
        totalXP: 1,
        activeStudents: 1,
        avgXP: { $round: ['$avgXP', 0] },
      },
    },
  ];

  const colleges = await User.aggregate(pipeline);
  const ranked = colleges.map((c, index) => ({
    rank: skip + index + 1,
    ...c,
  }));

  sendSuccess(res, { rankings: ranked }, 'College leaderboard fetched');
});
