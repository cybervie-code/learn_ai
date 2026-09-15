import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { College } from '../models/College.js';
import { ApiError } from '../utils/ApiError.js';

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
    // Existing user - update last login
    user.lastLoginAt = new Date();
    await user.save();
    return { user, token: signToken(user._id) };
  }

  // Existing account with the same email (e.g. created by a college admin or
  // seeded with email/password) - link the Google identity to it
  user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    user.externalIdentities = user.externalIdentities || [];
    if (!user.externalIdentities.some((i) => i.provider === 'google' && i.providerSubject === sub)) {
      user.externalIdentities.push(googleIdentity);
    }
    if (!user.avatarUrl && avatarUrl) user.avatarUrl = avatarUrl;
    if (user.status === 'invited') user.status = 'active';
    user.lastLoginAt = new Date();
    await user.save();
    return { user, token: signToken(user._id) };
  }

  // New user - determine college from hosted domain
  let college = null;
  if (hostedDomain) {
    college = await College.findOne({
      'domains.domain': hostedDomain,
      'domains.verified': true,
    });
  }

  // If no college found via hd, try email domain (fallback, less secure)
  if (!college) {
    const emailDomain = email.split('@')[1];
    if (emailDomain && emailDomain !== 'gmail.com') {
      college = await College.findOne({
        'domains.domain': emailDomain,
        'domains.verified': true,
      });
    }
  }

  // Create new user. If no verified college matches the domain the account is
  // still created as an unaffiliated student (college: null) - they can be
  // attached to a college later by an admin.
  user = new User({
    email,
    name,
    avatarUrl,
    role: 'student',
    college: college ? college._id : null,
    status: 'active',
    externalIdentities: [googleIdentity],
    lastLoginAt: new Date(),
  });

  await user.save();
  return { user, token: signToken(user._id) };
}

/**
 * Email/password login (for superadmin, content authors, dev mode)
 */
export async function emailLogin(email, password) {
  // Input type validation - prevent NoSQL injection via object payloads
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw ApiError.badRequest('Invalid email or password format');
  }
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) throw ApiError.unauthorized('Invalid credentials');
  if (user.status !== 'active') throw ApiError.forbidden('Account is not active');
  if (!user.password) throw ApiError.unauthorized('Please use Google sign-in');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw ApiError.unauthorized('Invalid credentials');

  user.lastLoginAt = new Date();
  await user.save();

  const userObj = user.toObject();
  delete userObj.password;

  return { user: userObj, token: signToken(user._id) };
}

/**
 * Register with email/password (superadmin seed or platform staff)
 */
export async function emailRegister({ email, password, name, platformRole }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('Email already registered');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = new User({
    email: email.toLowerCase(),
    name,
    password: hashedPassword,
    platformRole: platformRole || null,
    role: 'student',
    status: 'active',
  });

  await user.save();
  return { user, token: signToken(user._id) };
}

export { signToken };
