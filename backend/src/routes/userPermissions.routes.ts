import { Router } from 'express';
import { UserPermissionsController } from '../controllers/userPermissions.controller';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// User permissions routes
router.get('/users/:id/permissions',
  requirePermission('user.read'),
  UserPermissionsController.getUserPermissions
);

router.put('/users/:id/permissions',
  requirePermission('user.update'),
  UserPermissionsController.updateUserPermissions
);

router.get('/users/:id/permissions/stats',
  requirePermission('user.read'),
  UserPermissionsController.getUserPermissionStats
);

// Permission management routes
router.get('/permissions',
  requirePermission('permission.read'),
  UserPermissionsController.getAllPermissions
);

router.get('/permissions/categories',
  requirePermission('permission.read'),
  UserPermissionsController.getPermissionsByCategories
);

router.get('/permissions/user/:userId',
  requirePermission('permission.read'),
  UserPermissionsController.getUserDirectPermissions
);

router.put('/permissions/user/:userId',
  requirePermission('permission.update'),
  UserPermissionsController.bulkUpdateUserPermissions
);

router.delete('/permissions/user/:userId/:permissionId',
  requirePermission('permission.update'),
  UserPermissionsController.removeUserPermission
);

export default router;