import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import PasswordReset from '../models/PasswordReset.js';
import { sendMail } from '../utils/mailer.js';

// >8 chars, at least 1 uppercase, 1 lowercase, 1 special char
export const passwordSchema = z
  .string()
  .min(9, 'Password must be longer than 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character');

export function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export async function registerCustomer({ name, email, password }) {
  passwordSchema.parse(password);
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  return User.create({ name, email: email.toLowerCase(), passwordHash, role: 'customer' });
}

export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  return user;
}

export async function createStaff({ name, email, password }) {
  passwordSchema.parse(password);
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  return User.create({ name, email: email.toLowerCase(), passwordHash, role: 'staff' });
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email: email.toLowerCase() });
  // Always respond the same way so emails can't be enumerated.
  if (!user) return;
  await PasswordReset.deleteMany({ userId: user._id, used: false });
  const token = crypto.randomBytes(32).toString('hex');
  await PasswordReset.create({
    userId: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  });
  const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  await sendMail({
    to: user.email,
    subject: 'Reset your password',
    text: `Hi ${user.name},\n\nUse this link to reset your password (valid 1 hour, single use):\n${link}\n\nIf you did not request this, ignore this email.`
  });
}

export async function resetPassword({ token, password }) {
  passwordSchema.parse(password);
  const record = await PasswordReset.findOne({ tokenHash: hashToken(token), used: false });
  if (!record || record.expiresAt < new Date()) {
    const err = new Error('Invalid or expired reset token');
    err.status = 400;
    throw err;
  }
  record.used = true; // single-use: consume before updating
  await record.save();
  const passwordHash = await bcrypt.hash(password, 10);
  await User.updateOne({ _id: record.userId }, { passwordHash });
  await PasswordReset.deleteMany({ userId: record.userId }); // invalidate siblings
}
