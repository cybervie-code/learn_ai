import { Router } from 'express';
import {
  createQuiz, listQuizzes, getQuiz, publishQuiz, addQuestionsToQuiz,
} from '../controllers/quizController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePlatformRole, authorize } from '../middleware/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.post('/', requirePlatformRole('content-author', 'content-admin', 'superadmin'), authorize('faculty', 'college-admin'), asyncHandler(createQuiz));
router.get('/', asyncHandler(listQuizzes));
router.get('/:id', asyncHandler(getQuiz));
router.patch('/:id/publish', requirePlatformRole('content-admin', 'superadmin'), authorize('faculty', 'college-admin'), asyncHandler(publishQuiz));
router.post('/:id/questions', requirePlatformRole('content-author', 'content-admin', 'superadmin'), authorize('faculty', 'college-admin'), asyncHandler(addQuestionsToQuiz));

export default router;
