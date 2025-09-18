import { Router } from 'express';
import { ActiveUsersController } from '../controllers/activeUsers.controller';
import { authenticateToken, requireRole } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Core user management
// Core user management
router.get('/', 
    requireRole(['super_admin']),
    requirePermission('users.read'),
    ActiveUsersController.getUsers
  );
  
  // Active Users routes (static paths first)
  router.get('/active-users', 
    requireRole(['super_admin']),
    requirePermission('users.read'),
    ActiveUsersController.getActiveUsers
  );
  
  router.get('/active-users/stats', 
    requireRole(['super_admin']),
    requirePermission('users.read'),
    ActiveUsersController.getActiveUsersStats
  );
  
  router.get('/active-users/export', 
    requireRole(['super_admin']),
    requirePermission('users.read'),
    ActiveUsersController.exportActiveUsers
  );
  
  router.get('/active-users/stream', 
    requireRole(['super_admin']),
    requirePermission('users.read'),
    ActiveUsersController.getActiveUsersStream
  );
  
  router.get('/active-users/heartbeat', 
    requireRole(['super_admin']),
    requirePermission('users.read'),
    ActiveUsersController.getHeartbeat
  );
  
  // Active Users dynamic routes
  router.get('/active-users/:id/sessions', 
    requireRole(['super_admin']),
    requirePermission('users.read'),
    ActiveUsersController.getUserSessions
  );
  
  router.get('/active-users/:id/activity', 
    requireRole(['super_admin']),
    requirePermission('users.read'),
    ActiveUsersController.getUserActivity
  );
  
  router.patch('/active-users/:id/force-logout', 
    requireRole(['super_admin']),
    requirePermission('users.update'),
    ActiveUsersController.forceLogoutUser
  );
  
  // User dynamic routes
  router.get('/:id', 
    requireRole(['super_admin']),
    requirePermission('users.read'),
    ActiveUsersController.getUserById
  );
  
  router.patch('/:id/deactivate', 
    requireRole(['super_admin']),
    requirePermission('users.update'),
    ActiveUsersController.deactivateUser
  );
  
  router.patch('/:id/activate', 
    requireRole(['super_admin']),
    requirePermission('users.update'),
    ActiveUsersController.activateUser
  );
  

export default router;