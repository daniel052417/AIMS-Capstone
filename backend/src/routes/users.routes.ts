import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// User management routes
router.get('/', 
  requirePermission('user.read'),
  UsersController.getUsers
);

router.get('/stats',
  requirePermission('user.read'),
  UsersController.getUserStats
);

router.get('/:id',
  requirePermission('user.read'),
  UsersController.getUserById
);

router.post('/',
  requirePermission('user.create'),
  UsersController.createUser
);

router.put('/:id',
  requirePermission('user.update'),
  UsersController.updateUser
);

router.patch('/:id/activate',
  requirePermission('user.update'),
  UsersController.activateUser
);

router.patch('/:id/deactivate',
  requirePermission('user.update'),
  UsersController.deactivateUser
);

export default router;