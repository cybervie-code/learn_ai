import mongoose from 'mongoose';

const { Schema } = mongoose;

const notificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true }, // 'assignment', 'badge', 'ranking', 'streak', 'system'
  title: { type: String, required: true },
  message: { type: String, default: '' },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  metadata: Schema.Types.Mixed,
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
