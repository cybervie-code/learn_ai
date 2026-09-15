import mongoose from 'mongoose';

const { Schema } = mongoose;

const externalIdentitySchema = new Schema({
  provider: { type: String, enum: ['google', 'microsoft', 'saml', 'magic-link'], required: true },
  providerSubject: { type: String, required: true }, // Google 'sub', not email
  email: String,
  hostedDomain: String, // Google 'hd' claim
  rawClaims: Schema.Types.Mixed,
}, { _id: false });

const userSchema = new Schema({
  // Identity
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  avatarUrl: { type: String, default: '' },
  password: { type: String, select: false }, // only for email/password accounts
  emailVerified: { type: Boolean, default: false },

  // External identities (Google sub, etc.)
  externalIdentities: [externalIdentitySchema],

  // Role within platform
  platformRole: {
    type: String,
    enum: ['superadmin', 'platform-ops', 'content-admin', 'content-author', 'support-agent', null],
    default: null,
  },

  // Role within a college
  role: {
    type: String,
    enum: ['college-owner', 'college-admin', 'department-admin', 'faculty', 'placement-officer', 'student', 'read-only-auditor'],
    default: 'student',
  },

  // College (tenant) association
  college: { type: Schema.Types.ObjectId, ref: 'College', default: null },
  department: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
  cohort: { type: Schema.Types.ObjectId, ref: 'Cohort', default: null },

  // Student academic info
  rollNumber: { type: String, default: '' },
  programme: { type: String, default: '' },
  branch: { type: String, default: '' },
  graduationYear: { type: Number, default: null },
  currentSemester: { type: Number, default: null },

  // Profile
  bio: { type: String, default: '', maxlength: 500 },
  headline: { type: String, default: '', maxlength: 120 },
  isProfilePublic: { type: Boolean, default: false },
  publicDisplayName: { type: String, default: '' },

  // Gamification
  learningXP: { type: Number, default: 0 },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
  },
  badges: [{ type: Schema.Types.ObjectId, ref: 'Badge' }],

  // Status
  status: { type: String, enum: ['active', 'suspended', 'invited', 'deactivated'], default: 'invited' },
  dateOfBirth: { type: Date, default: null },
  isMinor: { type: Boolean, default: false },
  guardianVerified: { type: Boolean, default: false },

  // Consent
  consents: [{
    purpose: { type: String, required: true },
    granted: { type: Boolean, default: false },
    grantedAt: { type: Date, default: null },
    withdrawnAt: { type: Date, default: null },
    version: { type: String, default: '1.0' },
  }],

  // Timestamps for membership
  membershipStart: { type: Date, default: Date.now },
  membershipEnd: { type: Date, default: null },

  lastLoginAt: { type: Date, default: null },
}, { timestamps: true });

// Indexes
userSchema.index({ college: 1, role: 1 });
userSchema.index({ college: 1, cohort: 1 });
userSchema.index({ 'externalIdentities.provider': 1, 'externalIdentities.providerSubject': 1 });

// Virtual: full public profile URL slug
userSchema.virtual('profileSlug').get(function () {
  return this.publicDisplayName || this.name;
});

userSchema.set('toJSON', { virtuals: true });

export const User = mongoose.model('User', userSchema);
