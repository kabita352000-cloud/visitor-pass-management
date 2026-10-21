import { createStaffUser, listUsers } from '../services/user.service.js';

export async function getUsers(req, res) {
  const { total, users } = await listUsers(req.query);
  res.status(200).json({
    status: 'success',
    message: 'Users retrieved successfully',
    total,
    users
  });
}

export async function createUser(req, res) {
  const user = await createStaffUser(req.body || {});
  res.status(201).json({ message: 'Account created', user });
}
