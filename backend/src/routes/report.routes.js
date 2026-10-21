import { Router } from 'express';
import { exportCheckLogs } from '../controllers/report.controller.js';
import { allow, auth } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/export.csv', auth, allow('admin', 'security', 'employee'), asyncHandler(exportCheckLogs));

export default router;
