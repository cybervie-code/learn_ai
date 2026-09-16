import { Router } from 'express';
import {
  createQuestion, listQuestions, getQuestion, updateQuestion,
  updateQuestionStatus, deleteQuestion, getQuestionStats, getQuestionFacets,
  bulkCreateQuestions, bulkUpdateStatus, duplicateQuestion,
} from '../controllers/questionController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePlatformRole, authorizeAny } from '../middleware/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

// Content authors and admins can create/edit
router.post('/', requirePlatformRole('content-author', 'content-admin', 'superadmin'), asyncHandler(createQuestion));

// The question bank (incl. answer keys) is staff-only — students must never
// be able to read correct answers outside of an attempt
const questionBankReaders = authorizeAny(
  ['superadmin', 'platform-ops', 'content-admin', 'content-author', 'support-agent'],
  ['faculty', 'college-admin', 'college-owner', 'department-admin', 'placement-officer', 'read-only-auditor']
);
router.get('/', questionBankReaders, asyncHandler(listQuestions));

// Question bank power endpoints — must be before /:id
router.get('/stats', questionBankReaders, asyncHandler(getQuestionStats));
router.get('/facets', questionBankReaders, asyncHandler(getQuestionFacets));
router.post('/bulk', requirePlatformRole('content-author', 'content-admin', 'superadmin'), asyncHandler(bulkCreateQuestions));
router.patch('/bulk-status', requirePlatformRole('content-admin', 'superadmin'), asyncHandler(bulkUpdateStatus));

router.get('/:id', questionBankReaders, asyncHandler(getQuestion));
router.put('/:id', requirePlatformRole('content-author', 'content-admin', 'superadmin'), asyncHandler(updateQuestion));
router.patch('/:id/status', requirePlatformRole('content-admin', 'superadmin'), asyncHandler(updateQuestionStatus));
router.post('/:id/duplicate', requirePlatformRole('content-author', 'content-admin', 'superadmin'), asyncHandler(duplicateQuestion));
router.delete('/:id', requirePlatformRole('content-admin', 'superadmin'), asyncHandler(deleteQuestion));

export default router;
