import { Attempt } from '../models/Attempt.js';
import { Quiz } from '../models/Quiz.js';
import { Question } from '../models/Question.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { sendSuccess } from '../utils/sendResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// Helper: shuffle array
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Start a new quiz attempt.
 * Creates immutable snapshots of all questions and options.
 */
export const startAttempt = asyncHandler(async (req, res) => {
  const { quizId } = req.body;
  if (!quizId) throw ApiError.badRequest('quizId is required');

  const quiz = await Quiz.findById(quizId).populate({
    path: 'questions.question',
    match: { status: 'published' },
  });

  if (!quiz) throw ApiError.notFound('Quiz not found');
  if (!quiz.isPublished) throw ApiError.badRequest('Quiz is not published');

  // Check max attempts
  if (quiz.rules.maxAttempts > 0) {
    const existingAttempts = await Attempt.countDocuments({
      user: req.user._id,
      quiz: quizId,
      status: { $in: ['in-progress', 'submitted', 'scored', 'finalised'] },
    });
    if (existingAttempts >= quiz.rules.maxAttempts) {
      throw ApiError.badRequest(`Maximum attempts (${quiz.rules.maxAttempts}) reached for this quiz`);
    }
  }

  // Check for existing in-progress attempt
  const existingInProgress = await Attempt.findOne({
    user: req.user._id,
    quiz: quizId,
    status: 'in-progress',
  });

  if (existingInProgress) {
    // Return the existing in-progress attempt
    return sendSuccess(res, existingInProgress, 'Resuming existing attempt');
  }

  // Build question snapshots
  const validQuestions = quiz.questions.filter((q) => q.question);
  if (validQuestions.length === 0) throw ApiError.badRequest('Quiz has no valid published questions');

  let orderedQuestions = validQuestions;
  if (quiz.rules.shuffleQuestions) {
    orderedQuestions = shuffle(orderedQuestions);
  }

  const questionSnapshots = [];
  for (const qRef of orderedQuestions) {
    const question = qRef.question;
    const currentVersion = question.getCurrentVersion();

    let optionOrder = currentVersion.options.map((o) => o.key);
    if (quiz.rules.shuffleOptions) {
      optionOrder = shuffle(optionOrder);
    }

    questionSnapshots.push({
      questionId: question._id,
      questionVersion: currentVersion.version,
      questionText: currentVersion.questionText,
      questionType: question.questionType,
      options: currentVersion.options.map((o) => ({
        key: o.key,
        text: o.text,
        isCorrect: quiz.rules.mode === 'learning' ? o.isCorrect : false, // hide correct in assessment mode
        explanation: quiz.rules.mode === 'learning' ? o.explanation : '',
      })),
      correctKeys: currentVersion.options.filter((o) => o.isCorrect).map((o) => o.key),
      points: qRef.points,
      optionOrder,
      competency: question.competency,
      difficulty: question.difficulty,
    });
  }

  // Calculate expiry
  const expiresAt = quiz.rules.timeLimit > 0
    ? new Date(Date.now() + quiz.rules.timeLimit * 1000)
    : null;

  const attempt = new Attempt({
    user: req.user._id,
    college: req.user.college,
    quiz: quizId,
    quizVersion: quiz.version,
    quizTitle: quiz.title,
    mode: quiz.rules.mode,
    questionSnapshots,
    status: 'in-progress',
    startedAt: new Date(),
    expiresAt,
    totalPoints: questionSnapshots.reduce((sum, q) => sum + q.points, 0),
  });

  await attempt.save();

  await AuditLog.create({
    actor: req.user._id,
    actorRole: req.user.role,
    action: 'attempt.start',
    resource: 'Attempt',
    resourceId: attempt._id,
    college: req.user.college,
    details: { quizId, quizTitle: quiz.title },
  });

  sendSuccess(res, attempt, 'Attempt started', 201);
});

/**
 * Submit a single answer (for learning mode with immediate feedback)
 */
export const submitAnswer = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { questionSnapshotIndex, selectedKeys, textAnswer, timeSpent } = req.body;

  const attempt = await Attempt.findById(attemptId);
  if (!attempt) throw ApiError.notFound('Attempt not found');
  if (String(attempt.user) !== String(req.user._id)) throw ApiError.forbidden('Not your attempt');
  if (attempt.status !== 'in-progress') throw ApiError.badRequest('Attempt is not in progress');
  if (attempt.expiresAt && new Date() > attempt.expiresAt) {
    attempt.status = 'expired';
    await attempt.save();
    throw ApiError.badRequest('Attempt has expired');
  }

  if (questionSnapshotIndex === undefined || questionSnapshotIndex < 0 || questionSnapshotIndex >= attempt.questionSnapshots.length) {
    throw ApiError.badRequest('Invalid question index');
  }

  // Require at least one selected key or a text answer
  if ((!selectedKeys || selectedKeys.length === 0) && !textAnswer) {
    throw ApiError.badRequest('Please select an answer');
  }

  const snapshot = attempt.questionSnapshots[questionSnapshotIndex];

  // Check if already answered
  const existingResponseIndex = attempt.responses.findIndex(
    (r) => r.questionSnapshotIndex === questionSnapshotIndex
  );

  // Determine correctness
  const correctKeys = snapshot.correctKeys;
  const selected = selectedKeys || [];
  const isCorrect = selected.length === correctKeys.length &&
    selected.every((k) => correctKeys.includes(k));

  const pointsAwarded = isCorrect ? snapshot.points : 0;

  const responseData = {
    questionSnapshotIndex,
    selectedKeys: selected,
    textAnswer: textAnswer || '',
    isCorrect,
    pointsAwarded,
    timeSpent: timeSpent || 0,
    submittedAt: new Date(),
  };

  if (existingResponseIndex >= 0) {
    attempt.responses[existingResponseIndex] = responseData;
  } else {
    attempt.responses.push(responseData);
  }

  await attempt.save();

  // Return feedback based on mode
  const quiz = await Quiz.findById(attempt.quiz);
  const showFeedback = quiz.rules.mode === 'learning' || quiz.rules.showResults === 'immediate';

  const feedback = showFeedback
    ? {
        isCorrect,
        correctKeys: quiz.rules.mode === 'learning' ? correctKeys : undefined,
        explanation: quiz.rules.mode === 'learning' ? snapshot.options.find((o) => o.isCorrect)?.explanation : undefined,
        pointsAwarded,
      }
    : { pointsAwarded };

  sendSuccess(res, { attempt, feedback }, 'Answer submitted');
});

