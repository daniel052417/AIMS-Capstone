import { Router } from 'express';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as salesController from '../controllers/sales.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Sales Orders Routes
router.get('/orders', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  asyncHandler(salesController.getSalesOrders)
);

router.get('/orders/:id', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  asyncHandler(salesController.getSalesOrderById)
);

router.post('/orders', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  asyncHandler(salesController.createSalesOrder)
);

router.put('/orders/:id', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  asyncHandler(salesController.updateSalesOrder)
);

router.put('/orders/:id/status', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  asyncHandler(salesController.updateOrderStatus)
);

// Sales Transactions Routes
router.get('/transactions', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  asyncHandler(salesController.getSalesTransactions)
);

router.post('/transactions', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  asyncHandler(salesController.createSalesTransaction)
);

// Payment Routes
router.get('/payments', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  asyncHandler(salesController.getPayments)
);

router.post('/payments', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  asyncHandler(salesController.createPayment)
);

// Customer Management Routes
router.get('/customers', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  asyncHandler(salesController.getCustomers)
);

router.get('/customers/:id', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), 
  asyncHandler(salesController.getCustomerById)
);

router.post('/customers', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  asyncHandler(salesController.createCustomer)
);

router.put('/customers/:id', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  asyncHandler(salesController.updateCustomer)
);

// Reports Routes
router.get('/reports/sales', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  asyncHandler(salesController.getSalesReport)
);

router.get('/reports/top-products', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  asyncHandler(salesController.getTopSellingProducts)
);

router.get('/reports/customer-sales', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  asyncHandler(salesController.getCustomerSalesReport)
);

// Dashboard Routes
router.get('/dashboard', 
  requireRole(['super_admin', 'sales_admin', 'sales_staff']), 
  asyncHandler(salesController.getSalesDashboard)
);

export default router;

