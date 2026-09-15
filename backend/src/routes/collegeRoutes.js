import { Router } from 'express';
import {
  createCollege, listColleges, getCollege, updateCollege,
  addDomain, verifyDomain, removeDomain, getCollegeStats,
} from '../controllers/collegeController.js';
import { authenticate, } from '../middleware/auth.js';
import { requirePlatformRole } from '../middleware/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Superadmin only - college management
router.post('/', requirePlatformRole('superadmin', 'platform-ops'), asyncHandler(createCollege));
router.get('/', requirePlatformRole('superadmin', 'platform-ops'), asyncHandler(listColleges));
router.get('/stats/:id', asyncHandler(getCollegeStats));
router.get('/:id', asyncHandler(getCollege));
router.put('/:id', requirePlatformRole('superadmin', 'platform-ops'), asyncHandler(updateCollege));

// Domain management
router.post('/:id/domains', requirePlatformRole('superadmin', 'platform-ops'), asyncHandler(addDomain));
router.post('/:id/domains/verify', requirePlatformRole('superadmin'), asyncHandler(verifyDomain));
router.delete('/:id/domains', requirePlatformRole('superadmin', 'platform-ops'), asyncHandler(removeDomain));

export default router;
