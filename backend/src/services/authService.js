import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { College } from '../models/College.js';
import { ApiError } from '../utils/ApiError.js';
import { requestOtp, verifyOtp } from './otpService.js';

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

const googleClient = new OAuth2Client();

/**
 * Verify a Google ID token server-side.
 * Validates signature against Google's public keys, issuer, audience, expiry.
 * Extracts sub (stable ID), email, email_verified, hd (hosted domain).
 */
export async function verifyGoogleToken(idToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || clientId === 'your-google-client-id') {
    throw ApiError.badRequest('Google sign-in is not configured on the server');
  }
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: clientId,
    });
    return ticket.getPayload();
  } catch (err) {
    throw ApiError.unauthorized('Google token verification failed: ' + err.message);
  }
}

/**
 * Login or register a user via Google OAuth.
 * Validates hd claim against verified college domains.
 */
export async function googleLogin(idToken) {
  const claims = await verifyGoogleToken(idToken);

  const sub = claims.sub;
  if (!sub) throw ApiError.badRequest('Google token missing sub claim');

  const email = claims.email;
  const emailVerified = claims.email_verified;
  const hostedDomain = claims.hd; // Google Workspace hosted domain
  const name = claims.name || email.split('@')[0];
  const avatarUrl = claims.picture || '';

  if (!email) throw ApiError.badRequest('Google token missing email');
  if (!emailVerified) throw ApiError.badRequest('Email not verified by Google');

  // Resolve the college up front: the Google hosted-domain claim first, then
  // the email domain as fallback.
  let college = null;
  if (hostedDomain) {
    college = await College.findOne({
      'domains.domain': hostedDomain,
      'domains.verified': true,
    });
  }
  if (!college) {
    const emailDomain = email.split('@')[1];
    if (emailDomain && emailDomain !== 'gmail.com') {
      college = await College.findOne({
        'domains.domain': emailDomain,
        'domains.verified': true,
      });
    }
  }

  // Find existing user by Google sub
  let user = await User.findOne({
    'externalIdentities.provider': 'google',
    'externalIdentities.providerSubject': sub,
  });

  const googleIdentity = {
    provider: 'google',
    providerSubject: sub,
    email,
    hostedDomain: hostedDomain || '',
    rawClaims: { email_verified: emailVerified },
  };

  if (user) {
    attachCollegeIfWhitelisted(user, college);
    assertPlatformAccess(user);
    user.lastLoginAt = new Date();
    await user.save();
    return { user, token: signToken(user._id) };
  }

  // Existing account with the same email (e.g. created by a college admin or
  // seeded with email/password) - link the Google identity to it
  user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    attachCollegeIfWhitelisted(user, college);
    assertPlatformAccess(user);
    user.externalIdentities = user.externalIdentities || [];
    if (!user.externalIdentities.some((i) => i.provider === 'google' && i.providerSubject === sub)) {
      user.externalIdentities.push(googleIdentity);
    }
    if (!user.avatarUrl && avatarUrl) user.avatarUrl = avatarUrl;
    user.emailVerified = true;
    if (user.status === 'invited') user.status = 'active';
    user.lastLoginAt = new Date();
    await user.save();
    return { user, token: signToken(user._id) };
  }

  // New user - only verified college domains may self-register via Google
  if (!college) throw domainNotWhitelisted();

  user = new User({
    email,
    name,
    avatarUrl,
    role: 'student',
    college: college._id,
    status: 'active',
    emailVerified: true,
    externalIdentities: [googleIdentity],
    lastLoginAt: new Date(),
  });

  await user.save();
  return { user, token: signToken(user._id) };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validateCredentialsInput(email, password, name = null) {
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw ApiError.badRequest('Invalid email or password format');
  }
  if (!EMAIL_RE.test(email)) {
    throw ApiError.badRequest('Please provide a valid email address');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw ApiError.badRequest(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (name !== null && (typeof name !== 'string' || name.trim().length < 2)) {
    throw ApiError.badRequest('Please provide your full name');
  }
}

/**
 * Find a verified college matching the given email domain.
 */
async function findCollegeByEmailDomain(email) {
  const emailDomain = email.split('@')[1];
  const freeProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
  if (!emailDomain || freeProviders.includes(emailDomain)) return null;
  return College.findOne({
    'domains.domain': emailDomain,
    'domains.verified': true,
  });
}

const DOMAIN_GATE_MESSAGE =
  'Cybervie is only open to partnered colleges. Please sign in or register with your official college email address.';

function domainNotWhitelisted() {
  return ApiError.forbidden(DOMAIN_GATE_MESSAGE, { domainNotWhitelisted: true });
}

/**
 * Attach a verified-domain college to an account that predates the whitelist
 * (e.g. the domain was verified after the account was created).
 */
function attachCollegeIfWhitelisted(user, college) {
  if (!user.college && !user.platformRole && college) user.college = college._id;
}

/**
 * Only college-affiliated users and platform staff may access the platform.
 * Throws 403 for accounts with no college and no staff role.
 */
function assertPlatformAccess(user) {
  if (!user.college && !user.platformRole) throw domainNotWhitelisted();
}

/**
 * Email/password login. Verifies the password first, then checks account state
 * so we never reveal account status to someone without the right password.
 */
export async function emailLogin(email, password) {
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw ApiError.badRequest('Invalid email or password format');
  }
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) throw ApiError.unauthorized('Invalid credentials');
  if (!user.password) throw ApiError.unauthorized('Please use Google sign-in');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw ApiError.unauthorized('Invalid credentials');

  assertPlatformAccess(user);

  if (!user.emailVerified && user.status === 'invited') {
    throw ApiError.forbidden('Please verify your email to continue', { requiresVerification: true });
  }
  if (user.status !== 'active') throw ApiError.forbidden('Account is not active');

  user.lastLoginAt = new Date();
  await user.save();

  const userObj = user.toObject();
  delete userObj.password;

  return { user: userObj, token: signToken(user._id) };
}

