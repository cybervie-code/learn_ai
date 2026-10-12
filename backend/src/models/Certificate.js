import mongoose from 'mongoose';

const { Schema } = mongoose;

const certificateSchema = new Schema({
  serialNumber: { type: String, required: true, unique: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  issueDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['requested', 'generated', 'downloaded'],
    default: 'requested',
  },
  pdfPath: { type: String, default: '' },
  hackathonName: { type: String, default: 'AI Engineering Hackathon' },
  createdAt: { type: Date, default: Date.now },
});

certificateSchema.index({ student: 1 });

export const Certificate = mongoose.model('Certificate', certificateSchema);
