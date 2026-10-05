import nodemailer from 'nodemailer';
import { ApiError } from '../utils/ApiError.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw ApiError.badRequest('Email service is not configured on the server');
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

function fromAddress() {
  const addr = process.env.EMAIL_FROM || process.env.FROM_EMAIL || process.env.SMTP_USER;
  return addr.replace(/^"(.*)"$/, '$1'); // strip wrapping quotes if present
}

export async function sendEmail({ to, subject, html, text }) {
  try {
    return await getTransporter().sendMail({ from: fromAddress(), to, subject, html, text });
  } catch (err) {
    console.error('Email send failed:', err.message);
    throw ApiError.badRequest('Failed to send email. Please try again later.');
  }
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * Notification sent to admin when someone submits the landing-page
 * "Apply to the program" form.
 */
export async function sendApplicationEmail(application) {
  const to = process.env.ADMIN_NOTIFY_EMAIL || 'admin@cybervie.in';
  const subject = `New program application — ${application.name}`;
  const row = (label, value) => `
      <tr>
        <td style="padding:7px 12px;color:#94a3b8;font-size:13px;vertical-align:top;white-space:nowrap">${label}</td>
        <td style="padding:7px 12px;color:#e2e8f0;font-size:13px">${escapeHtml(value) || '—'}</td>
      </tr>`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0f172a;border-radius:12px;color:#e2e8f0">
      <h2 style="margin:0 0 8px;color:#818cf8">Cybervie</h2>
      <h3 style="margin:0 0 4px;color:#e2e8f0">New program application</h3>
      <p style="margin:0 0 16px;color:#94a3b8;font-size:13px">Submitted via the landing page "Apply to the program" form.</p>
      <table style="width:100%;border-collapse:collapse;background:#1e293b;border-radius:8px">
        ${row('Name', application.name)}
        ${row('Email', application.email)}
        ${row('Phone', application.phone)}
        ${row('Current role', application.currentRole)}
        ${row('Experience', application.yearsExperience)}
        ${row('Industry', application.industry)}
        ${row('Desired AI role', application.desiredAiRole)}
        ${row('Preferred track', application.preferredTrack)}
        ${row('Current skills', application.currentSkills)}
        ${row('Why transitioning', application.transitionReason)}
        ${row('LinkedIn', application.linkedin)}
      </table>
      <p style="margin:16px 0 0;color:#64748b;font-size:12px">Application ID: ${application._id} · Received ${new Date(application.createdAt).toLocaleString('en-IN')}</p>
    </div>
  `;

  const text = [
    'New program application',
    '',
    `Name: ${application.name}`,
    `Email: ${application.email}`,
    `Phone: ${application.phone}`,
    `Current role: ${application.currentRole}`,
    `Experience: ${application.yearsExperience}`,
    `Industry: ${application.industry}`,
    `Desired AI role: ${application.desiredAiRole}`,
    `Preferred track: ${application.preferredTrack}`,
    `Current skills: ${application.currentSkills}`,
    `Why transitioning: ${application.transitionReason}`,
    `LinkedIn: ${application.linkedin || '—'}`,
    '',
    `Application ID: ${application._id}`,
  ].join('\n');

  return sendEmail({ to, subject, html, text });
}

export async function sendOtpEmail(to, otp, purpose) {
  const isReset = purpose === 'reset-password';
  const subject = isReset
    ? 'Cybervie - Password reset code'
    : 'Cybervie - Verify your email';
  const heading = isReset ? 'Reset your password' : 'Verify your email';
  const bodyText = isReset
    ? 'Use the code below to reset your Cybervie password.'
    : 'Use the code below to verify your Cybervie account.';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f172a;border-radius:12px;color:#e2e8f0">
      <h2 style="margin:0 0 8px;color:#818cf8">Cybervie</h2>
      <h3 style="margin:0 0 12px;color:#e2e8f0">${heading}</h3>
      <p style="margin:0 0 16px;color:#94a3b8">${bodyText}</p>
      <div style="font-size:32px;letter-spacing:8px;font-weight:bold;background:#1e293b;padding:16px;text-align:center;border-radius:8px;color:#f8fafc">${otp}</div>
      <p style="margin:16px 0 0;color:#64748b;font-size:12px">This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>
    </div>
  `;
  const text = `${heading}\n\n${bodyText}\n\nCode: ${otp}\n\nThis code expires in 10 minutes.`;

  await sendEmail({ to, subject, html, text });
}

/**
 * Invite email sent when an admin creates an account for someone.
 * Contains a one-click link so they can set their own password.
 */
export async function sendInviteEmail(to, { name, role, collegeName, inviteUrl }) {
  const roleLabel = role.replace(/-/g, ' ');
  const subject = 'Cybervie - You have been invited';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f172a;border-radius:12px;color:#e2e8f0">
      <h2 style="margin:0 0 8px;color:#818cf8">Cybervie</h2>
      <h3 style="margin:0 0 12px;color:#e2e8f0">Welcome, ${name}</h3>
      <p style="margin:0 0 20px;color:#94a3b8">
        An account has been created for you as <strong style="color:#e2e8f0">${roleLabel}</strong>${collegeName ? ` at <strong style="color:#e2e8f0">${collegeName}</strong>` : ''}.
        Click the button below to set your password and activate your account.
      </p>
      <div style="text-align:center;margin:8px 0 20px">
        <a href="${inviteUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Activate your account</a>
      </div>
      <p style="margin:0 0 8px;color:#64748b;font-size:12px">Or paste this link into your browser:</p>
      <p style="margin:0 0 16px;word-break:break-all;font-size:12px"><a href="${inviteUrl}" style="color:#818cf8">${inviteUrl}</a></p>
      <p style="margin:16px 0 0;color:#64748b;font-size:12px">This link works once and expires in 72 hours. If it expires, use "Forgot password" on the sign-in page to activate your account instead.</p>
    </div>
  `;
  const text = `Welcome to Cybervie, ${name}\n\nAn account has been created for you as ${roleLabel}${collegeName ? ` at ${collegeName}` : ''}.\n\nOpen this link to set your password and activate your account:\n${inviteUrl}\n\nThis link works once and expires in 72 hours.`;

  await sendEmail({ to, subject, html, text });
}
