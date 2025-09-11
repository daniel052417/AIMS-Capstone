import { Router } from 'express';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as productsController from '../controllers/products.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Product Management Routes
router.get('/', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk', 'pos_cashier']), 
  asyncHandler(productsController.getProducts)
);

router.get('/:id', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk', 'pos_cashier']), 
  asyncHandler(productsController.getProductById)
);

router.post('/', 
  requireRole(['super_admin', 'inventory_admin']), 
  asyncHandler(productsController.createProduct)
);

router.put('/:id', 
  requireRole(['super_admin', 'inventory_admin']), 
  asyncHandler(productsController.updateProduct)
);

router.delete('/:id', 
  requireRole(['super_admin', 'inventory_admin']), 
  asyncHandler(productsController.deleteProduct)
);

// Category Management Routes
router.get('/categories', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk', 'pos_cashier']), 
  asyncHandler(productsController.getCategories)
);

router.post('/categories', 
  requireRole(['super_admin', 'inventory_admin']), 
  asyncHandler(productsController.createCategory)
);

router.put('/categories/:id', 
  requireRole(['super_admin', 'inventory_admin']), 
  asyncHandler(productsController.updateCategory)
);

router.delete('/categories/:id', 
  requireRole(['super_admin', 'inventory_admin']), 
  asyncHandler(productsController.deleteCategory)
);

// Supplier Management Routes
router.get('/suppliers', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk']), 
  asyncHandler(productsController.getSuppliers)
);

router.post('/suppliers', 
  requireRole(['super_admin', 'inventory_admin']), 
  asyncHandler(productsController.createSupplier)
);

router.put('/suppliers/:id', 
  requireRole(['super_admin', 'inventory_admin']), 
  asyncHandler(productsController.updateSupplier)
);

router.delete('/suppliers/:id', 
  requireRole(['super_admin', 'inventory_admin']), 
  asyncHandler(productsController.deleteSupplier)
);

// Inventory Management Routes
router.get('/inventory/levels', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk']), 
  asyncHandler(productsController.getInventoryLevels)
);

router.put('/inventory/levels/:id', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk']), 
  asyncHandler(productsController.updateInventoryLevel)
);

router.get('/inventory/movements', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk']), 
  asyncHandler(productsController.getInventoryMovements)
);

router.post('/inventory/movements', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk']), 
  asyncHandler(productsController.createInventoryMovement)
);

// Stock Management Routes
router.post('/:productId/adjust-stock', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk']), 
  asyncHandler(productsController.adjustStock)
);

// Reports Routes
router.get('/reports/low-stock', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk']), 
  asyncHandler(productsController.getLowStockProducts)
);

router.get('/reports/product-sales', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk']), 
  asyncHandler(productsController.getProductSalesReport)
);

export default router;

