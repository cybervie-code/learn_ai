import { Router } from 'express';
import { createApplication, listApplications } from '../controllers/applicationController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePlatformRole } from '../middleware/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Public — landing page application form
router.post('/', asyncHandler(createApplication));

// Platform staff only — review submissions
router.get('/', authenticate, requirePlatformRole('superadmin', 'platform-ops'), asyncHandler(listApplications));

export default router;
