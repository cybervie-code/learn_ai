import mongoose from 'mongoose';

const { Schema } = mongoose;

// Immutable snapshot of a question as it was when the attempt started
const questionSnapshotSchema = new Schema({
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  questionVersion: { type: Number, required: true },
  questionText: { type: String, required: true },
  questionType: { type: String, required: true },
  scenario: { type: String, default: '' },
  // How many options the student must pick — equals the count of correct
  // keys at snapshot time (safe to show: "Select TWO" is printed on the
  // question itself anyway)
  selectionCount: { type: Number, default: 1 },
  options: [{
    key: String,
    text: String,
    isCorrect: Boolean,
    explanation: String,
  }],
  correctKeys: [String],
  // Question-level explanation (version-level on the source question).
  // Hidden by sanitizeAttempt until the attempt's reveal rules allow it.
  explanation: { type: String, default: '' },
  points: { type: Number, default: 10 },
  optionOrder: [String], // shuffled order
  competency: Schema.Types.ObjectId,
  difficulty: String,
}, { _id: false });

const responseSchema = new Schema({
  questionSnapshotIndex: { type: Number, required: true },
  selectedKeys: [String],
  textAnswer: { type: String, default: '' },
  isCorrect: { type: Boolean, default: null },
  pointsAwarded: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 }, // seconds
  submittedAt: { type: Date, default: null },
  isReviewed: { type: Boolean, default: false },
}, { _id: false });

const attemptSchema = new Schema({
  // Identity
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  college: { type: Schema.Types.ObjectId, ref: 'College', default: null, index: true },

  // Quiz reference
  quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  quizVersion: { type: Number, default: 1 },
  quizTitle: { type: String, default: '' },

  // Mode
  mode: { type: String, enum: ['learning', 'assessment', 'competitive'], default: 'learning' },

  // Immutable snapshots
  questionSnapshots: [questionSnapshotSchema],
  responses: [responseSchema],

  // Scoring
  totalPoints: { type: Number, default: 0 },
  earnedPoints: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  incorrectCount: { type: Number, default: 0 },
  skippedCount: { type: Number, default: 0 },
  // Frozen copy of quiz.rules.negativeMarking taken at attempt start, so an
  // in-progress attempt always scores under the rules it began with
  negativeMarking: { type: Number, default: 0 },

  // State machine
  status: {
    type: String,
    enum: ['created', 'in-progress', 'submitted', 'scored', 'under-review', 'finalised', 'expired', 'cancelled', 'invalidated'],
    default: 'created',
    index: true,
  },

  // Timing
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date, default: null },
  scoredAt: { type: Date, default: null },
  finalisedAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  totalTimeSpent: { type: Number, default: 0 }, // seconds

  // Integrity
  integrityFlags: [{
    type: { type: String, enum: ['tab-switch', 'copy-paste', 'rapid-submit', 'duplicate-account', 'suspicious-pattern', 'other'] },
    detail: String,
    detectedAt: { type: Date, default: Date.now },
    reviewed: { type: Boolean, default: false },
  }],

  // Assignment link (if this attempt is for a faculty assignment)
  assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', default: null },

  // Accommodations
  accommodations: {
    extendedTime: { type: Number, default: 0 }, // extra seconds
    extraBreaks: { type: Boolean, default: false },
  },

  // XP awarded
  xpAwarded: { type: Number, default: 0 },

  // Audit
  scoreHistory: [{
    previousPercentage: Number,
    newPercentage: Number,
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    changedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

attemptSchema.index({ user: 1, quiz: 1, status: 1 });
attemptSchema.index({ user: 1, createdAt: -1 });
attemptSchema.index({ college: 1, status: 1 });

export const Attempt = mongoose.model('Attempt', attemptSchema);
