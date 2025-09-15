import { Request, Response } from 'express';
import { InventoryClerkService } from '../../services/inventory/clerk.service';
import { asyncHandler } from '../../middleware/errorHandler';

export class InventoryClerkController {
  // Dashboard
  static getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const dashboard = await InventoryClerkService.getDashboard();
    res.json({
      success: true,
      data: dashboard,
    });
  });

  // Product Management
  static getProducts = asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    const result = await InventoryClerkService.getProducts(filters);
    res.json({
      success: true,
      data: result,
    });
  });

  static getProductById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await InventoryClerkService.getProductById(id);
    res.json({
      success: true,
      data: product,
    });
  });

  static createProduct = asyncHandler(async (req: Request, res: Response) => {
    const productData = req.body;
    const product = await InventoryClerkService.createProduct(productData);
    res.status(201).json({
      success: true,
      data: product,
    });
  });

  static updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const productData = req.body;
    const product = await InventoryClerkService.updateProduct(id, productData);
    res.json({
      success: true,
      data: product,
    });
  });

  static deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await InventoryClerkService.deleteProduct(id);
    res.json({
      success: true,
      data: result,
    });
  });

  // Category Management
  static getCategories = asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    const result = await InventoryClerkService.getCategories(filters);
    res.json({
      success: true,
      data: result,
    });
  });

  static getCategoryById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const category = await InventoryClerkService.getCategoryById(id);
    res.json({
      success: true,
      data: category,
    });
  });

  static createCategory = asyncHandler(async (req: Request, res: Response) => {
    const categoryData = req.body;
    const category = await InventoryClerkService.createCategory(categoryData);
    res.status(201).json({
      success: true,
      data: category,
    });
  });

  static updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const categoryData = req.body;
    const category = await InventoryClerkService.updateCategory(id, categoryData);
    res.json({
      success: true,
      data: category,
    });
  });

  static deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await InventoryClerkService.deleteCategory(id);
    res.json({
      success: true,
      data: result,
    });
  });

  // Supplier Management
  static getSuppliers = asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    const result = await InventoryClerkService.getSuppliers(filters);
    res.json({
      success: true,
      data: result,
    });
  });

  static getSupplierById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const supplier = await InventoryClerkService.getSupplierById(id);
    res.json({
      success: true,
      data: supplier,
    });
  });

  static createSupplier = asyncHandler(async (req: Request, res: Response) => {
    const supplierData = req.body;
    const supplier = await InventoryClerkService.createSupplier(supplierData);
    res.status(201).json({
      success: true,
      data: supplier,
    });
  });

  static updateSupplier = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const supplierData = req.body;
    const supplier = await InventoryClerkService.updateSupplier(id, supplierData);
    res.json({
      success: true,
      data: supplier,
    });
  });

  static deleteSupplier = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await InventoryClerkService.deleteSupplier(id);
    res.json({
      success: true,
      data: result,
    });
  });

  // Inventory Transactions
  static getInventoryTransactions = asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    const result = await InventoryClerkService.getInventoryTransactions(filters);
    res.json({
      success: true,
      data: result,
    });
  });

  static createInventoryTransaction = asyncHandler(async (req: Request, res: Response) => {
    const transactionData = req.body;
    const transaction = await InventoryClerkService.createInventoryTransaction(transactionData);
    res.status(201).json({
      success: true,
      data: transaction,
    });
  });

  // Stock Adjustments
  static getStockAdjustments = asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    const result = await InventoryClerkService.getStockAdjustments(filters);
    res.json({
      success: true,
      data: result,
    });
  });

  static createStockAdjustment = asyncHandler(async (req: Request, res: Response) => {
    const adjustmentData = req.body;
    const adjustment = await InventoryClerkService.createStockAdjustment(adjustmentData);
    res.status(201).json({
      success: true,
      data: adjustment,
    });
  });

  // Stock Movements
  static getStockMovements = asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    const result = await InventoryClerkService.getStockMovements(filters);
    res.json({
      success: true,
      data: result,
    });
  });

  // Purchase Orders
  static getPurchaseOrders = asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    const result = await InventoryClerkService.getPurchaseOrders(filters);
    res.json({
      success: true,
      data: result,
    });
  });

  static getPurchaseOrderById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const order = await InventoryClerkService.getPurchaseOrderById(id);
    res.json({
      success: true,
      data: order,
    });
  });

  static createPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
    const orderData = req.body;
    const order = await InventoryClerkService.createPurchaseOrder(orderData);
    res.status(201).json({
      success: true,
      data: order,
    });
  });

  static updatePurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const orderData = req.body;
    const order = await InventoryClerkService.updatePurchaseOrder(id, orderData);
    res.json({
      success: true,
      data: order,
    });
  });

  // Purchase Order Items
  static getPurchaseOrderItems = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const items = await InventoryClerkService.getPurchaseOrderItems(orderId);
    res.json({
      success: true,
      data: items,
    });
  });

  static createPurchaseOrderItem = asyncHandler(async (req: Request, res: Response) => {
    const itemData = req.body;
    const item = await InventoryClerkService.createPurchaseOrderItem(itemData);
    res.status(201).json({
      success: true,
      data: item,
    });
  });

  // Stock Alerts
  static getStockAlerts = asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    const result = await InventoryClerkService.getStockAlerts(filters);
    res.json({
      success: true,
      data: result,
    });
  });

  static resolveStockAlert = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const alert = await InventoryClerkService.resolveStockAlert(id);
    res.json({
      success: true,
      data: alert,
    });
  });

  // Inventory Counts
  static getInventoryCounts = asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    const result = await InventoryClerkService.getInventoryCounts(filters);
    res.json({
      success: true,
      data: result,
    });
  });

  static createInventoryCount = asyncHandler(async (req: Request, res: Response) => {
    const countData = req.body;
    const count = await InventoryClerkService.createInventoryCount(countData);
    res.status(201).json({
      success: true,
      data: count,
    });
  });

  static getInventoryCountItems = asyncHandler(async (req: Request, res: Response) => {
    const { countId } = req.params;
    const items = await InventoryClerkService.getInventoryCountItems(countId);
    res.json({
      success: true,
      data: items,
    });
  });

  static createInventoryCountItem = asyncHandler(async (req: Request, res: Response) => {
    const itemData = req.body;
    const item = await InventoryClerkService.createInventoryCountItem(itemData);
    res.status(201).json({
      success: true,
      data: item,
    });
  });

  // Reports
  static getInventoryReport = asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    const report = await InventoryClerkService.getInventoryReport(filters);
    res.json({
      success: true,
      data: report,
    });
  });

  static getStockMovementReport = asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    const report = await InventoryClerkService.getStockMovementReport(filters);
    res.json({
      success: true,
      data: report,
    });
  });
}