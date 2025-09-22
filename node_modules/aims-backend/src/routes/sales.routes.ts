import { Router } from 'express';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { SalesController } from '../controllers/sales.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Sales Orders Routes
router.get('/orders', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  asyncHandler(SalesController.getSalesOrders),
);

router.get('/orders/:id', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  asyncHandler(SalesController.getSalesOrderById),
);

router.post('/orders', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  asyncHandler(SalesController.createSalesOrder),
);

router.put('/orders/:id', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  asyncHandler(SalesController.updateSalesOrder),
);

router.put('/orders/:id/status', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  asyncHandler(SalesController.updateOrderStatus),
);

// Sales Transactions Routes
router.get('/transactions', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  requirePermission(['sales.read']),
  asyncHandler(SalesController.getSalesTransactions)
);

router.get('/transactions/:id', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  requirePermission(['sales.read']),
  asyncHandler(SalesController.getSalesTransactionById)
);

router.put('/transactions/:id', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  requirePermission(['sales.update']),
  asyncHandler(SalesController.updateSalesTransaction)
);

router.delete('/transactions/:id', 
  requireRole(['super_admin', 'sales_admin']), 
  requirePermission(['sales.delete']),
  asyncHandler(SalesController.deleteSalesTransaction)
);
// Real-time Updates
router.get('/transactions/stream', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  requirePermission(['sales.read']),
  asyncHandler(SalesController.getSalesTransactionsStream)
);

// Status Management
router.put('/transactions/:id/status', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  requirePermission(['sales.update']),
  asyncHandler(SalesController.updateTransactionStatus)
);

// Payment Routes
router.get('/payments', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  asyncHandler(SalesController.getPayments),
);

router.post('/payments', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  asyncHandler(SalesController.createPayment),
);

// Customer Management Routes
router.get('/customers', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  asyncHandler(SalesController.getCustomers),
);

router.get('/customers/:id', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  asyncHandler(SalesController.getCustomerById),
);

router.post('/customers', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  asyncHandler(SalesController.createCustomer),
);

router.put('/customers/:id', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  asyncHandler(SalesController.updateCustomer),
);
// Bulk Operations
router.put('/transactions/bulk/status', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  requirePermission(['sales.update']),
  asyncHandler(SalesController.bulkUpdateTransactionStatus)
);

router.delete('/transactions/bulk', 
  requireRole(['super_admin', 'sales_admin']), 
  requirePermission(['sales.delete']),
  asyncHandler(SalesController.bulkDeleteTransactions)
);

// Reports Routes
router.get('/reports/sales', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  asyncHandler(SalesController.getSalesReport),
);

router.get('/reports/top-products', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  asyncHandler(SalesController.getTopSellingProducts),
);

router.get('/reports/customer-sales', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  asyncHandler(SalesController.getCustomerSalesReport),
);
router.get('/transactions/export', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  requirePermission(['sales.export']),
  asyncHandler(SalesController.exportSalesTransactions)
);

router.get('/transactions/print/:id', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  requirePermission(['sales.read']),
  asyncHandler(SalesController.printSalesTransaction)
);

// Dashboard Routes
router.get('/dashboard', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  asyncHandler(SalesController.getSalesDashboard),
);

export default router;

