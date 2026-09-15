import { Quiz } from '../models/Quiz.js';
import { Question } from '../models/Question.js';
import { Mission } from '../models/Mission.js';
import { AuditLog } from '../models/AuditLog.js';
import { sendSuccess } from '../utils/sendResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// Create a quiz
export const createQuiz = asyncHandler(async (req, res) => {
  const {
    title, description, type, mode, timeLimit, maxAttempts,
    shuffleQuestions, shuffleOptions, showExplanations, showResults,
    passingScore, allowRetry, estimatedMinutes, difficulty,
    missionId, learningPathId, questionIds,
  } = req.body;

  if (!title) throw ApiError.badRequest('Quiz title is required');

  const quiz = new Quiz({
    title,
    description: description || '',
    type: type || 'mission-quiz',
    rules: {
      mode: mode || 'learning',
      timeLimit: timeLimit || 0,
      maxAttempts: maxAttempts || 0,
      shuffleQuestions: shuffleQuestions !== false,
      shuffleOptions: shuffleOptions !== false,
      showExplanations: showExplanations !== false,
      showResults: showResults || 'immediate',
      passingScore: passingScore || 60,
      allowRetry: allowRetry !== false,
    },
    mission: missionId || null,
    learningPath: learningPathId || null,
    estimatedMinutes: estimatedMinutes || 10,
    difficulty: difficulty || 'beginner',
    author: req.user._id,
    college: req.user.college || null,
    status: 'draft',
  });

  // Add questions if provided
  if (questionIds && Array.isArray(questionIds) && questionIds.length > 0) {
    quiz.questions = questionIds.map((qid, i) => ({
      question: qid,
      points: 10,
      order: i,
    }));
    quiz.totalQuestions = questionIds.length;
    quiz.totalPoints = questionIds.length * 10;
  }

  await quiz.save();

  // Link to mission if specified
  if (missionId) {
    await Mission.findByIdAndUpdate(missionId, { quiz: quiz._id });
  }

  await AuditLog.create({
    actor: req.user._id,
    actorRole: req.user.platformRole || req.user.role,
    action: 'quiz.create',
    resource: 'Quiz',
    resourceId: quiz._id,
  });

  sendSuccess(res, quiz, 'Quiz created', 201);
});

// List quizzes
export const listQuizzes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, type, missionId } = req.query;
  const query = {};
  if (status) query.status = status;
  if (type) query.type = type;
  if (missionId) query.mission = missionId;

  // Non-superadmins only see published quizzes or their college's quizzes
  if (req.user.platformRole !== 'superadmin' && req.user.platformRole !== 'content-admin') {
    query.$or = [
      { status: 'published', isPublished: true },
      { college: req.user.college },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const quizzes = await Quiz.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('mission', 'title slug')
    .populate('author', 'name');

  const total = await Quiz.countDocuments(query);

  sendSuccess(res, { quizzes, total, page: Number(page), pages: Math.ceil(total / limit) }, 'Quizzes fetched');
});

// Get a single quiz
export const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id)
    .populate({
      path: 'questions.question',
      select: 'questionType difficulty topic competency versions.questionText versions.options',
      populate: { path: 'competency', select: 'name code' },
    })
    .populate('mission', 'title slug')
    .populate('author', 'name');

  if (!quiz) throw ApiError.notFound('Quiz not found');

  // For students: don't reveal correct answers in the quiz listing
  // The attempt creation will snapshot questions
  sendSuccess(res, quiz, 'Quiz fetched');
});

// Publish a quiz
export const publishQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw ApiError.notFound('Quiz not found');
  if (quiz.questions.length === 0) throw ApiError.badRequest('Quiz has no questions');

  quiz.status = 'published';
  quiz.isPublished = true;
  await quiz.save();

  sendSuccess(res, quiz, 'Quiz published');
});

// Add questions to quiz
export const addQuestionsToQuiz = asyncHandler(async (req, res) => {
  const { questionIds } = req.body;
  if (!questionIds || !Array.isArray(questionIds)) throw ApiError.badRequest('questionIds array required');

  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw ApiError.notFound('Quiz not found');

  const existingIds = quiz.questions.map((q) => String(q.question));
  let order = quiz.questions.length;

  for (const qid of questionIds) {
    if (!existingIds.includes(String(qid))) {
      quiz.questions.push({ question: qid, points: 10, order: order++ });
    }
  }

  quiz.totalQuestions = quiz.questions.length;
  quiz.totalPoints = quiz.questions.length * 10;

  await quiz.save();
  sendSuccess(res, quiz, 'Questions added to quiz');
});
