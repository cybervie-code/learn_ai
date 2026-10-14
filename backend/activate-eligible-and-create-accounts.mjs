// One-off: activate all eligible hackathon students AND create login accounts
// for anyone missing one, so they can sign in and claim their certificate.
// Accounts are attached to the verified VNR college so they pass the
// platform's domain whitelist check. Existing users are NOT modified
// (passwords untouched); they are only ensured to be active/verified.
// Run: node activate-eligible-and-create-accounts.mjs
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './src/config/db.js';
import { EligibleStudent } from './src/models/EligibleStudent.js';
import { User } from './src/models/User.js';
import { College } from './src/models/College.js';

const PASSWORD = 'admingeneratedpass@123';

await connectDB();

const college = await College.findOne({
  'domains.domain': 'vnrvjiet.in',
  'domains.verified': true,
});
if (!college) throw new Error('College with verified domain vnrvjiet.in not found');
console.log('College:', college.name, `(${college._id})\n`);

// 1) Activate every eligible student so checkEligibility() passes
const activation = await EligibleStudent.updateMany(
  { status: { $ne: 'active' } },
  { status: 'active' }
);
console.log(`[ELIGIBLE] activated ${activation.modifiedCount} students`);

// 2) Create login accounts for eligible students who don't have one
const hashedPassword = await bcrypt.hash(PASSWORD, 10);
const eligibleStudents = await EligibleStudent.find({});

let created = 0;
let existing = 0;
let fixed = 0;

for (const es of eligibleStudents) {
  const email = es.email.toLowerCase().trim();
  const name = es.name || email.split('@')[0];

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    let changed = false;
    if (!existingUser.college) { existingUser.college = college._id; changed = true; }
    if (existingUser.status !== 'active') { existingUser.status = 'active'; changed = true; }
    if (!existingUser.emailVerified) { existingUser.emailVerified = true; changed = true; }
    if (!existingUser.name) { existingUser.name = name; changed = true; }
    if (changed) { await existingUser.save(); fixed++; }
    existing++;
    continue;
  }

  await User.create({
    email,
    name,
    password: hashedPassword,
    role: 'student',
    college: college._id,
    status: 'active',
    emailVerified: true,
    membershipStart: new Date(),
  });
  created++;
}

console.log(`\n=== DONE ===`);
console.log(`  Eligible active:  ${await EligibleStudent.countDocuments({ status: 'active' })}`);
console.log(`  Accounts created: ${created}`);
console.log(`  Already existed:  ${existing} (fixed: ${fixed})`);
console.log(`  Login password:   ${PASSWORD}`);

await mongoose.disconnect();
