import express from 'express';
import { POSCashierController } from '../controllers/pos/cashier.controller';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Dashboard
router.get('/dashboard', asyncHandler(POSCashierController.getDashboard));

// Product Management
router.get('/products', asyncHandler(POSCashierController.getProducts));
router.get('/products/search', asyncHandler(POSCashierController.searchProducts));
router.get('/products/:id', asyncHandler(POSCashierController.getProductById));

// Customer Management
router.get('/customers', asyncHandler(POSCashierController.getCustomers));
router.get('/customers/search', asyncHandler(POSCashierController.searchCustomers));
router.get('/customers/:id', asyncHandler(POSCashierController.getCustomerById));
router.post('/customers', asyncHandler(POSCashierController.createCustomer));
router.put('/customers/:id', asyncHandler(POSCashierController.updateCustomer));

// Transaction Management
router.get('/transactions', asyncHandler(POSCashierController.getTransactions));
router.get('/transactions/:id', asyncHandler(POSCashierController.getTransactionById));
router.post('/transactions', asyncHandler(POSCashierController.createTransaction));
router.put('/transactions/:id', asyncHandler(POSCashierController.updateTransaction));
router.patch('/transactions/:id/cancel', asyncHandler(POSCashierController.cancelTransaction));

// Sales Transaction Management
router.post('/sales-transactions', asyncHandler(POSCashierController.createSalesTransaction));
router.get('/sales-transactions/:id', asyncHandler(POSCashierController.getSalesTransactionById));

// Transaction Items
router.get('/transactions/:transactionId/items', asyncHandler(POSCashierController.getTransactionItems));
router.post('/transaction-items', asyncHandler(POSCashierController.createTransactionItem));

// Payment Processing
router.post('/payments', asyncHandler(POSCashierController.processPayment));
router.get('/transactions/:transactionId/payments', asyncHandler(POSCashierController.getPayments));

// POS Session Management
router.post('/sessions', asyncHandler(POSCashierController.startSession));
router.patch('/sessions/:id/end', asyncHandler(POSCashierController.endSession));
router.get('/sessions/current/:cashierId', asyncHandler(POSCashierController.getCurrentSession));
router.get('/sessions/:id', asyncHandler(POSCashierController.getSessionById));

// Receipt Management
router.get('/receipts/:transactionId', asyncHandler(POSCashierController.generateReceipt));

// Reports
router.get('/reports/daily/:date', asyncHandler(POSCashierController.getDailyReport));
router.get('/reports/sales', asyncHandler(POSCashierController.getSalesReport));

// Inventory Checks
router.get('/inventory/:productId', asyncHandler(POSCashierController.checkInventory));
router.get('/inventory/low-stock', asyncHandler(POSCashierController.getLowStockItems));

// Quick Sales
router.get('/quick-sales', asyncHandler(POSCashierController.getQuickSales));

export default router;