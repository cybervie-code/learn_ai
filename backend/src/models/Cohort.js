import mongoose from 'mongoose';

const { Schema } = mongoose;

const cohortSchema = new Schema({
  name: { type: String, required: true, trim: true }, // e.g., "CSE 2024-2028"
  college: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
  programme: { type: String, default: '' },
  branch: { type: String, default: '' },
  academicYear: { type: String, default: '' }, // e.g., "2024-2025"
  semester: { type: Number, default: 1 },
  graduationYear: { type: Number, default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

cohortSchema.index({ college: 1, name: 1 }, { unique: true });

export const Cohort = mongoose.model('Cohort', cohortSchema);
