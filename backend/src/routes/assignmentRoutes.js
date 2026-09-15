import { Router } from 'express';
import { createAssignment, listAssignments, getAssignment, getAssignmentResults } from '../controllers/assignmentController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(listAssignments));
router.get('/:id', asyncHandler(getAssignment));
router.get('/:id/results', authorize('faculty', 'college-admin', 'placement-officer'), asyncHandler(getAssignmentResults));
router.post('/', authorize('faculty', 'college-admin'), asyncHandler(createAssignment));

export default router;
