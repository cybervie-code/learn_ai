import mongoose from 'mongoose';

const { Schema } = mongoose;

const eligibleStudentSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, default: '', trim: true },
  mobile: { type: String, default: '', trim: true },
  hackathonName: { type: String, default: 'AI Engineering Hackathon' },
  status: { type: String, enum: ['pending', 'active'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

export const EligibleStudent = mongoose.model('EligibleStudent', eligibleStudentSchema);
