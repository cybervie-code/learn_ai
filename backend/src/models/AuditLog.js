import mongoose from 'mongoose';

const { Schema } = mongoose;

const auditLogSchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  actorRole: { type: String, default: '' },
  action: { type: String, required: true }, // e.g., 'college.create', 'question.publish', 'attempt.submit'
  resource: { type: String, default: '' },
  resourceId: { type: Schema.Types.ObjectId, default: null },
  college: { type: Schema.Types.ObjectId, ref: 'College', default: null },
  details: Schema.Types.Mixed,
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});

auditLogSchema.index({ actor: 1, timestamp: -1 });
auditLogSchema.index({ college: 1, timestamp: -1 });
auditLogSchema.index({ action: 1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
