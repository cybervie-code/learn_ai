import { Router } from 'express';
import {
  createQuestion, listQuestions, getQuestion, updateQuestion,
  updateQuestionStatus, deleteQuestion,
} from '../controllers/questionController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePlatformRole, authorize } from '../middleware/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

// Content authors and admins can create/edit
router.post('/', requirePlatformRole('content-author', 'content-admin', 'superadmin'), asyncHandler(createQuestion));
router.get('/', asyncHandler(listQuestions));
router.get('/:id', asyncHandler(getQuestion));
router.put('/:id', requirePlatformRole('content-author', 'content-admin', 'superadmin'), asyncHandler(updateQuestion));
router.patch('/:id/status', requirePlatformRole('content-admin', 'superadmin'), asyncHandler(updateQuestionStatus));
router.delete('/:id', requirePlatformRole('content-admin', 'superadmin'), asyncHandler(deleteQuestion));

export default router;
