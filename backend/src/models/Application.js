import mongoose from 'mongoose';

const { Schema } = mongoose;

// Program application submitted from the public landing page (no auth required)
const applicationSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  currentRole: { type: String, required: true, trim: true, maxlength: 120 },
  yearsExperience: { type: String, required: true, trim: true, maxlength: 30 },
  industry: { type: String, required: true, trim: true, maxlength: 120 },
  currentSkills: { type: String, required: true, maxlength: 3000 },
  desiredAiRole: { type: String, required: true, trim: true, maxlength: 120 },
  preferredTrack: { type: String, required: true, trim: true, maxlength: 120 },
  transitionReason: { type: String, required: true, maxlength: 3000 },
  linkedin: { type: String, default: '', trim: true, maxlength: 300 },

  status: { type: String, enum: ['new', 'reviewed', 'contacted', 'archived'], default: 'new' },
}, { timestamps: true });

applicationSchema.index({ email: 1 });
applicationSchema.index({ status: 1, createdAt: -1 });

export const Application = mongoose.model('Application', applicationSchema);
