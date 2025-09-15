import { Router } from 'express';
import { RBACController } from '../controllers/rbac.controller';
import { authenticateToken, requireRole } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// All RBAC routes require authentication
router.use(authenticateToken);

// Role Management
router.post('/roles', 
  requireRole(['super_admin']),
  RBACController.createRole,
);

router.get('/roles', 
  requirePermission('roles.read'),
  RBACController.getRoles,
);

router.put('/roles/:roleId', 
  requireRole(['super_admin']),
  RBACController.updateRole,
);

router.delete('/roles/:roleId', 
  requireRole(['super_admin']),
  RBACController.deleteRole,
);

// Permission Management
router.post('/permissions', 
  requireRole(['super_admin']),
  RBACController.createPermission,
);

router.get('/permissions', 
  requirePermission('permissions.read'),
  RBACController.getPermissions,
);

// User Role Management
router.post('/users/assign-role', 
  requirePermission('users.update'),
  RBACController.assignRoleToUser,
);

router.post('/users/remove-role', 
  requirePermission('users.update'),
  RBACController.removeRoleFromUser,
);

router.get('/users/:userId/roles', 
  requirePermission('users.read'),
  RBACController.getUserRoles,
);

// Role Permission Management
router.post('/roles/assign-permission', 
  requireRole(['super_admin']),
  RBACController.assignPermissionToRole,
);

router.post('/roles/remove-permission', 
  requireRole(['super_admin']),
  RBACController.removePermissionFromRole,
);

// Utility endpoints
router.get('/users/:userId/permissions', 
  requirePermission('users.read'),
  RBACController.getUserPermissions,
);

router.get('/check-permission', 
  requirePermission('permissions.read'),
  RBACController.checkPermission,
);

export default router;