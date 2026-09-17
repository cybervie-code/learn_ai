// One-off: grant krishna.singh@astroraag.com direct access to the Level 2
// final by recording synthetic passing attempts on the 5 checkpoints + the
// Level 1 final. These are marked in scoreHistory so they can be found and
// removed later. No XP is awarded.
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';
import { User } from './src/models/User.js';
import { LearningPath } from './src/models/LearningPath.js';
import { Quiz } from './src/models/Quiz.js';
import { Attempt } from './src/models/Attempt.js';
import { quizLock } from './src/utils/sequenceGate.js';

const EMAIL = 'krishna.singh@astroraag.com';

await connectDB();

const user = await User.findOne({ email: EMAIL }).lean();
if (!user) throw new Error(`User ${EMAIL} not found`);
console.log('User:', user.email, '| role:', user.role);

const path = await LearningPath.findOne({ slug: 'vulnerability-penetration-testing' }).lean();
const checkpoints = await Quiz.find({ mission: { $in: path.missions.map((m) => m.mission) } }).lean();
const l1 = await Quiz.findOne({ learningPath: path._id, mission: null, level: 1 }).lean();
const l2 = await Quiz.findOne({ slug: 'pentest-level2-final-assessment' }).lean();
if (!l1 || !l2) throw new Error('Finals not found');
console.log(`Checkpoints: ${checkpoints.length} | L1: ${l1.title} | L2: ${l2.title}`);

const targets = [...checkpoints, l1];
for (const quiz of targets) {
  const alreadyPassed = await Attempt.countDocuments({
    user: user._id, quiz: quiz._id, status: 'finalised', percentage: { $gte: 60 },
  });
  if (alreadyPassed) {
    console.log(`  skip (already passed): ${quiz.title}`);
    continue;
  }
  const n = quiz.totalQuestions || quiz.questions.length || 10;
  const correct = Math.ceil(n * 0.7); // 70% — comfortably above the 60% gate
  const now = new Date();
  await Attempt.create({
    user: user._id,
    college: user.college || null,
    quiz: quiz._id,
    quizVersion: quiz.version || 1,
    quizTitle: quiz.title,
    mode: quiz.rules?.mode || 'learning',
    questionSnapshots: [],
    responses: [],
    totalPoints: quiz.totalPoints || n * 10,
    earnedPoints: Math.round((quiz.totalPoints || n * 10) * 0.7),
    percentage: Math.round((correct / n) * 100),
    correctCount: correct,
    incorrectCount: 0,
    skippedCount: n - correct,
    negativeMarking: quiz.rules?.negativeMarking || 0,
    status: 'finalised',
    startedAt: now,
    submittedAt: now,
    scoredAt: now,
    finalisedAt: now,
    totalTimeSpent: 0,
    xpAwarded: 0,
    scoreHistory: [{ previousPercentage: 0, newPercentage: Math.round((correct / n) * 100), reason: 'test-unlock: seeded to grant direct L2 access' }],
  });
  console.log(`  created passing attempt: ${quiz.title}`);
}

const gate = await quizLock(l2, user._id);
console.log(`\nL2 gate for ${EMAIL}: locked=${gate.locked}${gate.reason ? ` (${gate.reason})` : ''}`);

await mongoose.disconnect();
