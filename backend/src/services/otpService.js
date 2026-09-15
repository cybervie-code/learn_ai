import crypto from 'crypto';
import { OtpToken } from '../models/OtpToken.js';
import { ApiError } from '../utils/ApiError.js';
import { sendOtpEmail } from './emailService.js';

const OTP_TTL_MS = 10 * 60 * 1000;        // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000;     // 60 seconds between sends
const SEND_WINDOW_MS = 60 * 60 * 1000;    // 1 hour
const MAX_SENDS_PER_WINDOW = 5;
const MAX_ATTEMPTS = 5;

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(email, otp) {
  return crypto.createHash('sha256').update(`${email.toLowerCase()}:${otp}`).digest('hex');
}

/**
 * Create a fresh OTP for (email, purpose), replacing any existing one,
 * and send it by email. Enforces resend cooldown and hourly send cap.
 */
export async function requestOtp(email, purpose) {
  const normalizedEmail = email.toLowerCase();
  const now = Date.now();

  const existing = await OtpToken.findOne({ email: normalizedEmail, purpose });

  if (existing) {
    const sinceLast = now - existing.lastSentAt.getTime();
    if (sinceLast < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - sinceLast) / 1000);
      throw ApiError.badRequest(`Please wait ${wait}s before requesting a new code`);
    }
  }

  const sendCount = existing && (now - existing.firstSentAt.getTime() < SEND_WINDOW_MS)
    ? existing.sendCount + 1
    : 1;

  if (sendCount > MAX_SENDS_PER_WINDOW) {
    throw ApiError.badRequest('Too many codes requested. Please try again later.');
  }

  const otp = generateOtp();

  await OtpToken.findOneAndUpdate(
    { email: normalizedEmail, purpose },
    {
      otpHash: hashOtp(normalizedEmail, otp),
      expiresAt: new Date(now + OTP_TTL_MS),
      attempts: 0,
      sendCount,
      firstSentAt: existing && sendCount > 1 ? existing.firstSentAt : new Date(now),
      lastSentAt: new Date(now),
    },
    { upsert: true, new: true }
  );

  await sendOtpEmail(normalizedEmail, otp, purpose);
}

/**
 * Verify an OTP for (email, purpose). Consumes the token on success.
 * Throws ApiError.badRequest on any failure.
 */
export async function verifyOtp(email, otp, purpose) {
  const normalizedEmail = email.toLowerCase();
  const token = await OtpToken.findOne({ email: normalizedEmail, purpose });

  if (!token || token.expiresAt.getTime() < Date.now()) {
    throw ApiError.badRequest('Code expired or not requested. Please request a new one.');
  }

  if (token.attempts >= MAX_ATTEMPTS) {
    throw ApiError.badRequest('Too many incorrect attempts. Please request a new code.');
  }

  if (token.otpHash !== hashOtp(normalizedEmail, String(otp).trim())) {
    token.attempts += 1;
    await token.save();
    const remaining = MAX_ATTEMPTS - token.attempts;
    throw ApiError.badRequest(
      remaining > 0
        ? `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Too many incorrect attempts. Please request a new code.'
    );
  }

  await token.deleteOne();
}
