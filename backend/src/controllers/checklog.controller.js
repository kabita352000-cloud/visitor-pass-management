import { listCheckLogs, recordPassAction } from '../services/checklog.service.js';

export async function getCheckLogs(req, res) {
  res.json(await listCheckLogs(req.query));
}

export async function checkIn(req, res) {
  const result = await recordPassAction(req.body || {}, req.user._id, 'check-in');
  res.json({ message: 'Visitor check-in successful', ...result });
}

export async function checkOut(req, res) {
  const result = await recordPassAction(req.body || {}, req.user._id, 'check-out');
  res.json({ message: 'Visitor check-out successful', ...result });
}
