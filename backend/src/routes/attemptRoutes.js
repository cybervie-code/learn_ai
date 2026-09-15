import { Router } from 'express';
import {
  startAttempt, submitAnswer, submitAttempt, getAttemptResults, getMyAttempts,
} from '../controllers/attemptController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.post('/start', asyncHandler(startAttempt));
router.post('/:attemptId/answer', asyncHandler(submitAnswer));
router.post('/:attemptId/submit', asyncHandler(submitAttempt));
router.get('/me', asyncHandler(getMyAttempts));
router.get('/:id/results', asyncHandler(getAttemptResults));

export default router;
