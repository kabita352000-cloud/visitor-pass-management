import { createCheckLogCsv } from '../services/report.service.js';

export async function exportCheckLogs(req, res) {
  const csv = await createCheckLogCsv(req.query);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="visitor-check-logs.csv"');
  res.send(csv);
}
