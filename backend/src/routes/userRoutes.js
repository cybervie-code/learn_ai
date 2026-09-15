import { Router } from 'express';
import { listCollegeUsers, listAllUsers, updateUserStatus, updateUserRole } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, requirePlatformRole, authorizeAny } from '../middleware/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

// College admin: list users in their college
router.get('/college', authorize('college-admin', 'college-owner'), asyncHandler(listCollegeUsers));

// Superadmin: list all users
router.get('/all', requirePlatformRole('superadmin', 'platform-ops'), asyncHandler(listAllUsers));

// Update user status - college admin OR superadmin (OR logic, not AND)
router.patch('/:id/status', authorizeAny(['superadmin', 'platform-ops'], ['college-admin', 'college-owner']), asyncHandler(updateUserStatus));

// Update user role - college admin OR superadmin
router.patch('/:id/role', authorizeAny(['superadmin', 'platform-ops'], ['college-admin', 'college-owner']), asyncHandler(updateUserRole));

export default router;
