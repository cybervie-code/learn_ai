import { LearningPath } from '../models/LearningPath.js';
import { Mission } from '../models/Mission.js';
import { Attempt } from '../models/Attempt.js';
import { sendSuccess } from '../utils/sendResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// List published learning paths
export const listPaths = asyncHandler(async (req, res) => {
  const { track, difficulty, search } = req.query;
  const query = { isPublished: true };
  if (track) query.track = track;
  if (difficulty) query.difficulty = difficulty;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const paths = await LearningPath.find(query)
    .sort({ order: 1, createdAt: -1 })
    .populate('competencies', 'name code')
    .lean();

  // Add progress info for logged-in user
  if (req.user) {
    for (const path of paths) {
      const missionIds = path.missions.map((m) => m.mission);
      const completedMissions = await Attempt.countDocuments({
        user: req.user._id,
        quiz: { $in: missionIds }, // this won't work directly; we need mission-based tracking
        status: 'finalised',
        percentage: { $gte: 60 },
      });
      path.progress = {
        totalMissions: path.missions.length,
        completedMissions: 0, // simplified for MVP
      };
    }
  }

  sendSuccess(res, paths, 'Learning paths fetched');
});

// Get a single learning path with missions
export const getPath = asyncHandler(async (req, res) => {
  const path = await LearningPath.findOne({ slug: req.params.slug, isPublished: true })
    .populate('competencies', 'name code')
    .populate({
      path: 'missions.mission',
      select: 'title slug description estimatedMinutes difficulty icon isPublished status xpReward',
    })
    .populate('prerequisites', 'title slug');

  if (!path) throw ApiError.notFound('Learning path not found');
  sendSuccess(res, path, 'Learning path fetched');
});

// Admin: create learning path
export const createPath = asyncHandler(async (req, res) => {
  const { title, slug, description, track, difficulty, estimatedHours, icon, competencies, tags, targetBranches, isFeatured } = req.body;
  if (!title || !slug) throw ApiError.badRequest('Title and slug are required');

  const path = new LearningPath({
    title, slug, description, track, difficulty,
    estimatedHours, icon, competencies, tags, targetBranches, isFeatured,
  });
  await path.save();
  sendSuccess(res, path, 'Learning path created', 201);
});

// Admin: update learning path
export const updatePath = asyncHandler(async (req, res) => {
  const path = await LearningPath.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!path) throw ApiError.notFound('Learning path not found');
  sendSuccess(res, path, 'Learning path updated');
});

// Admin: publish/unpublish learning path
export const togglePublishPath = asyncHandler(async (req, res) => {
  const path = await LearningPath.findById(req.params.id);
  if (!path) throw ApiError.notFound('Learning path not found');
  path.isPublished = !path.isPublished;
  await path.save();
  sendSuccess(res, path, `Learning path ${path.isPublished ? 'published' : 'unpublished'}`);
});

// Get missions for a path
export const getMissions = asyncHandler(async (req, res) => {
  const { pathId } = req.query;
  const query = { isPublished: true };
  if (pathId) query.learningPath = pathId;

  const missions = await Mission.find(query)
    .sort({ order: 1 })
    .populate('competencies', 'name code')
    .populate('quiz', 'title totalQuestions estimatedMinutes')
    .lean();

  sendSuccess(res, missions, 'Missions fetched');
});

// Get a single mission
export const getMission = asyncHandler(async (req, res) => {
  const mission = await Mission.findOne({ slug: req.params.slug, isPublished: true })
    .populate('competencies', 'name code')
    .populate('quiz', 'title totalQuestions totalPoints rules')
    .populate('learningPath', 'title slug');

  if (!mission) throw ApiError.notFound('Mission not found');
  sendSuccess(res, mission, 'Mission fetched');
});

// Admin: create mission
export const createMission = asyncHandler(async (req, res) => {
  const { title, slug, description, learningPath, contentBlocks, quiz, estimatedMinutes, difficulty, competencies, learningObjectives, xpReward, icon, tags, order } = req.body;
  if (!title || !slug) throw ApiError.badRequest('Title and slug are required');

  const mission = new Mission({
    title, slug, description, learningPath, contentBlocks, quiz,
    estimatedMinutes, difficulty, competencies, learningObjectives,
    xpReward, icon, tags, order, author: req.user._id,
  });
  await mission.save();

  // Add mission to learning path if specified
  if (learningPath) {
    await LearningPath.findByIdAndUpdate(learningPath, {
      $push: { missions: { mission: mission._id, order: order || 0 } },
    });
  }

  sendSuccess(res, mission, 'Mission created', 201);
});

// Admin: update mission
export const updateMission = asyncHandler(async (req, res) => {
  const mission = await Mission.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!mission) throw ApiError.notFound('Mission not found');
  sendSuccess(res, mission, 'Mission updated');
});
