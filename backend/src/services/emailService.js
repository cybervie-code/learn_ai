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
    await getTransporter().sendMail({ from: fromAddress(), to, subject, html, text });
  } catch (err) {
    console.error('Email send failed:', err.message);
    throw ApiError.badRequest('Failed to send email. Please try again later.');
  }
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
