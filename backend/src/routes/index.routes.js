import { Router } from 'express';
import appointmentRoutes from './appointment.routes.js';
import authRoutes from './auth.routes.js';
import checklogRoutes from './checklog.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import passRoutes from './pass.routes.js';
import reportRoutes from './report.routes.js';
import userRoutes from './user.routes.js';
import visitorRoutes from './visitor.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/visitors', visitorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/passes', passRoutes);
router.use('/checklogs', checklogRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);

export default router;
