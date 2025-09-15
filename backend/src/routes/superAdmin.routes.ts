import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as superAdminController from '../controllers/superAdmin.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// TODO: Add role-based access control when RBAC is fully implemented
// For now, all authenticated users can access super admin routes

// Dashboard routes
router.get('/dashboard', asyncHandler(superAdminController.getDashboardData));
router.get('/analytics', asyncHandler(superAdminController.getAnalytics));

// User management routes
router.get('/users', asyncHandler(superAdminController.getUsers));
router.get('/users/:id', asyncHandler(superAdminController.getUserById));
router.post('/users', asyncHandler(superAdminController.createUser));
router.put('/users/:id', asyncHandler(superAdminController.updateUser));
router.delete('/users/:id', asyncHandler(superAdminController.deleteUser));

// Role management routes
router.get('/roles', asyncHandler(superAdminController.getRoles));
router.post('/roles', asyncHandler(superAdminController.createRole));
router.put('/roles/:id', asyncHandler(superAdminController.updateRole));
router.delete('/roles/:id', asyncHandler(superAdminController.deleteRole));

// Permission management routes
router.get('/permissions', asyncHandler(superAdminController.getPermissions));
router.post('/permissions', asyncHandler(superAdminController.createPermission));
router.put('/permissions/:id', asyncHandler(superAdminController.updatePermission));
router.delete('/permissions/:id', asyncHandler(superAdminController.deletePermission));

// System settings routes
router.get('/settings/app', asyncHandler(superAdminController.getAppSettings));
router.put('/settings/app', asyncHandler(superAdminController.updateAppSettings));
router.get('/settings/system', asyncHandler(superAdminController.getSystemSettings));
router.put('/settings/system/:key', asyncHandler(superAdminController.updateSystemSetting));

// Audit logs routes
router.get('/audit-logs', asyncHandler(superAdminController.getAuditLogs));
router.get('/audit-logs/:id', asyncHandler(superAdminController.getAuditLogById));

// Staff management routes
router.get('/staff', asyncHandler(superAdminController.getStaffWithAccounts));

// Database function routes
router.get('/users/:userId/components', asyncHandler(superAdminController.getUserAccessibleComponents));
router.get('/users/:userId/permissions', asyncHandler(superAdminController.getUserPermissions));
router.get('/users/:userId/check-permission', asyncHandler(superAdminController.checkUserPermission));



// System health routes
router.get('/system/health', asyncHandler(superAdminController.getSystemHealth));
router.get('/system/stats', asyncHandler(superAdminController.getSystemStats));

export default router;
