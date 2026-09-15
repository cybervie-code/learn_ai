import mongoose from 'mongoose';

const { Schema } = mongoose;

const otpTokenSchema = new Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  purpose: { type: String, enum: ['verify-email', 'reset-password'], required: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  sendCount: { type: Number, default: 1 },
  firstSentAt: { type: Date, default: Date.now },
  lastSentAt: { type: Date, default: Date.now },
}, { timestamps: true });

// One active token per (email, purpose)
otpTokenSchema.index({ email: 1, purpose: 1 }, { unique: true });

// Auto-remove expired tokens
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpToken = mongoose.model('OtpToken', otpTokenSchema);
