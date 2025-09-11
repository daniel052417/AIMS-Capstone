import express from 'express';
import { InventoryClerkController } from '../controllers/inventory/clerk.controller';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Dashboard
router.get('/dashboard', asyncHandler(InventoryClerkController.getDashboard));

// Product Management
router.get('/products', asyncHandler(InventoryClerkController.getProducts));
router.get('/products/:id', asyncHandler(InventoryClerkController.getProductById));
router.post('/products', asyncHandler(InventoryClerkController.createProduct));
router.put('/products/:id', asyncHandler(InventoryClerkController.updateProduct));
router.delete('/products/:id', asyncHandler(InventoryClerkController.deleteProduct));

// Category Management
router.get('/categories', asyncHandler(InventoryClerkController.getCategories));
router.get('/categories/:id', asyncHandler(InventoryClerkController.getCategoryById));
router.post('/categories', asyncHandler(InventoryClerkController.createCategory));
router.put('/categories/:id', asyncHandler(InventoryClerkController.updateCategory));
router.delete('/categories/:id', asyncHandler(InventoryClerkController.deleteCategory));

// Supplier Management
router.get('/suppliers', asyncHandler(InventoryClerkController.getSuppliers));
router.get('/suppliers/:id', asyncHandler(InventoryClerkController.getSupplierById));
router.post('/suppliers', asyncHandler(InventoryClerkController.createSupplier));
router.put('/suppliers/:id', asyncHandler(InventoryClerkController.updateSupplier));
router.delete('/suppliers/:id', asyncHandler(InventoryClerkController.deleteSupplier));

// Inventory Transactions
router.get('/transactions', asyncHandler(InventoryClerkController.getInventoryTransactions));
router.post('/transactions', asyncHandler(InventoryClerkController.createInventoryTransaction));

// Stock Adjustments
router.get('/adjustments', asyncHandler(InventoryClerkController.getStockAdjustments));
router.post('/adjustments', asyncHandler(InventoryClerkController.createStockAdjustment));

// Stock Movements
router.get('/movements', asyncHandler(InventoryClerkController.getStockMovements));

// Purchase Orders
router.get('/purchase-orders', asyncHandler(InventoryClerkController.getPurchaseOrders));
router.get('/purchase-orders/:id', asyncHandler(InventoryClerkController.getPurchaseOrderById));
router.post('/purchase-orders', asyncHandler(InventoryClerkController.createPurchaseOrder));
router.put('/purchase-orders/:id', asyncHandler(InventoryClerkController.updatePurchaseOrder));

// Purchase Order Items
router.get('/purchase-orders/:orderId/items', asyncHandler(InventoryClerkController.getPurchaseOrderItems));
router.post('/purchase-order-items', asyncHandler(InventoryClerkController.createPurchaseOrderItem));

// Stock Alerts
router.get('/alerts', asyncHandler(InventoryClerkController.getStockAlerts));
router.patch('/alerts/:id/resolve', asyncHandler(InventoryClerkController.resolveStockAlert));

// Inventory Counts
router.get('/counts', asyncHandler(InventoryClerkController.getInventoryCounts));
router.post('/counts', asyncHandler(InventoryClerkController.createInventoryCount));
router.get('/counts/:countId/items', asyncHandler(InventoryClerkController.getInventoryCountItems));
router.post('/count-items', asyncHandler(InventoryClerkController.createInventoryCountItem));

// Reports
router.get('/reports/inventory', asyncHandler(InventoryClerkController.getInventoryReport));
router.get('/reports/stock-movements', asyncHandler(InventoryClerkController.getStockMovementReport));

export default router;