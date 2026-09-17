import { Attempt } from '../models/Attempt.js';
import { Quiz } from '../models/Quiz.js';
import { Question } from '../models/Question.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { sendSuccess } from '../utils/sendResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { quizLock } from '../utils/sequenceGate.js';

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
 * Strip answer keys from snapshots sent to the client while an attempt is
 * in progress — otherwise the correct answers are readable in DevTools.
 * A question's answer is revealed once it has been answered (learning mode)
 * or the whole attempt is finalised and the quiz's showResults rule allows it.
 */
function sanitizeAttempt(attempt, quiz = null) {
  const obj = attempt.toObject ? attempt.toObject() : attempt;
  const finalised = obj.status !== 'in-progress';
  const revealAll = finalised && shouldRevealAnswers(obj, quiz);
  // Mirrors the feedback rule in submitAnswer: an answered question reveals
  // its answer in learning mode, or whenever the quiz gives immediate results.
  const revealAnswered = obj.mode === 'learning' || quiz?.rules?.showResults === 'immediate';
  obj.questionSnapshots = (obj.questionSnapshots || []).map((s, i) => {
    const answered = (obj.responses || []).some((r) => r.questionSnapshotIndex === i);
    const reveal = revealAll || (answered && revealAnswered);
    // Snapshot options store isCorrect=false for non-learning modes — the
    // truth lives in correctKeys, so rebuild the flags from it on reveal.
    const correctKeys = s.correctKeys || [];
    return {
      ...s,
      correctKeys: reveal ? s.correctKeys : undefined,
      explanation: reveal ? s.explanation || '' : '',
      options: (s.options || []).map((o) => ({
        ...o,
        isCorrect: reveal ? correctKeys.includes(o.key) : false,
        explanation: reveal ? o.explanation || '' : '',
      })),
    };
  });
  return obj;
}

function shouldRevealAnswers(attempt, quiz) {
  if (attempt.mode === 'learning') return true;
  const showResults = quiz?.rules?.showResults || 'immediate';
  if (showResults === 'immediate' || showResults === 'after-submit') return true;
  if (showResults === 'after-deadline') return attempt.expiresAt && new Date() > attempt.expiresAt;
  return false; // 'manual' — answers are not released automatically
}

