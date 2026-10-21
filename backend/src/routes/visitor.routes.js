import { Router } from 'express';
import { createVisitor, getVisitors } from '../controllers/visitor.controller.js';
import { allow, auth } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.use(auth, allow('admin', 'security', 'employee'));
router.get('/', asyncHandler(getVisitors));
router.post('/', asyncHandler(createVisitor));

export default router;
