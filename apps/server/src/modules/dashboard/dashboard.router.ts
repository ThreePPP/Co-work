import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { Role } from '../../types/enums.js';

const router = Router();

router.use(authenticate);

// Only ADMIN can access dashboard summary analytics
router.get('/summary', requireRole([Role.ADMIN]), DashboardController.getSummary);

// All authenticated users can access their personal notifications
router.get('/notifications', DashboardController.getNotifications);
router.patch('/notifications/:id/read', DashboardController.markNotificationRead);
router.post('/notifications/read-all', DashboardController.markAllNotificationsRead);

export default router;
