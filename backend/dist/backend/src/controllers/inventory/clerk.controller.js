"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryClerkController = void 0;
const clerk_service_1 = require("../../services/inventory/clerk.service");
const errorHandler_1 = require("../../middleware/errorHandler");
class InventoryClerkController {
}
exports.InventoryClerkController = InventoryClerkController;
_a = InventoryClerkController;
InventoryClerkController.getDashboard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const dashboard = await clerk_service_1.InventoryClerkService.getDashboard();
    res.json({
        success: true,
        data: dashboard
    });
});
InventoryClerkController.getProducts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const result = await clerk_service_1.InventoryClerkService.getProducts(filters);
    res.json({
        success: true,
        data: result
    });
});
InventoryClerkController.getProductById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const product = await clerk_service_1.InventoryClerkService.getProductById(id);
    res.json({
        success: true,
        data: product
    });
});
InventoryClerkController.createProduct = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const productData = req.body;
    const product = await clerk_service_1.InventoryClerkService.createProduct(productData);
    res.status(201).json({
        success: true,
        data: product
    });
});
InventoryClerkController.updateProduct = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const productData = req.body;
    const product = await clerk_service_1.InventoryClerkService.updateProduct(id, productData);
    res.json({
        success: true,
        data: product
    });
});
InventoryClerkController.deleteProduct = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await clerk_service_1.InventoryClerkService.deleteProduct(id);
    res.json({
        success: true,
        data: result
    });
});
InventoryClerkController.getCategories = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const result = await clerk_service_1.InventoryClerkService.getCategories(filters);
    res.json({
        success: true,
        data: result
    });
});
InventoryClerkController.getCategoryById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const category = await clerk_service_1.InventoryClerkService.getCategoryById(id);
    res.json({
        success: true,
        data: category
    });
});
InventoryClerkController.createCategory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const categoryData = req.body;
    const category = await clerk_service_1.InventoryClerkService.createCategory(categoryData);
    res.status(201).json({
        success: true,
        data: category
    });
});
InventoryClerkController.updateCategory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const categoryData = req.body;
    const category = await clerk_service_1.InventoryClerkService.updateCategory(id, categoryData);
    res.json({
        success: true,
        data: category
    });
});
InventoryClerkController.deleteCategory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await clerk_service_1.InventoryClerkService.deleteCategory(id);
    res.json({
        success: true,
        data: result
    });
});
InventoryClerkController.getSuppliers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const result = await clerk_service_1.InventoryClerkService.getSuppliers(filters);
    res.json({
        success: true,
        data: result
    });
});
InventoryClerkController.getSupplierById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const supplier = await clerk_service_1.InventoryClerkService.getSupplierById(id);
    res.json({
        success: true,
        data: supplier
    });
});
InventoryClerkController.createSupplier = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const supplierData = req.body;
    const supplier = await clerk_service_1.InventoryClerkService.createSupplier(supplierData);
    res.status(201).json({
        success: true,
        data: supplier
    });
});
InventoryClerkController.updateSupplier = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const supplierData = req.body;
    const supplier = await clerk_service_1.InventoryClerkService.updateSupplier(id, supplierData);
    res.json({
        success: true,
        data: supplier
    });
});
InventoryClerkController.deleteSupplier = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await clerk_service_1.InventoryClerkService.deleteSupplier(id);
    res.json({
        success: true,
        data: result
    });
});
InventoryClerkController.getInventoryTransactions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const result = await clerk_service_1.InventoryClerkService.getInventoryTransactions(filters);
    res.json({
        success: true,
        data: result
    });
});
InventoryClerkController.createInventoryTransaction = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const transactionData = req.body;
    const transaction = await clerk_service_1.InventoryClerkService.createInventoryTransaction(transactionData);
    res.status(201).json({
        success: true,
        data: transaction
    });
});
InventoryClerkController.getStockAdjustments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const result = await clerk_service_1.InventoryClerkService.getStockAdjustments(filters);
    res.json({
        success: true,
        data: result
    });
});
InventoryClerkController.createStockAdjustment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const adjustmentData = req.body;
    const adjustment = await clerk_service_1.InventoryClerkService.createStockAdjustment(adjustmentData);
    res.status(201).json({
        success: true,
        data: adjustment
    });
});
InventoryClerkController.getStockMovements = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const result = await clerk_service_1.InventoryClerkService.getStockMovements(filters);
    res.json({
        success: true,
        data: result
    });
});
InventoryClerkController.getPurchaseOrders = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const result = await clerk_service_1.InventoryClerkService.getPurchaseOrders(filters);
    res.json({
        success: true,
        data: result
    });
});
InventoryClerkController.getPurchaseOrderById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const order = await clerk_service_1.InventoryClerkService.getPurchaseOrderById(id);
    res.json({
        success: true,
        data: order
    });
});
InventoryClerkController.createPurchaseOrder = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const orderData = req.body;
    const order = await clerk_service_1.InventoryClerkService.createPurchaseOrder(orderData);
    res.status(201).json({
        success: true,
        data: order
    });
});
InventoryClerkController.updatePurchaseOrder = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const orderData = req.body;
    const order = await clerk_service_1.InventoryClerkService.updatePurchaseOrder(id, orderData);
    res.json({
        success: true,
        data: order
    });
});
InventoryClerkController.getPurchaseOrderItems = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { orderId } = req.params;
    const items = await clerk_service_1.InventoryClerkService.getPurchaseOrderItems(orderId);
    res.json({
        success: true,
        data: items
    });
});
InventoryClerkController.createPurchaseOrderItem = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const itemData = req.body;
    const item = await clerk_service_1.InventoryClerkService.createPurchaseOrderItem(itemData);
    res.status(201).json({
        success: true,
        data: item
    });
});
InventoryClerkController.getStockAlerts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const result = await clerk_service_1.InventoryClerkService.getStockAlerts(filters);
    res.json({
        success: true,
        data: result
    });
});
InventoryClerkController.resolveStockAlert = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const alert = await clerk_service_1.InventoryClerkService.resolveStockAlert(id);
    res.json({
        success: true,
        data: alert
    });
});
InventoryClerkController.getInventoryCounts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const result = await clerk_service_1.InventoryClerkService.getInventoryCounts(filters);
    res.json({
        success: true,
        data: result
    });
});
InventoryClerkController.createInventoryCount = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const countData = req.body;
    const count = await clerk_service_1.InventoryClerkService.createInventoryCount(countData);
    res.status(201).json({
        success: true,
        data: count
    });
});
InventoryClerkController.getInventoryCountItems = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { countId } = req.params;
    const items = await clerk_service_1.InventoryClerkService.getInventoryCountItems(countId);
    res.json({
        success: true,
        data: items
    });
});
InventoryClerkController.createInventoryCountItem = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const itemData = req.body;
    const item = await clerk_service_1.InventoryClerkService.createInventoryCountItem(itemData);
    res.status(201).json({
        success: true,
        data: item
    });
});
InventoryClerkController.getInventoryReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const report = await clerk_service_1.InventoryClerkService.getInventoryReport(filters);
    res.json({
        success: true,
        data: report
    });
});
InventoryClerkController.getStockMovementReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const report = await clerk_service_1.InventoryClerkService.getStockMovementReport(filters);
    res.json({
        success: true,
        data: report
    });
});
//# sourceMappingURL=clerk.controller.js.map