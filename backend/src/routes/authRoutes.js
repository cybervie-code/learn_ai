import { Router } from 'express';
import { googleAuth, login, register, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/google', asyncHandler(googleAuth));
router.post('/login', asyncHandler(login));
router.post('/register', asyncHandler(register));
router.get('/me', authenticate, asyncHandler(getMe));

export default router;
