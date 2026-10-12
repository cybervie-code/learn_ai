import { Router } from 'express';
import {
  requestCertificate,
  getCertificateStatus,
  viewCertificate,
  downloadCertificate,
} from '../controllers/certificateController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/request', authenticate, asyncHandler(requestCertificate));
router.get('/status', authenticate, asyncHandler(getCertificateStatus));
router.get('/view/:serialNumber', authenticate, asyncHandler(viewCertificate));
router.get('/download/:serialNumber', authenticate, asyncHandler(downloadCertificate));

export default router;
