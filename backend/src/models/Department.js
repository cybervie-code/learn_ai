import mongoose from 'mongoose';

const { Schema } = mongoose;

const departmentSchema = new Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, uppercase: true },
  college: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
  hod: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

departmentSchema.index({ college: 1, code: 1 }, { unique: true });

export const Department = mongoose.model('Department', departmentSchema);
