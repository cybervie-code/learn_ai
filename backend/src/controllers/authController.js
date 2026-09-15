import { googleLogin, emailLogin, emailRegister } from '../services/authService.js';
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
  const { email, password, name, platformRole } = req.body;
  if (!email || !password || !name) throw ApiError.badRequest('Email, password and name required');
  const { user, token } = await emailRegister({ email, password, name, platformRole });
  sendSuccess(res, { user, token }, 'Registration successful', 201);
});

export const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: req.user }, 'Current user fetched');
});
