import { Application } from '../models/Application.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/sendResponse.js';
import { sendApplicationEmail } from '../services/emailService.js';

const REQUIRED = [
  'name', 'email', 'phone', 'currentRole', 'yearsExperience',
  'industry', 'currentSkills', 'desiredAiRole', 'preferredTrack', 'transitionReason',
];

// POST /api/applications — public landing-page application form
export async function createApplication(req, res) {
  const body = req.body || {};

  // Honeypot — bots fill the hidden "website" field; silently pretend success
  if (body.website) {
    return sendSuccess(res, { id: null }, 'Application received.', 201);
  }
  const missing = REQUIRED.filter((f) => !body[f] || !String(body[f]).trim());
  if (missing.length) {
    throw ApiError.badRequest('Please fill in all required fields.', { missing });
  }
  const email = String(body.email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw ApiError.badRequest('Please enter a valid email address.');
  }
  const application = await Application.create({
    name: String(body.name).trim(),
    email,
    phone: String(body.phone).trim(),
    currentRole: String(body.currentRole).trim(),
    yearsExperience: String(body.yearsExperience).trim(),
    industry: String(body.industry).trim(),
    currentSkills: String(body.currentSkills).trim(),
    desiredAiRole: String(body.desiredAiRole).trim(),
    preferredTrack: String(body.preferredTrack).trim(),
    transitionReason: String(body.transitionReason).trim(),
    linkedin: body.linkedin ? String(body.linkedin).trim() : '',
  });

  // Notify admin — a mail failure must not fail the submission (record is stored)
  try {
    const info = await sendApplicationEmail(application);
    console.log(`Application notification sent to admin (${info?.accepted?.join(', ') || 'ok'}), messageId: ${info?.messageId}`);
  } catch (err) {
    console.error('Application email notification failed:', err.message);
  }

  return sendSuccess(res, { id: application._id }, 'Application received.', 201);
}

// GET /api/applications — platform staff only
export async function listApplications(req, res) {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const applications = await Application.find(filter).sort({ createdAt: -1 }).limit(500);
  return sendSuccess(res, { applications, count: applications.length });
}
