import {
  loginAdmin,
  loginUser,
  registerAdmin,
  registerUser,
  serializeUser
} from '../services/auth.service.js';

export async function register(req, res) {
  const user = await registerUser(req.body || {});
  res.status(201).json({ message: 'Account created', user });
}

export async function login(req, res) {
  res.json(await loginUser(req.body || {}));
}

export async function createAdmin(req, res) {
  const result = await registerAdmin(req.body || {});
  res.status(201).json({ message: 'Admin account created', ...result });
}

export async function adminLogin(req, res) {
  res.json(await loginAdmin(req.body || {}));
}

export function getCurrentUser(req, res) {
  res.json({ user: serializeUser(req.user) });
}
