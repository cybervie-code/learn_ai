import mongoose from 'mongoose';

const { Schema } = mongoose;

// Competency framework - maps to UNESCO AI Competency Framework + AICTE outcomes
const competencySchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  code: { type: String, required: true, unique: true, uppercase: true }, // e.g., AI-FOUND-01
  dimension: {
    type: String,
    enum: ['human-centered-mindset', 'ethics-of-ai', 'ai-techniques', 'ai-system-design', 'ai-security', 'career-readiness'],
    required: true,
  },
  level: { type: String, enum: ['understand', 'apply', 'create'], default: 'understand' },
  parent: { type: Schema.Types.ObjectId, ref: 'Competency', default: null },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Competency = mongoose.model('Competency', competencySchema);
