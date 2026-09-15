import mongoose from 'mongoose';

const { Schema } = mongoose;

const assignmentSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },

  // Ownership
  college: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  // Content
  quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
  learningPath: { type: Schema.Types.ObjectId, ref: 'LearningPath', default: null },

  // Targeting
  cohorts: [{ type: Schema.Types.ObjectId, ref: 'Cohort' }],
  departments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
  targetAllCollege: { type: Boolean, default: false },

  // Schedule
  startDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  endDate: { type: Date, default: null },

  // Settings
  weight: { type: Number, default: 0 }, // grade weight
  isGraded: { type: Boolean, default: true },
  allowLateSubmission: { type: Boolean, default: false },
  latePenalty: { type: Number, default: 0 }, // percentage per day

  // Status
  status: { type: String, enum: ['draft', 'published', 'closed', 'archived'], default: 'draft' },

  // Stats (computed)
  stats: {
    totalAssigned: { type: Number, default: 0 },
    totalStarted: { type: Number, default: 0 },
    totalSubmitted: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
  },
}, { timestamps: true });

assignmentSchema.index({ college: 1, status: 1 });
assignmentSchema.index({ college: 1, createdBy: 1 });

export const Assignment = mongoose.model('Assignment', assignmentSchema);
