import mongoose from 'mongoose';

const { Schema } = mongoose;

const contentBlockSchema = new Schema({
  type: {
    type: String,
    enum: ['text', 'heading', 'image', 'video', 'interactive', 'code', 'callout', 'diagram'],
    required: true,
  },
  content: { type: String, default: '' },
  caption: { type: String, default: '' },
  url: { type: String, default: '' },
  altText: { type: String, default: '' },
  order: { type: Number, default: 0 },
}, { _id: false });

const missionSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  learningPath: { type: Schema.Types.ObjectId, ref: 'LearningPath', default: null, index: true },
  order: { type: Number, default: 0 },

  // Learning content
  contentBlocks: [contentBlockSchema],

  // Assessment
  quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', default: null },

  // Metadata
  estimatedMinutes: { type: Number, default: 10 },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  competencies: [{ type: Schema.Types.ObjectId, ref: 'Competency' }],
  learningObjectives: [String],

  // Status
  isPublished: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['draft', 'in-review', 'approved', 'published', 'retired'],
    default: 'draft',
  },

  // Versioning
  version: { type: Number, default: 1 },
  author: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  contentReviewDue: { type: Date, default: null },

  xpReward: { type: Number, default: 50 },
  icon: { type: String, default: '📘' },
  tags: [String],
}, { timestamps: true });

missionSchema.index({ learningPath: 1, order: 1 });

export const Mission = mongoose.model('Mission', missionSchema);
