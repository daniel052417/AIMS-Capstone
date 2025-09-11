import { Router } from 'express';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as notificationsController from '../controllers/notifications.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// User Notifications Routes
router.get('/user', 
  requireRole(['super_admin', 'hr_admin', 'hr_staff', 'marketing_admin', 'marketing_staff', 'inventory_admin', 'inventory_clerk', 'pos_cashier', 'sales_admin', 'sales_staff']), 
  asyncHandler(notificationsController.getNotifications)
);

router.post('/user', 
  requireRole(['super_admin']), 
  asyncHandler(notificationsController.createNotification)
);

router.put('/user/:id/read', 
  requireRole(['super_admin', 'hr_admin', 'hr_staff', 'marketing_admin', 'marketing_staff', 'inventory_admin', 'inventory_clerk', 'pos_cashier', 'sales_admin', 'sales_staff']), 
  asyncHandler(notificationsController.markAsRead)
);

router.put('/user/mark-all-read', 
  requireRole(['super_admin', 'hr_admin', 'hr_staff', 'marketing_admin', 'marketing_staff', 'inventory_admin', 'inventory_clerk', 'pos_cashier', 'sales_admin', 'sales_staff']), 
  asyncHandler(notificationsController.markAllAsRead)
);

router.delete('/user/:id', 
  requireRole(['super_admin', 'hr_admin', 'hr_staff', 'marketing_admin', 'marketing_staff', 'inventory_admin', 'inventory_clerk', 'pos_cashier', 'sales_admin', 'sales_staff']), 
  asyncHandler(notificationsController.deleteNotification)
);

// Notification Templates Routes
router.get('/templates', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(notificationsController.getNotificationTemplates)
);

router.get('/templates/:id', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(notificationsController.getNotificationTemplateById)
);

router.post('/templates', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(notificationsController.createNotificationTemplate)
);

router.put('/templates/:id', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(notificationsController.updateNotificationTemplate)
);

router.delete('/templates/:id', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(notificationsController.deleteNotificationTemplate)
);

// Client Notifications Routes (Marketing)
router.get('/client', 
  requireRole(['super_admin', 'marketing_admin', 'marketing_staff']), 
  asyncHandler(notificationsController.getClientNotifications)
);

router.post('/client', 
  requireRole(['super_admin', 'marketing_admin', 'marketing_staff']), 
  asyncHandler(notificationsController.createClientNotification)
);

router.put('/client/:id', 
  requireRole(['super_admin', 'marketing_admin', 'marketing_staff']), 
  asyncHandler(notificationsController.updateClientNotification)
);

router.delete('/client/:id', 
  requireRole(['super_admin', 'marketing_admin', 'marketing_staff']), 
  asyncHandler(notificationsController.deleteClientNotification)
);

router.post('/client/:id/send', 
  requireRole(['super_admin', 'marketing_admin', 'marketing_staff']), 
  asyncHandler(notificationsController.sendClientNotification)
);

// Bulk and System Notifications
router.post('/bulk', 
  requireRole(['super_admin']), 
  asyncHandler(notificationsController.sendBulkNotification)
);

router.post('/system', 
  requireRole(['super_admin']), 
  asyncHandler(notificationsController.sendSystemNotification)
);

// Statistics
router.get('/stats', 
  requireRole(['super_admin', 'hr_admin', 'hr_staff', 'marketing_admin', 'marketing_staff', 'inventory_admin', 'inventory_clerk', 'pos_cashier', 'sales_admin', 'sales_staff']), 
  asyncHandler(notificationsController.getNotificationStats)
);

export default router;

