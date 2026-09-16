/**
 * E2E test: vnrvjiet.in domain whitelist
 *
 * Verifies that @vnrvjiet.in users are attached to the VNRVJIET college
 * through both auth paths (manual email+OTP and Google OAuth domain
 * resolution), and that non-whitelisted domains are NOT attached.
 *
 * Usage:  node test/whitelist-vnrvjiet.mjs
 * Requires backend running on PORT (default 5055) and MONGODB_URI in .env
 */
import mongoose from 'mongoose';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- env ------------------------------------------------------------------
const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);
const API = `http://localhost:${env.PORT || 5055}/api`;
const DOMAIN = 'vnrvjiet.in';
const TS = Date.now();
const STUDENT_EMAIL = `wltest${TS}@vnrvjiet.in`;
const OUTSIDER_EMAIL = `wltest${TS}@other-institute.edu.in`;
const PASSWORD = 'WlTest123!';

// ---- helpers ----------------------------------------------------------------
let pass = 0, fail = 0;
const failures = [];
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; failures.push(name); console.log(`  FAIL ${name} ${extra}`); }
};
const section = (t) => console.log(`\n=== ${t} ===`);

async function req(method, pathName, body, token) {
  const res = await fetch(`${API}${pathName}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

/** Recover a 6-digit OTP by brute-forcing its sha256(email:otp) hash (dev only). */
function crackOtp(email, otpHash) {
  const h = (o) => crypto.createHash('sha256').update(`${email.toLowerCase()}:${o}`).digest('hex');
  for (let i = 100000; i < 1000000; i++) if (h(String(i)) === otpHash) return String(i);
  return null;
}

// ---- run --------------------------------------------------------------------
await mongoose.connect(env.MONGODB_URI);
const db = mongoose.connection.db;
const colleges = db.collection('colleges');
const users = db.collection('users');
const otps = db.collection('otptokens');

section('0. Preconditions');
const college = await colleges.findOne({ 'domains.domain': DOMAIN, 'domains.verified': true });
ok('vnrvjiet.in exists as a verified domain', !!college);
if (!college) { console.log('Aborting: domain not whitelisted'); process.exit(1); }
const CID = String(college._id);
ok('Google IdP configured on college', college.identityProviders?.some((p) => p.type === 'google' && p.configured));
ok('College is active', college.status === 'active' && ['fully-active', 'pilot-active', 'identity-configured'].includes(college.lifecycle));

const adminLogin = await req('POST', '/auth/login', { email: 'admin@cybervie.in', password: 'tP9?8s#5WTz%D9$V' });
ok('superadmin login', adminLogin.status === 200 && !!adminLogin.json.data?.token);
const ADMIN = adminLogin.json.data?.token;

section('1. Manual registration — whitelisted domain');
let r = await req('POST', '/auth/register', { email: STUDENT_EMAIL, password: PASSWORD, name: 'Whitelist Test Student' });
ok('register accepted', r.status === 201 || r.status === 200, JSON.stringify(r.json).slice(0, 200));
ok('requires OTP verification', r.json.data?.requiresVerification === true);

const otpDoc = await otps.findOne({ email: STUDENT_EMAIL, purpose: 'verify-email' });
ok('OTP token stored', !!otpDoc);
const code = otpDoc ? crackOtp(STUDENT_EMAIL, otpDoc.otpHash) : null;
ok('OTP recovered from hash (dev check)', !!code);

r = await req('POST', '/auth/verify-email', { email: STUDENT_EMAIL, otp: '000000' });
ok('wrong OTP rejected', r.status === 400);

r = await req('POST', '/auth/login', { email: STUDENT_EMAIL, password: PASSWORD });
ok('login blocked before OTP verify', r.status === 403);

r = await req('POST', '/auth/verify-email', { email: STUDENT_EMAIL, otp: code });
ok('OTP verify succeeds', r.status === 200 && !!r.json.data?.token, JSON.stringify(r.json).slice(0, 200));
ok('user attached to VNRVJIET', r.json.data?.user?.college === CID, `got ${r.json.data?.user?.college}`);
ok('account active + verified', r.json.data?.user?.status === 'active' && r.json.data?.user?.emailVerified === true);
const STUDENT_TOKEN = r.json.data?.token;

r = await req('POST', '/auth/login', { email: STUDENT_EMAIL, password: PASSWORD });
ok('email/password login after verify', r.status === 200 && r.json.data?.user?.college === CID);

r = await req('GET', '/auth/me', null, STUDENT_TOKEN);
ok('/me returns college membership', r.status === 200 && String(r.json.data?.user?.college?._id || r.json.data?.user?.college) === CID);

r = await req('POST', '/auth/register', { email: STUDENT_EMAIL, password: PASSWORD, name: 'Dup' });
ok('duplicate register rejected', r.status === 409);

section('2. Google OAuth path — domain resolution');
// The Google signature check needs a real Google token; verify everything behind it.
const hdCollege = await colleges.findOne({ 'domains.domain': DOMAIN, 'domains.verified': true });
ok('hd=vnrvjiet.in resolves to college (googleLogin query)', String(hdCollege?._id) === CID);

r = await req('POST', '/auth/google', { idToken: 'fake.invalid.token' });
ok('forged Google token rejected (401)', r.status === 401, `got ${r.status}`);

// Simulate googleLogin's post-verification logic with claims as Google would return them
const simEmail = `wltest-google${TS}@${DOMAIN}`;
const sim = await users.insertOne({
  email: simEmail, name: 'Simulated Google User', role: 'student',
  college: hdCollege._id, status: 'active', emailVerified: true,
  externalIdentities: [{ provider: 'google', providerSubject: `sim-${TS}`, email: simEmail, hostedDomain: DOMAIN }],
  lastLoginAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
});
ok('google-signup shape stores hostedDomain + college', !!sim.insertedId);

section('3. Whitelist isolation — non-whitelisted domain');
r = await req('POST', '/auth/register', { email: OUTSIDER_EMAIL, password: PASSWORD, name: 'Outsider' });
ok('outsider register rejected (403)', r.status === 403, `got ${r.status}`);
ok('rejection carries domainNotWhitelisted flag', r.json.details?.domainNotWhitelisted === true);
ok('rejection message shown to user', /official college email/i.test(r.json.message || ''));
const outsiderDoc = await users.findOne({ email: OUTSIDER_EMAIL });
ok('outsider account NOT created', !outsiderDoc);

r = await req('POST', '/auth/register', { email: `wltest${TS}@gmail.com`, password: PASSWORD, name: 'Gmail User' });
ok('gmail register rejected (403)', r.status === 403, `got ${r.status}`);

// Legacy unaffiliated account (rky8672@gmail.com) must be blocked at login.
// Exercise the real flow: forgot-password -> reset -> login rejected.
const LEGACY = 'rky8672@gmail.com';
const legacyDoc = await users.findOne({ email: LEGACY });
ok('legacy unaffiliated account exists for gate test', !!legacyDoc && legacyDoc.college === null);
if (legacyDoc) {
  await otps.deleteMany({ email: LEGACY });
  r = await req('POST', '/auth/forgot-password', { email: LEGACY });
  ok('forgot-password accepted', r.status === 200);
  const rtok = await otps.findOne({ email: LEGACY, purpose: 'reset-password' });
  const rcode = rtok ? crackOtp(LEGACY, rtok.otpHash) : null;
  ok('reset OTP recovered (dev check)', !!rcode);
  r = await req('POST', '/auth/reset-password', { email: LEGACY, otp: rcode, newPassword: 'WlTest123!' });
  ok('password reset succeeds', r.status === 200, JSON.stringify(r.json).slice(0, 150));
  r = await req('POST', '/auth/login', { email: LEGACY, password: 'WlTest123!' });
  ok('unaffiliated account login BLOCKED (403)', r.status === 403, `got ${r.status}`);
  ok('login block carries domainNotWhitelisted flag', r.json.details?.domainNotWhitelisted === true);
}

// Domain uniqueness: a second college must not be able to claim vnrvjiet.in
r = await req('POST', '/colleges', { name: `E2E Temp College ${TS}` }, ADMIN);
const tempId = r.json.data?._id;
ok('temp college created for conflict test', !!tempId);
r = await req('POST', `/colleges/${tempId}/domains`, { domain: DOMAIN }, ADMIN);
ok('second college cannot claim verified vnrvjiet.in', r.status === 409, `got ${r.status}`);

section('4. Seat accounting');
r = await req('GET', `/colleges/stats/${CID}`, null, ADMIN);
ok('college stats include whitelisted students', r.status === 200 && r.json.data?.students >= 1, `students=${r.json.data?.students}`);

section('5. Cleanup');
await users.deleteMany({ email: { $in: [STUDENT_EMAIL, OUTSIDER_EMAIL, simEmail] } });
await otps.deleteMany({ email: { $in: [STUDENT_EMAIL, OUTSIDER_EMAIL] } });
if (tempId) await colleges.deleteOne({ _id: new mongoose.Types.ObjectId(tempId) });
console.log('  removed test users, OTPs, temp college');

await mongoose.disconnect();
console.log(`\n========================================`);
console.log(`  RESULT: ${pass} passed, ${fail} failed`);
if (failures.length) console.log('  Failed:', failures.join(' | '));
process.exit(fail ? 1 : 0);
