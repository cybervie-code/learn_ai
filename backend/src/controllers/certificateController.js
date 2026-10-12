import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApiError } from '../utils/ApiError.js';
import { Certificate } from '../models/Certificate.js';
import {
  checkEligibility,
  generateSerialNumber,
  generatePDF,
  getCertificateByStudentId,
  getCertificateBySerialNumber,
  getPublicPdfPath,
} from '../services/certificateService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CERTIFICATES_DIR = path.join(__dirname, '../../public/certificates');

export async function requestCertificate(req, res, next) {
  try {
    const user = req.user;

    const eligibleInfo = await checkEligibility(user.email);
    if (!eligibleInfo.isEligible) {
      throw ApiError.forbidden(
        eligibleInfo.status === 'pending' 
          ? 'Your certificate request is pending hackathon completion' 
          : 'You are not eligible for this certificate'
      );
    }

    const existingCertificate = await getCertificateByStudentId(user._id);
    if (existingCertificate) {
      return res.json({
        success: true,
        message: 'You have already requested this certificate',
        certificate: {
          serialNumber: existingCertificate.serialNumber,
          status: existingCertificate.status,
          issueDate: existingCertificate.issueDate,
        },
      });
    }

    const serialNumber = await generateSerialNumber();
    const displayName = eligibleInfo.name || user.name;

    const certificate = new Certificate({
      serialNumber,
      student: user._id,
      studentName: displayName,
      studentEmail: user.email,
      status: 'requested',
    });

    await certificate.save();

    try {
      await generatePDF({
        serialNumber,
        studentName: displayName,
        issueDate: certificate.issueDate,
      });
      certificate.pdfPath = getPublicPdfPath(serialNumber);
      certificate.status = 'generated';
      await certificate.save();
    } catch (err) {
      console.error('PDF generation error:', err);
    }

    res.json({
      success: true,
      message: certificate.status === 'generated'
        ? 'Certificate generated successfully!'
        : 'Certificate request submitted. It will be generated shortly.',
      certificate: {
        serialNumber,
        status: certificate.status,
        issueDate: certificate.issueDate,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getCertificateStatus(req, res, next) {
  try {
    const user = req.user;
    const eligibleInfo = await checkEligibility(user.email);
    const certificate = await getCertificateByStudentId(user._id);

    if (!certificate) {
      return res.json({
        success: true,
        hasCertificate: false,
        isEligible: eligibleInfo.isEligible,
        eligibilityStatus: eligibleInfo.status,
      });
    }

    res.json({
      success: true,
      hasCertificate: true,
      isEligible: eligibleInfo.isEligible,
      eligibilityStatus: eligibleInfo.status,
      certificate: {
        serialNumber: certificate.serialNumber,
        status: certificate.status,
        issueDate: certificate.issueDate,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function viewCertificate(req, res, next) {
  try {
    const { serialNumber } = req.params;
    const user = req.user;

    const certificate = await getCertificateBySerialNumber(serialNumber);
    if (!certificate) {
      throw ApiError.notFound('Certificate not found');
    }

    const isOwner = certificate.student.toString() === user._id.toString();
    const isAdmin = ['superadmin', 'platform-ops'].includes(user.platformRole);
    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('You do not have permission to view this certificate');
    }

    if (certificate.status !== 'generated' && certificate.status !== 'downloaded') {
      throw ApiError.badRequest('Certificate is not ready yet');
    }

    const filePath = path.join(CERTIFICATES_DIR, `${serialNumber}.pdf`);
    if (!fs.existsSync(filePath)) {
      await generatePDF({
        serialNumber,
        studentName: certificate.studentName,
        issueDate: certificate.issueDate,
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${serialNumber}.pdf"`);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

export async function downloadCertificate(req, res, next) {
  try {
    const { serialNumber } = req.params;
    const user = req.user;

    const certificate = await getCertificateBySerialNumber(serialNumber);
    if (!certificate) {
      throw ApiError.notFound('Certificate not found');
    }

    const isOwner = certificate.student.toString() === user._id.toString();
    const isAdmin = ['superadmin', 'platform-ops'].includes(user.platformRole);
    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('You do not have permission to download this certificate');
    }

    if (certificate.status !== 'generated' && certificate.status !== 'downloaded') {
      throw ApiError.badRequest('Certificate is not ready yet');
    }

    const filePath = path.join(CERTIFICATES_DIR, `${serialNumber}.pdf`);
    if (!fs.existsSync(filePath)) {
      await generatePDF({
        serialNumber,
        studentName: certificate.studentName,
        issueDate: certificate.issueDate,
      });
    }

    certificate.status = 'downloaded';
    await certificate.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${serialNumber}.pdf"`);
    res.download(filePath, `${serialNumber}.pdf`);
  } catch (err) {
    next(err);
  }
}


