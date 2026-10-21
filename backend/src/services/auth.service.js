import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { getJwtSecret } from '../middleware/auth.js';

export function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone
  };
}

function validateAccount(input = {}) {
  const { name, email, password, phone = '' } = input;
  if (![name, email, password].every(value => typeof value === 'string' && value.trim())) {
    throw new AppError('Name, email and password are required');
  }
  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters long');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new AppError('Enter a valid email address');
  }
  if (typeof phone !== 'string') {
    throw new AppError('Phone must be a string');
  }
  return { name: name.trim(), email: email.trim().toLowerCase(), password, phone: phone.trim() };
}

export async function registerUser(input = {}) {
  const account = validateAccount(input);
  if (await User.exists({ email: account.email })) {
    throw new AppError('Email is already registered', 409);
  }

  const user = await User.create({
    ...account,
    password: await bcrypt.hash(account.password, 12),
    role: 'visitor'
  });
  return serializeUser(user);
}

export async function registerAdmin(input = {}) {
  const configuredKey = process.env.ADMIN_SETUP_KEY;
  if (!configuredKey) {
    throw new AppError('Admin registration is not configured. Set ADMIN_SETUP_KEY in backend/.env.', 503);
  }
  if (configuredKey.length < 32) {
    throw new AppError('ADMIN_SETUP_KEY must be at least 32 characters long', 500);
  }

  const suppliedKey = typeof input.setupKey === 'string' ? input.setupKey : '';
  const configuredBuffer = Buffer.from(configuredKey);
  const suppliedBuffer = Buffer.from(suppliedKey);
  if (
    configuredBuffer.length !== suppliedBuffer.length ||
    !crypto.timingSafeEqual(configuredBuffer, suppliedBuffer)
  ) {
    throw new AppError('Invalid admin setup key', 401);
  }

  const account = validateAccount(input);
  await User.init();
  if (await User.exists({ role: 'admin' })) {
    throw new AppError('An admin account already exists. Sign in or ask an admin to create an account.', 409);
  }

  const user = await User.create({
    ...account,
    password: await bcrypt.hash(account.password, 12),
    role: 'admin',
    isBootstrapAdmin: true
  });
  return createSession(user);
}

async function authenticateUser(input = {}, requiredRole) {
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  const user = await User.findOne({ email }).select('+password');
  if (
    !user ||
    !user.loginEnabled ||
    !user.password ||
    !(await bcrypt.compare(password, user.password)) ||
    (requiredRole && user.role !== requiredRole)
  ) {
    throw new AppError('Invalid email or password', 401);
  }

  return createSession(user);
}

function createSession(user) {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
  return { token, user: serializeUser(user) };
}

export function loginUser(input = {}) {
  return authenticateUser(input);
}

export function loginAdmin(input = {}) {
  return authenticateUser(input, 'admin');
}
