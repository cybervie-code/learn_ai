import { Router } from 'express';
import { getGlobalRankings, getCollegeRankings, getCollegeLeaderboard } from '../controllers/rankingController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/global', optionalAuth, asyncHandler(getGlobalRankings));
router.get('/college-leaderboard', optionalAuth, asyncHandler(getCollegeLeaderboard));
router.get('/college/:collegeId', authenticate, asyncHandler(getCollegeRankings));

export default router;