/**
 * Submit the entire attempt (finalize)
 */
export const submitAttempt = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;

  const attempt = await Attempt.findById(attemptId);
  if (!attempt) throw ApiError.notFound('Attempt not found');
  if (String(attempt.user) !== String(req.user._id)) throw ApiError.forbidden('Not your attempt');
  if (attempt.status !== 'in-progress') throw ApiError.badRequest('Attempt is not in progress');

  // Calculate final score
  let earnedPoints = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let skippedCount = 0;
  let totalTimeSpent = 0;

  for (let i = 0; i < attempt.questionSnapshots.length; i++) {
    const snapshot = attempt.questionSnapshots[i];
    const response = attempt.responses.find((r) => r.questionSnapshotIndex === i);

    if (!response || (!response.selectedKeys.length && !response.textAnswer)) {
      skippedCount++;
    } else {
      const isCorrect = response.isCorrect !== null
        ? response.isCorrect
        : (response.selectedKeys.length === snapshot.correctKeys.length &&
           response.selectedKeys.every((k) => snapshot.correctKeys.includes(k)));

      if (isCorrect) {
        correctCount++;
        earnedPoints += snapshot.points;
      } else {
        incorrectCount++;
      }
      totalTimeSpent += response.timeSpent || 0;
    }
  }

  attempt.earnedPoints = earnedPoints;
  attempt.percentage = attempt.totalPoints > 0 ? Math.round((earnedPoints / attempt.totalPoints) * 100) : 0;
  attempt.correctCount = correctCount;
  attempt.incorrectCount = incorrectCount;
  attempt.skippedCount = skippedCount;
  attempt.totalTimeSpent = totalTimeSpent;
  attempt.status = 'scored';
  attempt.submittedAt = new Date();
  attempt.scoredAt = new Date();

  // Award XP (learning mode only, based on correct answers)
  if (attempt.mode === 'learning') {
    const xpEarned = correctCount * 10;
    attempt.xpAwarded = xpEarned;

    // Update user XP
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { learningXP: xpEarned },
    });
  }

  // Update question analytics
  for (const snapshot of attempt.questionSnapshots) {
    const response = attempt.responses.find((r) => r.questionSnapshotIndex === attempt.questionSnapshots.indexOf(snapshot));
    const isCorrect = response?.isCorrect || false;
    await Question.findByIdAndUpdate(snapshot.questionId, {
      $inc: {
        'analytics.totalAttempts': 1,
        'analytics.correctAttempts': isCorrect ? 1 : 0,
      },
    });
  }

  // Finalize
  attempt.status = 'finalised';
  attempt.finalisedAt = new Date();
  await attempt.save();

  await AuditLog.create({
    actor: req.user._id,
    actorRole: req.user.role,
    action: 'attempt.submit',
    resource: 'Attempt',
    resourceId: attempt._id,
    college: req.user.college,
    details: { percentage: attempt.percentage, correctCount, totalQuestions: attempt.questionSnapshots.length },
  });

  sendSuccess(res, attempt, 'Attempt submitted and scored');
});

/**
 * Get attempt results
 */
export const getAttemptResults = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findById(req.params.id);
  if (!attempt) throw ApiError.notFound('Attempt not found');

  // Only the attempt owner or faculty/admin can view
  if (
    String(attempt.user) !== String(req.user._id) &&
    req.user.role !== 'faculty' &&
    req.user.role !== 'college-admin' &&
    req.user.platformRole !== 'superadmin'
  ) {
    throw ApiError.forbidden('Not authorized to view this attempt');
  }

  // Reveal correct answers in results
  const results = {
    ...attempt.toObject(),
    questionSnapshots: attempt.questionSnapshots.map((s) => ({
      ...s,
      options: s.options.map((o) => ({ ...o, isCorrect: o.isCorrect })),
      correctKeys: s.correctKeys,
    })),
  };

  sendSuccess(res, results, 'Attempt results');
});

/**
 * Get user's attempt history
 */
export const getMyAttempts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, quizId, status } = req.query;
  const query = { user: req.user._id };
  if (quizId) query.quiz = quizId;
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const attempts = await Attempt.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .select('quizTitle mode status percentage correctCount incorrectCount skippedCount totalPoints earnedPoints xpAwarded startedAt submittedAt');

  const total = await Attempt.countDocuments(query);

  sendSuccess(res, { attempts, total, page: Number(page), pages: Math.ceil(total / limit) }, 'Attempt history fetched');
});
