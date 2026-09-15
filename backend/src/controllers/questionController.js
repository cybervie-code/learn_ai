import { Question } from '../models/Question.js';
import { Competency } from '../models/Competency.js';
import { AuditLog } from '../models/AuditLog.js';
import { sendSuccess } from '../utils/sendResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// Create a question (content authors, admins)
export const createQuestion = asyncHandler(async (req, res) => {
  const {
    questionText, options, explanation, scenario, hint,
    questionType, difficulty, cognitiveLevel, competency,
    topic, subtopic, track, estimatedTime, tags, source, sourceDate,
  } = req.body;

  if (!questionText) throw ApiError.badRequest('Question text is required');
  if (!options || !Array.isArray(options) || options.length < 2) throw ApiError.badRequest('At least 2 options required');

  // Validate: at least one correct option
  const hasCorrect = options.some((o) => o.isCorrect);
  if (!hasCorrect) throw ApiError.badRequest('At least one option must be marked correct');

  const question = new Question({
    questionType: questionType || 'single-choice',
    difficulty: difficulty || 'medium',
    cognitiveLevel: cognitiveLevel || 'understand',
    competency: competency || null,
    topic: topic || '',
    subtopic: subtopic || '',
    track: track || 'foundation',
    estimatedTime: estimatedTime || 60,
    tags: tags || [],
    status: 'draft',
    versions: [{
      version: 1,
      questionText,
      options: options.map((o, i) => ({
        key: o.key || String.fromCharCode(65 + i),
        text: o.text,
        isCorrect: o.isCorrect || false,
        explanation: o.explanation || '',
      })),
      explanation: explanation || '',
      scenario: scenario || '',
      hint: hint || '',
      source: source || '',
      sourceDate: sourceDate || null,
      author: req.user._id,
      createdAt: new Date(),
    }],
    currentVersion: 1,
  });

  await question.save();

  await AuditLog.create({
    actor: req.user._id,
    actorRole: req.user.platformRole || req.user.role,
    action: 'question.create',
    resource: 'Question',
    resourceId: question._id,
  });

  sendSuccess(res, question, 'Question created', 201);
});

// List questions with filters
export const listQuestions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, track, difficulty, competency, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  const query = {};
  if (status) query.status = status;
  if (track) query.track = track;
  if (difficulty) query.difficulty = difficulty;
  if (competency) query.competency = competency;
  if (search) {
    query.$or = [
      { 'versions.questionText': { $regex: search, $options: 'i' } },
      { topic: { $regex: search, $options: 'i' } },
      { subtopic: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const questions = await Question.find(query)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .populate('competency', 'name code')
    .populate('versions.author', 'name');

  const total = await Question.countDocuments(query);

  sendSuccess(res, { questions, total, page: Number(page), pages: Math.ceil(total / limit) }, 'Questions fetched');
});

// Get a single question
export const getQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id)
    .populate('competency', 'name code')
    .populate('versions.author', 'name')
    .populate('versions.reviewer', 'name');
  if (!question) throw ApiError.notFound('Question not found');
  sendSuccess(res, question, 'Question fetched');
});

// Update question (creates a new version)
export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) throw ApiError.notFound('Question not found');

  const {
    questionText, options, explanation, scenario, hint,
    difficulty, cognitiveLevel, competency, topic, subtopic, track,
    estimatedTime, tags, source, sourceDate,
  } = req.body;

  // Create a new version
  const newVersionNum = question.currentVersion + 1;
  const newVersion = {
    version: newVersionNum,
    questionText: questionText || question.getCurrentVersion().questionText,
    options: options
      ? options.map((o, i) => ({
          key: o.key || String.fromCharCode(65 + i),
          text: o.text,
          isCorrect: o.isCorrect || false,
          explanation: o.explanation || '',
        }))
      : question.getCurrentVersion().options,
    explanation: explanation !== undefined ? explanation : question.getCurrentVersion().explanation,
    scenario: scenario !== undefined ? scenario : question.getCurrentVersion().scenario,
    hint: hint !== undefined ? hint : question.getCurrentVersion().hint,
    source: source || question.getCurrentVersion().source,
    sourceDate: sourceDate || question.getCurrentVersion().sourceDate,
    author: req.user._id,
    createdAt: new Date(),
  };

  question.versions.push(newVersion);
  question.currentVersion = newVersionNum;

  if (difficulty) question.difficulty = difficulty;
  if (cognitiveLevel) question.cognitiveLevel = cognitiveLevel;
  if (competency) question.competency = competency;
  if (topic) question.topic = topic;
  if (subtopic) question.subtopic = subtopic;
  if (track) question.track = track;
  if (estimatedTime) question.estimatedTime = estimatedTime;
  if (tags) question.tags = tags;

  await question.save();

  await AuditLog.create({
    actor: req.user._id,
    actorRole: req.user.platformRole || req.user.role,
    action: 'question.update',
    resource: 'Question',
    resourceId: question._id,
    details: { newVersion: newVersionNum },
  });

  sendSuccess(res, question, 'Question updated (new version created)');
});

// Update question status (workflow transitions)
export const updateQuestionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validTransitions = {
    draft: ['technical-review'],
    'technical-review': ['pedagogical-review', 'draft'],
    'pedagogical-review': ['language-review', 'draft'],
    'language-review': ['approved', 'draft'],
    approved: ['published', 'scheduled'],
    scheduled: ['published'],
    published: ['retired'],
    retired: [],
  };

  const question = await Question.findById(req.params.id);
  if (!question) throw ApiError.notFound('Question not found');

  const currentStatus = question.status;
  if (!validTransitions[currentStatus]?.includes(status)) {
    throw ApiError.badRequest(`Cannot transition from ${currentStatus} to ${status}`);
  }

  question.status = status;
  if (status === 'published') {
    question.publishedAt = new Date();
  }

  // If approving, record reviewer
  if (status === 'approved' || status === 'published') {
    const latestVersion = question.getCurrentVersion();
    latestVersion.reviewer = req.user._id;
    latestVersion.approvedAt = new Date();
  }

  await question.save();

  await AuditLog.create({
    actor: req.user._id,
    actorRole: req.user.platformRole || req.user.role,
    action: 'question.statusChange',
    resource: 'Question',
    resourceId: question._id,
    details: { from: currentStatus, to: status },
  });

  sendSuccess(res, question, `Question status changed to ${status}`);
});

// Delete question (soft delete - retire only)
export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) throw ApiError.notFound('Question not found');

  // Check if question has been used in attempts
  // For MVP: just retire
  question.status = 'retired';
  await question.save();

  sendSuccess(res, null, 'Question retired');
});
