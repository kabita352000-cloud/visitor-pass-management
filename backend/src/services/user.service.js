import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { serializeUser } from './auth.service.js';
import { escapeRegex, getLimit } from '../utils/query.js';

const roles = ['admin', 'security', 'employee', 'visitor'];

export async function listUsers(query = {}) {
  const staffRoles = ['security', 'employee'];
  const filter = { role: { $in: staffRoles } };
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = ['name', 'email', 'phone'].map(field => ({ [field]: pattern }));
  }
  const limit = getLimit(query.limit);
  const [users, total] = await Promise.all([
    User.find(filter).select('-password -isBootstrapAdmin').sort({ createdAt: -1 }).limit(limit),
    User.countDocuments(filter)
  ]);

  return { total, users };
}

export async function createStaffUser(input = {}) {
  const { name, email, password, phone = '', role } = input;
  if (![name, email, password, role].every(value => typeof value === 'string' && value.trim())) {
    throw new AppError('Name, email, password and role are required');
  }
  if (!roles.includes(role)) throw new AppError('Choose a valid user role');
  if (password.length < 8) throw new AppError('Password must be at least 8 characters long');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new AppError('Enter a valid email address');
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    throw new AppError('Email is already registered', 409);
  }
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: await bcrypt.hash(password, 12),
    phone: typeof phone === 'string' ? phone.trim() : '',
    role
  });
  return serializeUser(user);
}
