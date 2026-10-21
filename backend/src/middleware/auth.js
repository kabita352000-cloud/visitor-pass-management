import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret === 'replace_this_with_a_long_random_secret') {
    throw new AppError('JWT_SECRET must be a unique secret of at least 32 characters', 500);
  }
  return secret;
}

export async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  let payload;
  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch (error) {
    if (error.name === 'AppError') return next(error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  try {
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Account no longer exists' });
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

export const allow = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: 'You are not allowed to access this resource' });
  next();
};
