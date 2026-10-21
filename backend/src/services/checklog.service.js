import Pass from '../models/Pass.js';
import CheckLog from '../models/CheckLog.js';
import AppError from '../utils/AppError.js';
import { getLimit } from '../utils/query.js';

export async function listCheckLogs(query = {}) {
  const filter = {};
  if (typeof query.action === 'string' && ['check-in', 'check-out'].includes(query.action)) {
    filter.action = query.action;
  }
  if (query.from || query.to) {
    filter.timestamp = {};
    if (query.from) {
      const from = new Date(query.from);
      if (!Number.isFinite(from.getTime())) throw new AppError('Invalid start date');
      filter.timestamp.$gte = from;
    }
    if (query.to) {
      const to = new Date(query.to);
      if (!Number.isFinite(to.getTime())) throw new AppError('Invalid end date');
      filter.timestamp.$lte = to;
    }
  }

  return {
    logs: await CheckLog.find(filter)
      .populate('visitor')
      .populate('pass')
      .populate('performedBy', 'name')
      .sort({ timestamp: -1 })
      .limit(getLimit(query.limit, 500, 5000))
  };
}

export async function recordPassAction(input = {}, performedBy, action) {
  const code = typeof input.code === 'string' ? input.code.trim().toUpperCase() : '';
  const note = typeof input.note === 'string' ? input.note.trim() : '';
  if (!code) throw new AppError('Pass code is required');

  const pass = await Pass.findOne({ code }).populate('visitor');
  if (!pass) throw new AppError('Pass code not found', 404);
  if (pass.status === 'revoked') throw new AppError('Pass has been revoked', 409);
  if (action === 'check-in' && pass.validUntil <= new Date()) {
    throw new AppError('Pass has expired', 409);
  }
  if (action === 'check-in' && !['active', 'checked-out'].includes(pass.status)) {
    throw new AppError('Visitor is already checked in or this pass was used', 409);
  }
  if (action === 'check-out' && pass.status !== 'checked-in') {
    throw new AppError('Visitor must be checked in before check-out', 409);
  }

  const updatedPass = await Pass.findOneAndUpdate(
    {
      _id: pass._id,
      status: action === 'check-in' ? { $in: ['active', 'checked-out'] } : 'checked-in',
      ...(action === 'check-in' ? { validUntil: { $gt: new Date() } } : {})
    },
    { status: action === 'check-in' ? 'checked-in' : 'checked-out' },
    { new: true, runValidators: true }
  ).populate('visitor');
  if (!updatedPass) {
    throw new AppError('Pass status changed; refresh and try again', 409);
  }

  const log = await CheckLog.create({
    pass: updatedPass._id,
    visitor: updatedPass.visitor._id,
    action,
    performedBy,
    note
  });
  return { pass: updatedPass, visitor: updatedPass.visitor, log };
}
