import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// Skip authentication for OPTIONS requests
router.options('*', (req, res) => {
  res.sendStatus(200); // Handled by cors middleware
});

// Apply authentication to all non-OPTIONS routes
router.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  return authenticateToken(req, res, next);
});
// User management routes
router.get('/', 
  requirePermission('users.read'),
  UsersController.getUsers
);

router.get('/stats',
  requirePermission('users.read'),
  UsersController.getUserStats
);

router.get('/:id',
  requirePermission('users.read'),
  UsersController.getUserById
);

router.post('/',
  requirePermission('users.create'),
  UsersController.createUser
);

router.put('/:id',
  requirePermission('users.update'),
  UsersController.updateUser
);

router.patch('/:id/activate',
  requirePermission('users.update'),
  UsersController.activateUser
);

router.patch('/:id/deactivate',
  requirePermission('users.update'),
  UsersController.deactivateUser
);

export default router;