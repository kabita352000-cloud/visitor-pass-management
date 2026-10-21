import { Router } from 'express';
import { checkIn, checkOut, getCheckLogs } from '../controllers/checklog.controller.js';
import { allow, auth } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.use(auth, allow('admin', 'security'));
router.get('/', asyncHandler(getCheckLogs));
router.post('/check-in', asyncHandler(checkIn));
router.post('/check-out', asyncHandler(checkOut));

export default router;
