import { Router } from 'express';
import { ProductsController } from '../controllers/products.controller';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { requirePermission as requirePerm } from '../middleware/rbac';

const router = Router();

// Public routes (no authentication required)
router.get('/categories', ProductsController.getCategories);
router.get('/search', ProductsController.search);

// Protected routes
router.use(authenticateToken);

// Product CRUD operations
router.post('/', 
  requirePerm('products', 'create'),
  ProductsController.create
);

router.get('/', 
  requirePerm('products', 'read'),
  ProductsController.getAll
);

router.get('/:id', 
  requirePerm('products', 'read'),
  ProductsController.getById
);

router.put('/:id', 
  requirePerm('products', 'update'),
  ProductsController.update
);

router.delete('/:id', 
  requirePerm('products', 'delete'),
  ProductsController.delete
);

router.patch('/:id/soft-delete', 
  requirePerm('products', 'delete'),
  ProductsController.softDelete
);

router.patch('/:id/restore', 
  requirePerm('products', 'update'),
  ProductsController.restore
);

// Product variants
router.get('/:productId/variants', 
  requirePerm('products', 'read'),
  ProductsController.getVariants
);

router.post('/:productId/variants', 
  requirePerm('products', 'create'),
  ProductsController.createVariant
);

export default router;