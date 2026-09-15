import mongoose from 'mongoose';

const { Schema } = mongoose;

const optionSchema = new Schema({
  key: { type: String, required: true }, // A, B, C, D
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
  explanation: { type: String, default: '' },
}, { _id: false });

const questionVersionSchema = new Schema({
  version: { type: Number, required: true },
  questionText: { type: String, required: true },
  options: [optionSchema],
  explanation: { type: String, default: '' }, // main explanation shown after answering
  scenario: { type: String, default: '' },
  hint: { type: String, default: '' },
  source: { type: String, default: '' },
  sourceDate: { type: Date, default: null },
  author: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const questionSchema = new Schema({
  // Taxonomy
  competency: { type: Schema.Types.ObjectId, ref: 'Competency', default: null },
  learningObjective: { type: String, default: '' },
  topic: { type: String, default: '' },
  subtopic: { type: String, default: '' },
  track: { type: String, enum: ['foundation', 'technical', 'applied', 'ai-security', 'career', 'branch-specific'], default: 'foundation' },

  // Question type
  questionType: {
    type: String,
    enum: ['single-choice', 'multiple-select', 'true-false', 'fill-blank', 'short-answer', 'scenario', 'ordering'],
    default: 'single-choice',
  },

  // Difficulty
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'expert'], default: 'medium' },
  cognitiveLevel: { type: String, enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'], default: 'understand' },

  // Estimated response time in seconds
  estimatedTime: { type: Number, default: 60 },

  // Language
  language: { type: String, default: 'en' },

  // Versioning - current version is the last in versions array
  versions: [questionVersionSchema],
  currentVersion: { type: Number, default: 1 },

  // Editorial workflow
  status: {
    type: String,
    enum: ['draft', 'technical-review', 'pedagogical-review', 'language-review', 'approved', 'scheduled', 'published', 'retired'],
    default: 'draft',
  },
  publishedAt: { type: Date, default: null },
  contentReviewDue: { type: Date, default: null },

  // Usage restrictions
  isPublic: { type: Boolean, default: true }, // available in public pool
  collegeRestrictions: [{ type: Schema.Types.ObjectId, ref: 'College' }], // if restricted to specific colleges

  // Item analytics (computed)
  analytics: {
    totalAttempts: { type: Number, default: 0 },
    correctAttempts: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 },
    skipRate: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
    pointBiserial: { type: Number, default: 0 },
    lastComputed: { type: Date, default: null },
  },

  // Tags
  tags: [String],
}, { timestamps: true });

questionSchema.index({ competency: 1, difficulty: 1 });
questionSchema.index({ status: 1, track: 1 });
questionSchema.index({ topic: 1 });

// Get current published version content
questionSchema.methods.getCurrentVersion = function () {
  return this.versions.find((v) => v.version === this.currentVersion) || this.versions[this.versions.length - 1];
};

export const Question = mongoose.model('Question', questionSchema);
