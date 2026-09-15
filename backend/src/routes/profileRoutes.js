import { Router } from 'express';
import { getMyProfile, updateMyProfile, getPublicProfile } from '../controllers/profileController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/me', authenticate, asyncHandler(getMyProfile));
router.put('/me', authenticate, asyncHandler(updateMyProfile));
router.get('/:id', asyncHandler(getPublicProfile));

export default router;
