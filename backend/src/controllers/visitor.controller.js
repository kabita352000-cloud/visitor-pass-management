import { listVisitors, registerVisitor } from '../services/visitor.service.js';

export async function getVisitors(req, res) {
  const { total, visitors } = await listVisitors(req.query);
  res.status(200).json({
    status: 'success',
    message: 'Visitors retrieved successfully',
    total,
    visitors
  });
}

export async function createVisitor(req, res) {
  const visitor = await registerVisitor(req.body || {}, req.user._id);
  res.status(201).json({ message: 'Visitor registered', visitor });
}
