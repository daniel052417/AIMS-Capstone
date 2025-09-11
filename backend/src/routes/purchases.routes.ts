import { Router } from 'express';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as purchasesController from '../controllers/purchases.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Purchase Orders Routes
router.get('/orders', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk']), 
  asyncHandler(purchasesController.getPurchaseOrders)
);

router.get('/orders/:id', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk']), 
  asyncHandler(purchasesController.getPurchaseOrderById)
);

router.post('/orders', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk']), 
  asyncHandler(purchasesController.createPurchaseOrder)
);

router.put('/orders/:id', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk']), 
  asyncHandler(purchasesController.updatePurchaseOrder)
);

router.put('/orders/:id/approve', 
  requireRole(['super_admin', 'inventory_admin']), 
  asyncHandler(purchasesController.approvePurchaseOrder)
);

// Purchase Order Items Routes
router.put('/items/:id', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk']), 
  asyncHandler(purchasesController.updatePurchaseOrderItem)
);

router.put('/items/:id/receive', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk']), 
  asyncHandler(purchasesController.receivePurchaseOrderItem)
);

// Supplier Management Routes
router.get('/suppliers', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk']), 
  asyncHandler(purchasesController.getSuppliers)
);

router.get('/suppliers/:id', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk']), 
  asyncHandler(purchasesController.getSupplierById)
);

router.post('/suppliers', 
  requireRole(['super_admin', 'inventory_admin']), 
  asyncHandler(purchasesController.createSupplier)
);

router.put('/suppliers/:id', 
  requireRole(['super_admin', 'inventory_admin']), 
  asyncHandler(purchasesController.updateSupplier)
);

// Reports Routes
router.get('/reports/purchases', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk']), 
  asyncHandler(purchasesController.getPurchaseReport)
);

router.get('/reports/supplier-performance', 
  requireRole(['super_admin', 'inventory_admin']), 
  asyncHandler(purchasesController.getSupplierPerformance)
);

// Dashboard Routes
router.get('/dashboard', 
  requireRole(['super_admin', 'inventory_admin', 'inventory_clerk']), 
  asyncHandler(purchasesController.getPurchasesDashboard)
);

export default router;

