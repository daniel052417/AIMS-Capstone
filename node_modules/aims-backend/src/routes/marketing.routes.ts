import { Router } from 'express';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as adminController from '../controllers/marketing/admin.controller';
import * as staffController from '../controllers/marketing/staff.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Admin Marketing routes
router.get('/admin/dashboard', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(adminController.getDashboard),
);

// Campaign management
router.get('/admin/campaigns', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(adminController.getCampaigns),
);

router.get('/admin/campaigns/:id', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(adminController.getCampaignById),
);

router.post('/admin/campaigns', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(adminController.createCampaign),
);

router.put('/admin/campaigns/:id', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(adminController.updateCampaign),
);

router.delete('/admin/campaigns/:id', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(adminController.deleteCampaign),
);

router.post('/admin/campaigns/:id/publish', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(adminController.publishCampaign),
);

router.post('/admin/campaigns/:id/unpublish', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(adminController.unpublishCampaign),
);

// Template management
router.get('/admin/templates', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(adminController.getTemplates),
);

router.post('/admin/templates', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(adminController.createTemplate),
);

router.put('/admin/templates/:id', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(adminController.updateTemplate),
);

router.delete('/admin/templates/:id', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(adminController.deleteTemplate),
);

// Analytics
router.get('/admin/analytics', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(adminController.getAnalytics),
);

router.get('/admin/analytics/campaigns/:id', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(adminController.getCampaignAnalytics),
);

// Client notifications
router.get('/admin/notifications', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(adminController.getNotifications),
);

router.post('/admin/notifications', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(adminController.createNotification),
);

router.put('/admin/notifications/:id', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(adminController.updateNotification),
);

router.delete('/admin/notifications/:id', 
  requireRole(['super_admin', 'marketing_admin']), 
  asyncHandler(adminController.deleteNotification),
);

// Staff Marketing routes
router.get('/staff/campaigns', 
  requireRole(['marketing_staff']), 
  asyncHandler(staffController.getCampaigns),
);

router.get('/staff/campaigns/:id', 
  requireRole(['marketing_staff']), 
  asyncHandler(staffController.getCampaignById),
);

router.post('/staff/campaigns', 
  requireRole(['marketing_staff']), 
  asyncHandler(staffController.createCampaign),
);

router.put('/staff/campaigns/:id', 
  requireRole(['marketing_staff']), 
  asyncHandler(staffController.updateCampaign),
);

router.get('/staff/templates', 
  requireRole(['marketing_staff']), 
  asyncHandler(staffController.getTemplates),
);

router.get('/staff/analytics', 
  requireRole(['marketing_staff']), 
  asyncHandler(staffController.getAnalytics),
);

export default router;

