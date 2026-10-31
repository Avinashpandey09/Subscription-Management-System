import { z } from 'zod';
import User from '../models/User.js';
import {
  registerCustomer,
  login,
  createStaff,
  requestPasswordReset,
  resetPassword,
  signToken,
  cookieOptions,
  passwordSchema
} from '../services/auth.service.js';

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: passwordSchema
});

export async function signup(req, res, next) {
  try {
    const data = signupSchema.parse(req.body);
    const user = await registerCustomer(data);
    const token = signToken(user);
    res.cookie('token', token, cookieOptions);
    res.status(201).json({ user });
  } catch (e) {
    next(e);
  }
}

export async function loginHandler(req, res, next) {
  try {
    const { email, password } = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const user = await login({ email, password });
    const token = signToken(user);
    res.cookie('token', token, cookieOptions);
    res.json({ user: user.toJSON() });
  } catch (e) {
    next(e);
  }
}

export function logout(req, res) {
  res.clearCookie('token', { ...cookieOptions, maxAge: undefined });
  res.json({ message: 'Logged out' });
}

export function me(req, res) {
  res.json({ user: req.user });
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    await requestPasswordReset(email);
    res.json({ message: 'If that email exists, a reset link was sent' });
  } catch (e) {
    next(e);
  }
}

export async function resetPasswordHandler(req, res, next) {
  try {
    const { token, password } = z.object({ token: z.string().min(1), password: z.string().min(1) }).parse(req.body);
    await resetPassword({ token, password });
    res.json({ message: 'Password reset successfully' });
  } catch (e) {
    next(e);
  }
}

// POST /api/admin/staff — admin only (route guard in admin.routes.js)
export async function createStaffHandler(req, res, next) {
  try {
    const data = signupSchema.parse(req.body);
    const staff = await createStaff(data);
    res.status(201).json({ user: staff.toJSON() });
  } catch (e) {
    next(e);
  }
}

export async function listStaff(req, res, next) {
  try {
    const staff = await User.find({ role: { $in: ['staff', 'admin'] } })
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ staff });
  } catch (e) {
    next(e);
  }
}

export async function deleteStaff(req, res, next) {
  try {
    const target = await User.findById(req.params.id);
    if (!target || target.role === 'customer') return res.status(404).json({ message: 'Staff member not found' });
    if (target._id.toString() === req.user.id) return res.status(400).json({ message: 'You cannot delete yourself' });
    await target.deleteOne();
    res.json({ message: 'Staff member removed' });
  } catch (e) {
    next(e);
  }
}
