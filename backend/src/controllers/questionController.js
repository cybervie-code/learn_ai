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
  const {
    page = 1, limit = 20, status, track, difficulty, competency, search,
    questionType, cognitiveLevel, tag, topic, author,
    sortBy = 'createdAt', sortOrder = 'desc',
  } = req.query;
  const query = {};
  if (status) query.status = status;
  if (track) query.track = track;
  if (difficulty) query.difficulty = difficulty;
  if (competency) query.competency = competency;
  if (questionType) query.questionType = questionType;
  if (cognitiveLevel) query.cognitiveLevel = cognitiveLevel;
  if (tag) query.tags = tag;
  if (topic) query.topic = { $regex: `^${topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' };
  if (author) query['versions.author'] = author;
  if (search) {
    query.$or = [
      { 'versions.questionText': { $regex: search, $options: 'i' } },
      { topic: { $regex: search, $options: 'i' } },
      { subtopic: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
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

// Question bank stats: counts by status, difficulty, track + analytics
export const getQuestionStats = asyncHandler(async (req, res) => {
  const [byStatus, byDifficulty, byTrack, agg] = await Promise.all([
    Question.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Question.aggregate([{ $group: { _id: '$difficulty', count: { $sum: 1 } } }]),
    Question.aggregate([{ $group: { _id: '$track', count: { $sum: 1 } } }]),
    Question.aggregate([{
      $group: {
        _id: null,
        total: { $sum: 1 },
        totalAttempts: { $sum: '$analytics.totalAttempts' },
        correctAttempts: { $sum: '$analytics.correctAttempts' },
      },
    }]),
  ]);

  const toMap = (arr) => arr.reduce((m, x) => ({ ...m, [x._id || 'unknown']: x.count }), {});
  const a = agg[0] || { total: 0, totalAttempts: 0, correctAttempts: 0 };

  sendSuccess(res, {
    total: a.total,
    byStatus: toMap(byStatus),
    byDifficulty: toMap(byDifficulty),
    byTrack: toMap(byTrack),
    analytics: {
      totalAttempts: a.totalAttempts,
      correctRate: a.totalAttempts > 0 ? Math.round((a.correctAttempts / a.totalAttempts) * 100) : 0,
    },
  }, 'Question stats fetched');
});

// Facets for filter dropdowns: distinct topics, subtopics, tags
export const getQuestionFacets = asyncHandler(async (req, res) => {
  const [topics, subtopics, tags] = await Promise.all([
    Question.distinct('topic'),
    Question.distinct('subtopic'),
    Question.distinct('tags'),
  ]);
  sendSuccess(res, {
    topics: topics.filter(Boolean).sort(),
    subtopics: subtopics.filter(Boolean).sort(),
    tags: tags.filter(Boolean).sort(),
  }, 'Question facets fetched');
});

// Bulk import questions (content roles)
export const bulkCreateQuestions = asyncHandler(async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw ApiError.badRequest('questions array is required');
  }
  if (questions.length > 500) throw ApiError.badRequest('Maximum 500 questions per import');

  const created = [];
  const errors = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    try {
      if (!q.questionText) throw new Error('questionText is required');
      if (!Array.isArray(q.options) || q.options.length < 2) throw new Error('at least 2 options required');
      if (!q.options.some((o) => o.isCorrect)) throw new Error('no correct option marked');

      const doc = await Question.create({
        questionType: q.questionType || 'single-choice',
        difficulty: q.difficulty || 'medium',
        cognitiveLevel: q.cognitiveLevel || 'understand',
        competency: q.competency || null,
        topic: q.topic || '',
        subtopic: q.subtopic || '',
        track: q.track || 'foundation',
        estimatedTime: q.estimatedTime || 60,
        tags: q.tags || [],
        status: q.publish === true ? 'published' : 'draft',
        publishedAt: q.publish === true ? new Date() : undefined,
        versions: [{
          version: 1,
          questionText: q.questionText,
          options: q.options.map((o, j) => ({
            key: o.key || String.fromCharCode(65 + j),
            text: o.text,
            isCorrect: o.isCorrect || false,
            explanation: o.explanation || '',
          })),
          explanation: q.explanation || '',
          scenario: q.scenario || '',
          hint: q.hint || '',
          source: q.source || '',
          author: req.user._id,
          createdAt: new Date(),
        }],
        currentVersion: 1,
      });
      created.push(doc._id);
    } catch (err) {
      errors.push({ index: i, error: err.message });
    }
  }

  await AuditLog.create({
    actor: req.user._id,
    actorRole: req.user.platformRole || req.user.role,
    action: 'question.bulkCreate',
    resource: 'Question',
    details: { created: created.length, failed: errors.length },
  });

  sendSuccess(res, { created: created.length, failed: errors.length, errors, ids: created }, 'Bulk import complete', 201);
});

// Bulk status change — validates each transition individually
export const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) throw ApiError.badRequest('ids array is required');
  if (!status) throw ApiError.badRequest('status is required');

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

  const results = { updated: 0, failed: [] };
  for (const id of ids) {
    const question = await Question.findById(id);
    if (!question) {
      results.failed.push({ id, error: 'Not found' });
      continue;
    }
    if (!validTransitions[question.status]?.includes(status)) {
      results.failed.push({ id, error: `Cannot transition ${question.status} → ${status}` });
      continue;
    }
    question.status = status;
    if (status === 'published') {
      question.publishedAt = new Date();
      const v = question.getCurrentVersion();
      v.reviewer = req.user._id;
      v.approvedAt = new Date();
    }
    await question.save();
    results.updated++;
  }

  await AuditLog.create({
    actor: req.user._id,
    actorRole: req.user.platformRole || req.user.role,
    action: 'question.bulkStatus',
    resource: 'Question',
    details: { status, updated: results.updated, failed: results.failed.length },
  });

  sendSuccess(res, results, `Bulk status update: ${results.updated} updated, ${results.failed.length} failed`);
});

// Duplicate a question (useful for variants)
export const duplicateQuestion = asyncHandler(async (req, res) => {
  const source = await Question.findById(req.params.id);
  if (!source) throw ApiError.notFound('Question not found');

  const v = source.getCurrentVersion();
  const copy = await Question.create({
    questionType: source.questionType,
    difficulty: source.difficulty,
    cognitiveLevel: source.cognitiveLevel,
    competency: source.competency,
    topic: source.topic,
    subtopic: source.subtopic,
    track: source.track,
    estimatedTime: source.estimatedTime,
    tags: source.tags,
    status: 'draft',
    versions: [{
      version: 1,
      questionText: v.questionText,
      options: v.options.map((o) => ({ key: o.key, text: o.text, isCorrect: o.isCorrect, explanation: o.explanation })),
      explanation: v.explanation,
      scenario: v.scenario,
      hint: v.hint,
      source: v.source,
      sourceDate: v.sourceDate,
      author: req.user._id,
      createdAt: new Date(),
    }],
    currentVersion: 1,
  });

  sendSuccess(res, copy, 'Question duplicated as draft', 201);
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
