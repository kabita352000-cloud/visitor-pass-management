import User from '../models/User.js';
import Visitor from '../models/Visitor.js';
import AppError from '../utils/AppError.js';
import { escapeRegex, getLimit } from '../utils/query.js';

const searchableFields = ['name', 'email', 'phone', 'company', 'host'];

export async function listVisitors(query = {}) {
  const filter = {};
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = searchableFields.map(field => ({ [field]: pattern }));
  }
  const limit = getLimit(query.limit);
  const [visitors, total] = await Promise.all([
    Visitor.find(filter).sort({ createdAt: -1 }).limit(limit),
    Visitor.countDocuments(filter)
  ]);

  return { total, visitors };
}

export async function registerVisitor(input = {}, userId) {
  const { name, email = '', phone, company = '', purpose, host, photoUrl = '' } = input;
  if (![name, email, phone, purpose, host].every(value => typeof value === 'string' && value.trim())) {
    throw new AppError('Name, email, phone, purpose and host are required');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new AppError('Enter a valid email address');
  }
  if (typeof photoUrl !== 'string') {
    throw new AppError('Photo URL must be a string');
  }
  if (photoUrl) {
    try {
      const url = new URL(photoUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
    } catch {
      throw new AppError('Photo URL must be a valid HTTP or HTTPS URL');
    }
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser && existingUser.role !== 'visitor') {
    throw new AppError('This email belongs to a non-visitor account', 409);
  }

  const profile = {
    name: name.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    company: typeof company === 'string' ? company.trim() : '',
    purpose: purpose.trim(),
    host: host.trim(),
    photoUrl: typeof photoUrl === 'string' ? photoUrl.trim() : '',
    createdBy: userId
  };
  const visitorAccount = existingUser
    ? await User.findByIdAndUpdate(existingUser._id, { $set: profile }, { new: true, runValidators: true })
    : await User.create({ ...profile, role: 'visitor', loginEnabled: false });
  return Visitor.findOneAndUpdate(
    { email: normalizedEmail },
    { $set: { ...profile, account: visitorAccount._id } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
}