/**
 * Register with email/password. Creates an unverified account and sends an OTP.
 * The account becomes active only after OTP verification.
 */
export async function emailRegister({ email, password, name }) {
  validateCredentialsInput(email, password, name);
  const normalizedEmail = email.toLowerCase();

  const college = await findCollegeByEmailDomain(normalizedEmail);
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email: normalizedEmail });

  // Self-registration requires a verified college domain. Accounts already
  // attached to a college (e.g. invited by an admin) or platform staff are
  // allowed through to complete the normal flow.
  if (!college && !(existing && (existing.college || existing.platformRole))) {
    throw domainNotWhitelisted();
  }

  if (existing) {
    if (existing.emailVerified) {
      throw ApiError.conflict('Email already registered. Please sign in.');
    }
    if (existing.status === 'suspended' || existing.status === 'deactivated') {
      throw ApiError.forbidden('This account is not active. Please contact support.');
    }
    // Unverified account re-registering - update details and resend OTP
    attachCollegeIfWhitelisted(existing, college);
    existing.name = name.trim();
    existing.password = hashedPassword;
    await existing.save();
    await requestOtp(normalizedEmail, 'verify-email');
    return { requiresVerification: true, email: normalizedEmail };
  }

  const user = new User({
    email: normalizedEmail,
    name: name.trim(),
    password: hashedPassword,
    role: 'student',
    college: college._id,
    status: 'invited',
    emailVerified: false,
  });

  await user.save();
  await requestOtp(normalizedEmail, 'verify-email');

  return { requiresVerification: true, email: normalizedEmail };
}

/**
 * Verify the signup OTP. Activates the account and returns a session token.
 */
export async function verifyEmailOtp(email, otp) {
  if (typeof email !== 'string' || typeof otp !== 'string') {
    throw ApiError.badRequest('Email and code are required');
  }
  const normalizedEmail = email.toLowerCase();

  await verifyOtp(normalizedEmail, otp, 'verify-email');

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw ApiError.badRequest('Account not found. Please register again.');

  assertPlatformAccess(user);

  user.emailVerified = true;
  if (user.status === 'invited') user.status = 'active';
  user.lastLoginAt = new Date();
  await user.save();

  return { user, token: signToken(user._id) };
}

/**
 * Resend an OTP. For reset-password we silently succeed for unknown emails
 * to avoid account enumeration.
 */
export async function resendOtp(email, purpose) {
  if (typeof email !== 'string') throw ApiError.badRequest('Email is required');
  if (!['verify-email', 'reset-password'].includes(purpose)) {
    throw ApiError.badRequest('Invalid purpose');
  }
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (purpose === 'verify-email') {
    if (!user) throw ApiError.badRequest('No account found. Please register first.');
    if (user.emailVerified) throw ApiError.badRequest('Email is already verified. Please sign in.');
  } else if (!user) {
    return; // silent success
  }

  await requestOtp(normalizedEmail, purpose);
}

/**
 * Start the forgot-password flow. Always succeeds silently for unknown emails.
 */
export async function forgotPassword(email) {
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    throw ApiError.badRequest('Please provide a valid email address');
  }
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return; // silent success - do not reveal whether the email exists

  await requestOtp(normalizedEmail, 'reset-password');
}

/**
 * Reset password using a valid reset OTP. Verifying the code also proves
 * mailbox ownership, so the email is marked verified.
 */
export async function resetPassword(email, otp, newPassword) {
  validateCredentialsInput(email, newPassword);
  const normalizedEmail = email.toLowerCase();

  await verifyOtp(normalizedEmail, otp, 'reset-password');

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw ApiError.badRequest('Account not found');

  user.password = await bcrypt.hash(newPassword, 10);
  user.emailVerified = true;
  if (user.status === 'invited') user.status = 'active';
  await user.save();
}

export { signToken };
