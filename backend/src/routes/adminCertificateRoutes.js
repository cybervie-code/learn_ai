import { Router } from 'express';
import {
  getAllCertificates,
  addEligibleStudents,
  removeEligibleStudent,
  getEligibleStudents,
  updateEligibleStatus,
  activateAllEligible,
} from '../controllers/adminCertificateController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePlatformRole } from '../middleware/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/certificates', authenticate, requirePlatformRole('superadmin', 'platform-ops'), asyncHandler(getAllCertificates));
router.post('/eligible', authenticate, requirePlatformRole('superadmin', 'platform-ops'), asyncHandler(addEligibleStudents));
router.get('/eligible', authenticate, requirePlatformRole('superadmin', 'platform-ops'), asyncHandler(getEligibleStudents));
router.post('/eligible/activate-all', authenticate, requirePlatformRole('superadmin', 'platform-ops'), asyncHandler(activateAllEligible));
router.patch('/eligible/:email/status', authenticate, requirePlatformRole('superadmin', 'platform-ops'), asyncHandler(updateEligibleStatus));
router.delete('/eligible/:email', authenticate, requirePlatformRole('superadmin', 'platform-ops'), asyncHandler(removeEligibleStudent));

export default router;
