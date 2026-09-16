import { Mission } from '../models/Mission.js';
import { Quiz } from '../models/Quiz.js';
import { LearningPath } from '../models/LearningPath.js';
import { Attempt } from '../models/Attempt.js';

const PASS_MARK = 60;

// Quizzes that gate progress inside a path: the checkpoint quiz of every
// mission ordered before `beforeOrder` (Infinity = all missions, i.e. finals).
async function gateQuizzes(pathId, beforeOrder = Infinity) {
  const path = await LearningPath.findById(pathId).select('missions').lean();
  if (!path) return [];
  const missionIds = path.missions
    .filter((m) => (m.order ?? 0) < beforeOrder)
    .map((m) => m.mission);
  if (!missionIds.length) return [];
  return Quiz.find({ mission: { $in: missionIds } }).select('_id title').lean();
}

async function unpassedGates(quizDocs, userId) {
  if (!quizDocs.length) return [];
  if (!userId) return quizDocs; // unauthenticated: everything gated is unpassed
  const passed = new Set(
    (await Attempt.distinct('quiz', {
      user: userId,
      quiz: { $in: quizDocs.map((q) => q._id) },
      status: 'finalised',
      percentage: { $gte: PASS_MARK },
    })).map(String)
  );
  return quizDocs.filter((q) => !passed.has(String(q._id)));
}

// Is a mission locked? Locked while any earlier mission's checkpoint is unpassed.
export async function missionLock(mission, userId) {
  const pathId = mission.learningPath?._id || mission.learningPath;
  if (!pathId) return { locked: false, reason: null };
  const unpassed = await unpassedGates(await gateQuizzes(pathId, mission.order ?? Infinity), userId);
  return unpassed.length
    ? { locked: true, reason: 'Pass the previous lesson\u2019s checkpoint to unlock this lesson.' }
    : { locked: false, reason: null };
}

// Is a quiz locked? Checkpoints are gated by earlier missions; a path final
// (learningPath set, mission null) is gated by every mission in the path.
export async function quizLock(quiz, userId) {
  let pathId = quiz.learningPath;
  let beforeOrder = Infinity;
  if (quiz.mission) {
    const mission = await Mission.findById(quiz.mission).select('order learningPath').lean();
    if (!mission) return { locked: false, reason: null };
    pathId = pathId || mission.learningPath;
    beforeOrder = mission.order ?? Infinity;
  }
  if (!pathId) return { locked: false, reason: null };
  const unpassed = await unpassedGates(await gateQuizzes(pathId, beforeOrder), userId);
  if (!unpassed.length) return { locked: false, reason: null };
  return {
    locked: true,
    reason: quiz.mission
      ? 'Pass the previous lesson\u2019s checkpoint to unlock this quiz.'
      : 'Pass every lesson checkpoint to unlock the final assessment.',
  };
}
