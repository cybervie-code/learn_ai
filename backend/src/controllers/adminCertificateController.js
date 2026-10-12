import { ApiError } from '../utils/ApiError.js';
import { Certificate } from '../models/Certificate.js';
import { EligibleStudent } from '../models/EligibleStudent.js';

export async function getAllCertificates(req, res, next) {
  try {
    const certificates = await Certificate.find()
      .populate('student', 'name email college')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      certificates: certificates.map((cert) => ({
        id: cert._id,
        serialNumber: cert.serialNumber,
        studentName: cert.studentName,
        studentEmail: cert.studentEmail,
        issueDate: cert.issueDate,
        status: cert.status,
        student: cert.student,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function addEligibleStudents(req, res, next) {
  try {
    const { emails, students } = req.body;
    const entries = Array.isArray(students) ? students : Array.isArray(emails) ? emails.map(e => ({ email: e })) : [];

    if (entries.length === 0) {
      throw ApiError.badRequest('Emails or students array is required');
    }

    let addedCount = 0;
    const duplicates = [];

    for (const entry of entries) {
      const email = (entry.email || entry).toLowerCase().trim();
      const name = entry.name || '';
      const mobile = entry.mobile || '';
      if (!email) continue;

      const existing = await EligibleStudent.findOne({ email });
      if (existing) {
        if (name && !existing.name) {
          existing.name = name;
          if (mobile) existing.mobile = mobile;
          await existing.save();
        }
        duplicates.push(email);
      } else {
        await EligibleStudent.create({ email, name, mobile });
        addedCount++;
      }
    }

    res.json({
      success: true,
      message: `Added ${addedCount} eligible students`,
      addedCount,
      duplicates,
    });
  } catch (err) {
    next(err);
  }
}

export async function removeEligibleStudent(req, res, next) {
  try {
    const { email } = req.params;
    const normalizedEmail = email.toLowerCase();

    const result = await EligibleStudent.deleteOne({ email: normalizedEmail });

    if (result.deletedCount === 0) {
      throw ApiError.notFound('Email not found in eligible list');
    }

    res.json({
      success: true,
      message: 'Email removed from eligible list',
    });
  } catch (err) {
    next(err);
  }
}

export async function getEligibleStudents(req, res, next) {
  try {
    const eligibleStudents = await EligibleStudent.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      eligibleStudents: eligibleStudents.map((es) => ({
        id: es._id,
        email: es.email,
        name: es.name,
        mobile: es.mobile,
        status: es.status || 'pending',
        hackathonName: es.hackathonName,
        createdAt: es.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateEligibleStatus(req, res, next) {
  try {
    const { email } = req.params;
    const { status } = req.body;

    if (!['pending', 'active'].includes(status)) {
      throw ApiError.badRequest('Invalid status');
    }

    const result = await EligibleStudent.findOneAndUpdate(
      { email: email.toLowerCase() },
      { status },
      { new: true }
    );

    if (!result) {
      throw ApiError.notFound('Email not found in eligible list');
    }

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      student: {
        email: result.email,
        name: result.name,
        status: result.status,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function activateAllEligible(req, res, next) {
  try {
    const result = await EligibleStudent.updateMany(
      { status: { $ne: 'active' } },
      { status: 'active' }
    );

    res.json({
      success: true,
      message: `Activated ${result.modifiedCount} pending eligible students`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    next(err);
  }
}
