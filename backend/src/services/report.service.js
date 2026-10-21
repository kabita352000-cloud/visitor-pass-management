import CheckLog from '../models/CheckLog.js';
import AppError from '../utils/AppError.js';
import { getLimit } from '../utils/query.js';

function escapeCsv(value) {
  let text = String(value ?? '');
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function createCheckLogCsv(query = {}) {
  const filter = {};
  if (typeof query.action === 'string' && ['check-in', 'check-out'].includes(query.action)) {
    filter.action = query.action;
  }
  if (query.from || query.to) {
    filter.timestamp = {};
    if (query.from) {
      filter.timestamp.$gte = new Date(query.from);
      if (!Number.isFinite(filter.timestamp.$gte.getTime())) throw new AppError('Invalid start date');
    }
    if (query.to) {
      filter.timestamp.$lte = new Date(query.to);
      if (!Number.isFinite(filter.timestamp.$lte.getTime())) throw new AppError('Invalid end date');
    }
  }
  const logs = await CheckLog.find(filter)
    .populate('visitor')
    .populate('pass')
    .populate('performedBy', 'name')
    .sort({ timestamp: -1 })
    .limit(getLimit(query.limit, 5000, 5000));
  const rows = [
    ['Timestamp', 'Action', 'Visitor', 'Phone', 'Company', 'Host', 'Pass code', 'Staff', 'Note']
      .map(escapeCsv)
      .join(',')
  ];
  for (const log of logs) {
    rows.push([
      log.timestamp?.toISOString(),
      log.action,
      log.visitor?.name,
      log.visitor?.phone,
      log.visitor?.company,
      log.visitor?.host,
      log.pass?.code,
      log.performedBy?.name,
      log.note
    ].map(escapeCsv).join(','));
  }
  return rows.join('\n');
}
