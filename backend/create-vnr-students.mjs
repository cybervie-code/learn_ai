// One-off: create two VNRVJIET student accounts directly, bypassing the
// email OTP step (emailVerified=true, status=active) so they can log in
// immediately with email/password.
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './src/config/db.js';
import { User } from './src/models/User.js';
import { College } from './src/models/College.js';

const PASSWORD = 'admingeneratedpass@123';
const STUDENTS = [
  { email: '24071a12e0@vnrvjiet.in', name: 'Student 24071A12E0', rollNumber: '24071A12E0' },
  { email: '24071a3246@vnrvjiet.in', name: 'Student 24071A3246', rollNumber: '24071A3246' },
];

await connectDB();

const college = await College.findOne({
  'domains.domain': 'vnrvjiet.in',
  'domains.verified': true,
});
if (!college) throw new Error('College with verified domain vnrvjiet.in not found');
console.log('College:', college.name, `(${college._id})`);

const hashedPassword = await bcrypt.hash(PASSWORD, 10);

for (const s of STUDENTS) {
  const existing = await User.findOne({ email: s.email });
  if (existing) {
    existing.name = s.name;
    existing.rollNumber = s.rollNumber;
    existing.password = hashedPassword;
    existing.college = college._id;
    existing.role = 'student';
    existing.emailVerified = true;
    existing.status = 'active';
    await existing.save();
    console.log(`updated existing account: ${s.email}`);
    continue;
  }
  await User.create({
    email: s.email,
    name: s.name,
    rollNumber: s.rollNumber,
    password: hashedPassword,
    role: 'student',
    college: college._id,
    status: 'active',
    emailVerified: true,
    membershipStart: new Date(),
  });
  console.log(`created: ${s.email}`);
}

await mongoose.disconnect();
