import { Router } from 'express';
import {
  createAppointmentRequest,
  getMyAppointments,
  getAppointments,
  reviewAppointment
} from '../controllers/appointment.controller.js';
import { allow, auth } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.use(auth);
router.get('/mine', allow('visitor'), asyncHandler(getMyAppointments));
router.get('/', allow('admin', 'security', 'employee'), asyncHandler(getAppointments));
router.post('/', allow('admin', 'security', 'employee', 'visitor'), asyncHandler(createAppointmentRequest));
router.patch('/:id/approve', allow('admin', 'employee'), asyncHandler(reviewAppointment));

export default router;
