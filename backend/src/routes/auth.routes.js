import { Router } from 'express';
import {
  adminLogin,
  createAdmin,
  getCurrentUser,
  login,
  register
} from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/register-admin', asyncHandler(createAdmin));
router.post('/admin/login', asyncHandler(adminLogin));
router.get('/me', auth, asyncHandler(getCurrentUser));

export default router;
