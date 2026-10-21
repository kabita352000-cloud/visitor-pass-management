import { getDashboardStats } from '../services/dashboard.service.js';

export async function getStats(_req, res) {
  res.json(await getDashboardStats());
}
