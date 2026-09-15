import mongoose from 'mongoose';

const { Schema } = mongoose;

const missionRefSchema = new Schema({
  mission: { type: Schema.Types.ObjectId, ref: 'Mission', required: true },
  order: { type: Number, default: 0 },
}, { _id: false });

const learningPathSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  track: {
    type: String,
    enum: ['foundation', 'technical', 'applied', 'ai-security', 'career', 'branch-specific'],
    default: 'foundation',
  },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  estimatedHours: { type: Number, default: 0 },
  competencies: [{ type: Schema.Types.ObjectId, ref: 'Competency' }],
  missions: [missionRefSchema],
  prerequisites: [{ type: Schema.Types.ObjectId, ref: 'LearningPath' }],
  coverImage: { type: String, default: '' },
  icon: { type: String, default: '🧠' },
  isPublished: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  tags: [String],
  targetBranches: [String], // CSE, ECE, MECH, etc. Empty = all
}, { timestamps: true });

export const LearningPath = mongoose.model('LearningPath', learningPathSchema);
