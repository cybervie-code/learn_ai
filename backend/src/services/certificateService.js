import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EligibleStudent } from '../models/EligibleStudent.js';
import { Certificate } from '../models/Certificate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CERTIFICATES_DIR = path.join(__dirname, '../../public/certificates');
const TEMPLATE_PATH = path.join(__dirname, '../assets/hackathon-template.jpg');

export async function generateSerialNumber() {
  const year = new Date().getFullYear();
  const prefix = `CYB-${year}`;

  const lastCertificate = await Certificate.findOne({
    serialNumber: new RegExp(`^${prefix}-`),
  }).sort({ serialNumber: -1 });

  let sequence = 1;
  if (lastCertificate) {
    const parts = lastCertificate.serialNumber.split('-');
    const lastSequence = parseInt(parts[2], 10);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  const paddedSequence = sequence.toString().padStart(4, '0');
  return `${prefix}-${paddedSequence}`;
}

export async function checkEligibility(email) {
  const eligible = await EligibleStudent.findOne({ email: email.toLowerCase() });
  if (!eligible) return { isEligible: false, status: 'none' };
  const status = eligible.status || 'pending';
  return {
    isEligible: status === 'active',
    status,
    name: eligible.name
  };
}

const FONTS_DIR = path.join(__dirname, '../assets/fonts');
const NAME_FONT = path.join(FONTS_DIR, 'AlexBrush-Regular.ttf');
const SCRIPT_FONT = path.join(FONTS_DIR, 'PinyonScript-Regular.ttf');
const NAVY = '#12284c';

function baselineToTop(baselineY, size, ascentRatio = 0.75) {
  return baselineY - size * ascentRatio;
}

export async function generatePDF(certificateData) {
  const { serialNumber, studentName, issueDate } = certificateData;

  if (!fs.existsSync(CERTIFICATES_DIR)) {
    fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
  }

  const pdfPath = path.join(CERTIFICATES_DIR, `${serialNumber}.pdf`);
  const doc = new PDFDocument({ size: [1024, 682], margin: 0 });

  const writeStream = fs.createWriteStream(pdfPath);
  doc.pipe(writeStream);

  // Background template
  if (fs.existsSync(TEMPLATE_PATH)) {
    doc.image(TEMPLATE_PATH, 0, 0, { width: 1024, height: 682 });
  }

  const date = issueDate ? new Date(issueDate) : new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  const dateStr = day + month + year; // DDMMYYYY (8 digits)

  // === Student Name ===
  // Name line: x=209–840, y=367. Name baseline should sit ~2px above the line.
  // Alex Brush renders visually smaller; 40pt ≈ 26px cap height.
  doc.font(NAME_FONT)
    .fontSize(40)
    .fillColor(NAVY)
    .text(studentName, 209, baselineToTop(362, 40, 0.82), { width: 631, align: 'center' });

  // === Date digits in top-right boxes (DDMMYYYY) ===
  // Boxes: dividers at x=844,865,886,906,927,948,968,988,1008 → centers below.
  // Box interior: y=82–105, vertical center ~93. Digits sit on baseline ~99.
  const boxCenters = [854.5, 875.5, 896, 916.5, 937.5, 958, 978, 998];
  doc.font('Helvetica-Bold').fontSize(13).fillColor(NAVY);
  for (let i = 0; i < 8; i++) {
    doc.text(dateStr[i] || '', boxCenters[i] - 10, baselineToTop(99, 13, 0.75), { width: 20, align: 'center' });
  }

  // === 'held on ________.' ===
  // Line: x=502–619, y=457. Date baseline ~2px above the line.
  const formattedDate = date.toLocaleDateString('en-GB');
  doc.font(SCRIPT_FONT).fontSize(20).fillColor(NAVY)
    .text(formattedDate, 472, baselineToTop(453, 20, 0.80), { width: 190, align: 'center' });

  // === Certificate ID — under the DDMMYYYY label row, spaced letterpress style ===
  doc.font('Helvetica').fontSize(9).fillColor('#3f5a7d')
    .text(`CERTIFICATE ID  :  ${serialNumber}`, 844, 128, { width: 165, align: 'center', characterSpacing: 0.6 });

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(pdfPath));
    writeStream.on('error', reject);
  });
}

export function getPublicPdfPath(serialNumber) {
  return `/public/certificates/${serialNumber}.pdf`;
}

export async function getCertificateByStudentId(studentId) {
  return await Certificate.findOne({ student: studentId });
}

export async function getCertificateBySerialNumber(serialNumber) {
  return await Certificate.findOne({ serialNumber });
}
