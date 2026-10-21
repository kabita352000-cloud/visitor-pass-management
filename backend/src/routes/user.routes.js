import { Router } from 'express';
import { createUser, getUsers } from '../controllers/user.controller.js';
import { allow, auth } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.use(auth, allow('admin'));
router.get('/', asyncHandler(getUsers));
router.post('/', asyncHandler(createUser));

export default router;
