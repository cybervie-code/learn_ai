import mongoose from 'mongoose';

const { Schema } = mongoose;

const quizQuestionRefSchema = new Schema({
  question: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  points: { type: Number, default: 10 },
  order: { type: Number, default: 0 },
}, { _id: false });

const quizRuleSchema = new Schema({
  mode: { type: String, enum: ['learning', 'assessment', 'competitive'], default: 'learning' },
  timeLimit: { type: Number, default: 0 }, // seconds, 0 = no limit
  maxAttempts: { type: Number, default: 0 }, // 0 = unlimited
  shuffleQuestions: { type: Boolean, default: true },
  shuffleOptions: { type: Boolean, default: true },
  showExplanations: { type: Boolean, default: true },
  showResults: { type: String, enum: ['immediate', 'after-submit', 'after-deadline', 'manual'], default: 'immediate' },
  passingScore: { type: Number, default: 60 }, // percentage
  allowRetry: { type: Boolean, default: true },
  isProctored: { type: Boolean, default: false },
}, { _id: false });

const quizSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, default: '' },
  description: { type: String, default: '' },
  type: { type: String, enum: ['mission-quiz', 'practice', 'assessment', 'competitive', 'placement'], default: 'mission-quiz' },

  // Questions
  questions: [quizQuestionRefSchema],
  // Pool-based: randomly select N questions from these pools
  questionPools: [{
    competency: { type: Schema.Types.ObjectId, ref: 'Competency' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'expert'] },
    count: { type: Number, default: 0 },
  }],
  totalQuestions: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },

  // Rules
  rules: { type: quizRuleSchema, default: () => ({}) },

  // Association
  mission: { type: Schema.Types.ObjectId, ref: 'Mission', default: null },
  learningPath: { type: Schema.Types.ObjectId, ref: 'LearningPath', default: null },

  // Status
  isPublished: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'in-review', 'published', 'retired'], default: 'draft' },
  version: { type: Number, default: 1 },

  // Ownership
  author: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  college: { type: Schema.Types.ObjectId, ref: 'College', default: null }, // null = platform-wide

  // Metadata
  competencies: [{ type: Schema.Types.ObjectId, ref: 'Competency' }],
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  estimatedMinutes: { type: Number, default: 10 },
}, { timestamps: true });

quizSchema.index({ mission: 1 });
quizSchema.index({ learningPath: 1 });
quizSchema.index({ status: 1 });

export const Quiz = mongoose.model('Quiz', quizSchema);
