import { Router } from 'express';
import { getStats } from '../controllers/dashboard.controller.js';
import { allow, auth } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/stats', auth, allow('admin', 'security'), asyncHandler(getStats));

export default router;