// Bump the daily streak on quiz completion
async function updateStreak(userId) {
  const user = await User.findById(userId).select('streak');
  if (!user) return;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const last = user.streak?.lastActiveDate ? new Date(user.streak.lastActiveDate) : null;
  if (last) last.setHours(0, 0, 0, 0);
  if (last && last.getTime() === today.getTime()) return; // already active today
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const current = last && last.getTime() === yesterday.getTime() ? (user.streak?.current || 0) + 1 : 1;
  user.streak = {
    current,
    longest: Math.max(user.streak?.longest || 0, current),
    lastActiveDate: new Date(),
  };
  await user.save();
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

  // Sequential gating — path checkpoints unlock in lesson order, and a
  // path's final assessment unlocks only after every checkpoint is passed.
  // Checked before resume so a stale in-progress attempt can't bypass it.
  const gate = await quizLock(quiz, req.user._id);
  if (gate.locked) throw new ApiError(423, gate.reason);

  // Resume an in-progress attempt — before the max-attempts check,
  // so a resumed attempt doesn't get rejected as a "new" attempt
  const existingInProgress = await Attempt.findOne({
    user: req.user._id,
    quiz: quizId,
    status: 'in-progress',
  });

  if (existingInProgress) {
    return sendSuccess(res, sanitizeAttempt(existingInProgress, quiz), 'Resuming existing attempt');
  }

  // Check max attempts (counts every attempt ever started, incl. expired)
  if (quiz.rules.maxAttempts > 0) {
    const existingAttempts = await Attempt.countDocuments({
      user: req.user._id,
      quiz: quizId,
      status: { $in: ['in-progress', 'submitted', 'scored', 'finalised', 'expired'] },
    });
    if (existingAttempts >= quiz.rules.maxAttempts) {
      throw ApiError.badRequest(`Maximum attempts (${quiz.rules.maxAttempts}) reached for this quiz`);
    }
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

    const correctKeys = currentVersion.options.filter((o) => o.isCorrect).map((o) => o.key);

    questionSnapshots.push({
      questionId: question._id,
      questionVersion: currentVersion.version,
      questionText: currentVersion.questionText,
      questionType: question.questionType,
      scenario: currentVersion.scenario || '',
      selectionCount: Math.max(1, correctKeys.length),
      options: currentVersion.options.map((o) => ({
        key: o.key,
        text: o.text,
        isCorrect: quiz.rules.mode === 'learning' ? o.isCorrect : false, // hide correct in assessment mode
        explanation: quiz.rules.mode === 'learning' ? o.explanation : '',
      })),
      correctKeys,
      explanation: currentVersion.explanation || '',
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
    negativeMarking: quiz.rules.negativeMarking || 0,
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

  sendSuccess(res, sanitizeAttempt(attempt, quiz), 'Attempt started', 201);
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
        explanation: quiz.rules.mode === 'learning' ? (snapshot.explanation || snapshot.options.find((o) => correctKeys.includes(o.key))?.explanation) : undefined,
        pointsAwarded,
      }
    : { pointsAwarded };

  sendSuccess(res, { attempt: sanitizeAttempt(attempt, quiz), feedback }, 'Answer submitted');
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
  if (attempt.expiresAt && new Date() > attempt.expiresAt) {
    attempt.status = 'expired';
    await attempt.save();
    throw ApiError.badRequest('Attempt has expired');
  }

  const quiz = await Quiz.findById(attempt.quiz);

  // Calculate final score. Negative marking deducts a fraction of each
  // question's points for wrong answers only — skipped questions always
  // score 0. The ratio is the one frozen on the attempt at start time.
  const negativeRatio = attempt.negativeMarking || 0;
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
        const penalty = snapshot.points * negativeRatio;
        if (penalty > 0) {
          earnedPoints -= penalty;
          response.pointsAwarded = -penalty;
        }
      }
      totalTimeSpent += response.timeSpent || 0;
    }
  }

  // A student's score can never drop below zero overall
  earnedPoints = Math.max(0, Math.round(earnedPoints * 100) / 100);
  attempt.earnedPoints = earnedPoints;
  attempt.percentage = attempt.totalPoints > 0 ? Math.round((earnedPoints / attempt.totalPoints) * 100) : 0;
  attempt.correctCount = correctCount;
  attempt.incorrectCount = incorrectCount;
  attempt.skippedCount = skippedCount;
  attempt.totalTimeSpent = totalTimeSpent;
  attempt.status = 'scored';
  attempt.submittedAt = new Date();
  attempt.scoredAt = new Date();

  // Award XP (learning mode only) — only on the FIRST finalised attempt of
  // this quiz, otherwise unlimited-retake quizzes become an XP farm
  if (attempt.mode === 'learning') {
    const priorFinalised = await Attempt.countDocuments({
      user: req.user._id,
      quiz: attempt.quiz,
      status: 'finalised',
      _id: { $ne: attempt._id },
    });
    const xpEarned = priorFinalised === 0 ? correctCount * 10 : 0;
    attempt.xpAwarded = xpEarned;
    if (xpEarned > 0) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { learningXP: xpEarned } });
    }
  }

  // Completing a quiz counts as daily activity
  await updateStreak(req.user._id);

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
    details: { percentage: attempt.percentage, correctCount, incorrectCount, skippedCount, negativeMarking: negativeRatio, totalQuestions: attempt.questionSnapshots.length },
  });

  sendSuccess(res, sanitizeAttempt(attempt, quiz), 'Attempt submitted and scored');
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

  const quiz = await Quiz.findById(attempt.quiz);
  sendSuccess(res, sanitizeAttempt(attempt, quiz), 'Attempt results');
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
    .select('quiz quizTitle mode status percentage correctCount incorrectCount skippedCount totalPoints earnedPoints xpAwarded startedAt submittedAt responses.questionSnapshotIndex questionSnapshots.questionId')
    .lean();

  // Surface lightweight progress counts (for resume cards) without shipping
  // the full snapshot/response payloads
  for (const a of attempts) {
    a.answeredCount = (a.responses || []).length;
    a.totalQuestions = (a.questionSnapshots || []).length;
    delete a.responses;
    delete a.questionSnapshots;
  }

  const total = await Attempt.countDocuments(query);

  sendSuccess(res, { attempts, total, page: Number(page), pages: Math.ceil(total / limit) }, 'Attempt history fetched');
});
