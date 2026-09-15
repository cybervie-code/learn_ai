import mongoose from 'mongoose';

const { Schema } = mongoose;

const verifiedDomainSchema = new Schema({
  domain: { type: String, required: true, lowercase: true },
  verificationMethod: { type: String, enum: ['dns-txt', 'email-token', 'google-workspace', 'manual'], default: 'dns-txt' },
  verificationToken: String,
  verified: { type: Boolean, default: false },
  verifiedAt: { type: Date, default: null },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, { _id: false });

const identityProviderSchema = new Schema({
  type: { type: String, enum: ['google', 'microsoft', 'saml', 'magic-link', 'csv-roster'], required: true },
  configured: { type: Boolean, default: false },
  config: Schema.Types.Mixed,
}, { _id: false });

const subscriptionSchema = new Schema({
  plan: { type: String, enum: ['trial', 'essential', 'pro', 'enterprise'], default: 'trial' },
  status: { type: String, enum: ['active', 'suspended', 'expired', 'cancelled'], default: 'active' },
  seatLimit: { type: Number, default: 100 },
  seatsUsed: { type: Number, default: 0 },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, default: null },
  contractValue: { type: Number, default: 0 },
}, { _id: false });

const collegeSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  legalName: { type: String, default: '' },
  shortCode: { type: String, default: '', uppercase: true },
  website: { type: String, default: '' },
  logoUrl: { type: String, default: '' },

  // Lifecycle
  lifecycle: {
    type: String,
    enum: ['lead', 'trial', 'verification', 'contracted', 'identity-configured', 'pilot-active', 'fully-active', 'renewal-due', 'suspended', 'expired'],
    default: 'lead',
  },

  // Domains
  domains: [verifiedDomainSchema],
  identityProviders: [identityProviderSchema],

  // Subscription
  subscription: { type: subscriptionSchema, default: () => ({}) },

  // Branding
  primaryColor: { type: String, default: '#6366f1' },
  secondaryColor: { type: String, default: '#8b5cf6' },

  // Location
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: 'India' },

  // AICTE / accreditation
  aicteId: { type: String, default: '' },
  accreditation: { type: String, default: '' },

  // Admins
  owner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],

  // Account management
  accountManager: { type: String, default: '' },
  supportNotes: { type: String, default: '' },

  // Data
  dataRegion: { type: String, default: 'ap-south-1' },
  retentionPolicy: { type: String, default: 'standard' },

  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
}, { timestamps: true });

collegeSchema.index({ name: 1 });
collegeSchema.index({ 'domains.domain': 1 });

export const College = mongoose.model('College', collegeSchema);
