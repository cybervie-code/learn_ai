import {
  googleLogin,
  emailLogin,
  emailRegister,
  verifyEmailOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
} from '../services/authService.js';
import { sendSuccess } from '../utils/sendResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) throw ApiError.badRequest('idToken is required');
  const { user, token } = await googleLogin(idToken);
  sendSuccess(res, { user, token }, 'Google authentication successful');
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw ApiError.badRequest('Email and password required');
  const { user, token } = await emailLogin(email, password);
  sendSuccess(res, { user, token }, 'Login successful');
});

export const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) throw ApiError.badRequest('Email, password and name required');
  const result = await emailRegister({ email, password, name });
  sendSuccess(res, result, 'Verification code sent to your email', 201);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw ApiError.badRequest('Email and code required');
  const { user, token } = await verifyEmailOtp(email, otp);
  sendSuccess(res, { user, token }, 'Email verified successfully');
});

export const resend = asyncHandler(async (req, res) => {
  const { email, purpose } = req.body;
  if (!email) throw ApiError.badRequest('Email is required');
  await resendOtp(email, purpose || 'verify-email');
  sendSuccess(res, null, 'A new code has been sent to your email');
});

export const forgot = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw ApiError.badRequest('Email is required');
  await forgotPassword(email);
  sendSuccess(res, null, 'If this email is registered, a reset code has been sent');
});

export const reset = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    throw ApiError.badRequest('Email, code and new password are required');
  }
  await resetPassword(email, otp, newPassword);
  sendSuccess(res, null, 'Password reset successfully. Please sign in.');
});

export const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: req.user }, 'Current user fetched');
});
