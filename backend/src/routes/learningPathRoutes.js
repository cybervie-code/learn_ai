import { Router } from 'express';
import {
  listPaths, getPath, createPath, updatePath, togglePublishPath,
  getMissions, getMission, createMission, updateMission,
} from '../controllers/learningPathController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requirePlatformRole } from '../middleware/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Public routes (with optional auth for progress)
router.get('/', optionalAuth, asyncHandler(listPaths));
router.get('/missions', optionalAuth, asyncHandler(getMissions));
router.get('/:slug', optionalAuth, asyncHandler(getPath));
router.get('/mission/:slug', optionalAuth, asyncHandler(getMission));

// Admin routes
router.post('/', authenticate, requirePlatformRole('content-admin', 'superadmin'), asyncHandler(createPath));
router.put('/:id', authenticate, requirePlatformRole('content-admin', 'superadmin'), asyncHandler(updatePath));
router.patch('/:id/toggle-publish', authenticate, requirePlatformRole('content-admin', 'superadmin'), asyncHandler(togglePublishPath));
router.post('/missions', authenticate, requirePlatformRole('content-author', 'content-admin', 'superadmin'), asyncHandler(createMission));
router.put('/missions/:id', authenticate, requirePlatformRole('content-author', 'content-admin', 'superadmin'), asyncHandler(updateMission));

export default router;
