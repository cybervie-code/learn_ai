import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  googleAuth,
  login,
  register,
  verifyEmail,
  resend,
  forgot,
  reset,
  getMe,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Tighter limit on OTP-related endpoints (sends real emails)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: 429, message: 'Too many requests, please try again later.' },
});

router.post('/google', asyncHandler(googleAuth));
router.post('/login', asyncHandler(login));
router.post('/register', asyncHandler(register));
router.post('/verify-email', otpLimiter, asyncHandler(verifyEmail));
router.post('/resend-otp', otpLimiter, asyncHandler(resend));
router.post('/forgot-password', otpLimiter, asyncHandler(forgot));
router.post('/reset-password', otpLimiter, asyncHandler(reset));
router.get('/me', authenticate, asyncHandler(getMe));

export default router;
