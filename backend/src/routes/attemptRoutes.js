import { Router } from 'express';
import {
  startAttempt, submitAnswer, submitAttempt, flagAttempt, getAttemptResults, getMyAttempts,
} from '../controllers/attemptController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

// Quiz attempts are a student-only activity
router.post('/start', authorize('student'), asyncHandler(startAttempt));
router.post('/:attemptId/answer', authorize('student'), asyncHandler(submitAnswer));
router.post('/:attemptId/submit', authorize('student'), asyncHandler(submitAttempt));
router.post('/:attemptId/flag', authorize('student'), asyncHandler(flagAttempt));
router.get('/me', authorize('student'), asyncHandler(getMyAttempts));
router.get('/:id/results', authorize('student'), asyncHandler(getAttemptResults));

export default router;
