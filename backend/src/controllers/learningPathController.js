import { LearningPath } from '../models/LearningPath.js';
import { Mission } from '../models/Mission.js';
import { Quiz } from '../models/Quiz.js';
import { Attempt } from '../models/Attempt.js';
import { sendSuccess } from '../utils/sendResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { missionLock } from '../utils/sequenceGate.js';

const FINAL_SELECT =
  'title slug description type level totalQuestions totalPoints estimatedMinutes difficulty learningPath rules';

// A path's final assessments are the published quizzes linked to the path
// with no mission — checkpoints always have a mission, so mission:null is
// the spine. A path can have several tiered finals (level 1, 2, ...),
// returned in level order.
async function findFinalAssessments(pathIds) {
  const finals = await Quiz.find({
    learningPath: { $in: pathIds },
    mission: null,
    status: 'published',
    isPublished: true,
  }).select(FINAL_SELECT).sort({ level: 1, createdAt: 1 }).lean();

  const byPath = new Map();
  for (const f of finals) {
    const key = String(f.learningPath);
    if (!byPath.has(key)) byPath.set(key, []);
    byPath.get(key).push(f);
  }
  return byPath;
}

// Attach passed/locked flags to a path's ordered finals. `checkpointsGated`
// is true while any lesson checkpoint is unpassed; a final is additionally
// locked while an earlier-level final is unpassed.
function annotateFinals(finals, passedQuizIds, checkpointsGated) {
  let gated = checkpointsGated;
  return finals.map((f) => {
    const out = { ...f, passed: passedQuizIds.has(String(f._id)), locked: gated };
    if (!out.passed) gated = true;
    return out;
  });
}

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
    .populate({
      path: 'missions.mission',
      select: 'title slug estimatedMinutes difficulty icon xpReward quiz isPublished',
    })
    .lean();

  // A mission counts as completed when the user has a finalised attempt
  // (>=60%) on that mission's quiz; the final assessment follows the same rule
  const finalByPath = await findFinalAssessments(paths.map((p) => p._id));
  const quizIds = [
    ...paths.flatMap((p) => p.missions.map((m) => m.mission?.quiz)).filter(Boolean),
    ...[...finalByPath.values()].flat().map((f) => f._id),
  ];
  const passedQuizIds = req.user
    ? new Set(
        (await Attempt.distinct('quiz', {
          user: req.user._id,
          quiz: { $in: quizIds },
          status: 'finalised',
          percentage: { $gte: 60 },
        })).map(String)
      )
    : new Set();

  for (const path of paths) {
    let done = 0;
    path.missions.forEach((m) => {
      m.completed = Boolean(m.mission?.quiz && passedQuizIds.has(String(m.mission.quiz)));
      if (m.completed) done += 1;
    });
    // Sequential gating: a lesson stays locked while any earlier
    // checkpoint-bearing lesson is unpassed; the final needs them all.
    let gated = false;
    [...path.missions]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((m) => {
        m.locked = gated;
        if (m.mission?.quiz && !m.completed) gated = true;
      });
    path.progress = {
      totalMissions: path.missions.length,
      completedMissions: done,
    };
    const finals = annotateFinals(
      finalByPath.get(String(path._id)) || [],
      passedQuizIds,
      gated
    );
    path.finalAssessments = finals;
    // First final kept under the legacy singular key for older payloads
    path.finalAssessment = finals[0] || null;
  }

  sendSuccess(res, paths, 'Learning paths fetched');
});

// Get a single learning path with missions
export const getPath = asyncHandler(async (req, res) => {
  const path = await LearningPath.findOne({ slug: req.params.slug, isPublished: true })
    .populate('competencies', 'name code')
    .populate({
      path: 'missions.mission',
      select: 'title slug description estimatedMinutes difficulty icon isPublished status xpReward quiz',
    })
    .populate('prerequisites', 'title slug');

  if (!path) throw ApiError.notFound('Learning path not found');

  // Flag each mission as completed if the user passed its quiz (>=60%);
  // the final assessment follows the same rule
  const obj = path.toObject();
  const finalByPath = await findFinalAssessments([obj._id]);
  const finals = finalByPath.get(String(obj._id)) || [];

  const quizIds = [
    ...obj.missions.map((m) => m.mission?.quiz).filter(Boolean),
    ...finals.map((f) => f._id),
  ];
  const passed = req.user
    ? new Set(
        (await Attempt.distinct('quiz', {
          user: req.user._id,
          quiz: { $in: quizIds },
          status: 'finalised',
          percentage: { $gte: 60 },
        })).map(String)
      )
    : new Set();

  obj.missions.forEach((m) => {
    m.completed = m.mission?.quiz ? passed.has(String(m.mission.quiz)) : false;
  });
  // Sequential gating — see listPaths
  let gated = false;
  [...obj.missions]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach((m) => {
      m.locked = gated;
      if (m.mission?.quiz && !m.completed) gated = true;
    });
  obj.finalAssessments = annotateFinals(finals, passed, gated);
  obj.finalAssessment = obj.finalAssessments[0] || null;

  sendSuccess(res, obj, 'Learning path fetched');
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

  // Sequential gating — non-student roles can always preview lesson content
  const obj = mission.toObject();
  if (req.user && req.user.role !== 'student') {
    obj.locked = false;
    obj.lockedReason = null;
  } else {
    const gate = await missionLock(mission, req.user?._id);
    obj.locked = gate.locked;
    obj.lockedReason = gate.reason;
  }
  sendSuccess(res, obj, 'Mission fetched');
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
