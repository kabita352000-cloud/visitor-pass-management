import { Router } from 'express';
import { createPass, downloadPassPdf, getMyPasses, getPasses, revokePass } from '../controllers/pass.controller.js';
import { allow, auth } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.use(auth);
router.get('/mine', allow('visitor'), asyncHandler(getMyPasses));
router.post('/issue', allow('admin', 'security'), asyncHandler(createPass));
router.get('/', allow('admin', 'security', 'employee'), asyncHandler(getPasses));
router.patch('/:id/revoke', allow('admin', 'security'), asyncHandler(revokePass));
router.get('/:code/pdf', asyncHandler(downloadPassPdf));

export default router;
