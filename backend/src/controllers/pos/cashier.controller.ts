import { Request, Response } from 'express';
import { POSCashierService } from '../../services/pos/cashier.service';
import { asyncHandler } from '../../middleware/errorHandler';

export class POSCashierController {
  // Dashboard
  static getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const dashboard = await POSCashierService.getDashboard();
    res.json({
      success: true,
      data: dashboard
    });
  });

  // Product Management
  static getProducts = asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    const result = await POSCashierService.getProducts(filters);
    res.json({
      success: true,
      data: result
    });
  });

  static searchProducts = asyncHandler(async (req: Request, res: Response) => {
    const { search } = req.query;
    if (!search) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }

    const products = await POSCashierService.searchProducts(search as string);
    res.json({
      success: true,
      data: products
    });
  });

  static getProductById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await POSCashierService.getProductById(id);
    res.json({
      success: true,
      data: product
    });
  });

  // Customer Management
  static getCustomers = asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    const result = await POSCashierService.getCustomers(filters);
    res.json({
      success: true,
      data: result
    });
  });

  static searchCustomers = asyncHandler(async (req: Request, res: Response) => {
    const { search } = req.query;
    if (!search) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }

    const customers = await POSCashierService.searchCustomers(search as string);
    res.json({
      success: true,
      data: customers
    });
  });

  static getCustomerById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const customer = await POSCashierService.getCustomerById(id);
    res.json({
      success: true,
      data: customer
    });
  });

  static createCustomer = asyncHandler(async (req: Request, res: Response) => {
    const customerData = req.body;
    const customer = await POSCashierService.createCustomer(customerData);
    res.status(201).json({
      success: true,
      data: customer
    });
  });

  static updateCustomer = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const customerData = req.body;
    const customer = await POSCashierService.updateCustomer(id, customerData);
    res.json({
      success: true,
      data: customer
    });
  });

  // Transaction Management
  static getTransactions = asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    const result = await POSCashierService.getTransactions(filters);
    res.json({
      success: true,
      data: result
    });
  });

  static getTransactionById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const transaction = await POSCashierService.getTransactionById(id);
    res.json({
      success: true,
      data: transaction
    });
  });

  static createTransaction = asyncHandler(async (req: Request, res: Response) => {
    const transactionData = req.body;
    const transaction = await POSCashierService.createTransaction(transactionData);
    res.status(201).json({
      success: true,
      data: transaction
    });
  });

  static updateTransaction = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const transactionData = req.body;
    const transaction = await POSCashierService.updateTransaction(id, transactionData);
    res.json({
      success: true,
      data: transaction
    });
  });

  static cancelTransaction = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const transaction = await POSCashierService.cancelTransaction(id);
    res.json({
      success: true,
      data: transaction
    });
  });

  // Sales Transaction Management
  static createSalesTransaction = asyncHandler(async (req: Request, res: Response) => {
    const transactionData = req.body;
    const transaction = await POSCashierService.createSalesTransaction(transactionData);
    res.status(201).json({
      success: true,
      data: transaction
    });
  });

  static getSalesTransactionById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const transaction = await POSCashierService.getSalesTransactionById(id);
    res.json({
      success: true,
      data: transaction
    });
  });

  // Transaction Items
  static getTransactionItems = asyncHandler(async (req: Request, res: Response) => {
    const { transactionId } = req.params;
    const items = await POSCashierService.getTransactionItems(transactionId);
    res.json({
      success: true,
      data: items
    });
  });

  static createTransactionItem = asyncHandler(async (req: Request, res: Response) => {
    const itemData = req.body;
    const item = await POSCashierService.createTransactionItem(itemData);
    res.status(201).json({
      success: true,
      data: item
    });
  });

  // Payment Processing
  static processPayment = asyncHandler(async (req: Request, res: Response) => {
    const paymentData = req.body;
    const payment = await POSCashierService.processPayment(paymentData);
    res.status(201).json({
      success: true,
      data: payment
    });
  });

  static getPayments = asyncHandler(async (req: Request, res: Response) => {
    const { transactionId } = req.params;
    const payments = await POSCashierService.getPayments(transactionId);
    res.json({
      success: true,
      data: payments
    });
  });

  // POS Session Management
  static startSession = asyncHandler(async (req: Request, res: Response) => {
    const sessionData = req.body;
    const session = await POSCashierService.startSession(sessionData);
    res.status(201).json({
      success: true,
      data: session
    });
  });

  static endSession = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const closingData = req.body;
    const session = await POSCashierService.endSession(id, closingData);
    res.json({
      success: true,
      data: session
    });
  });

  static getCurrentSession = asyncHandler(async (req: Request, res: Response) => {
    const { cashierId } = req.params;
    const session = await POSCashierService.getCurrentSession(cashierId);
    res.json({
      success: true,
      data: session
    });
  });

  static getSessionById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const session = await POSCashierService.getSessionById(id);
    res.json({
      success: true,
      data: session
    });
  });

  // Receipt Management
  static generateReceipt = asyncHandler(async (req: Request, res: Response) => {
    const { transactionId } = req.params;
    const receipt = await POSCashierService.generateReceipt(transactionId);
    res.json({
      success: true,
      data: receipt
    });
  });

  // Reports
  static getDailyReport = asyncHandler(async (req: Request, res: Response) => {
    const { date } = req.params;
    const report = await POSCashierService.getDailyReport(date);
    res.json({
      success: true,
      data: report
    });
  });

  static getSalesReport = asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    const report = await POSCashierService.getSalesReport(filters);
    res.json({
      success: true,
      data: report
    });
  });

  // Inventory Checks
  static checkInventory = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const inventory = await POSCashierService.checkInventory(productId);
    res.json({
      success: true,
      data: inventory
    });
  });

  static getLowStockItems = asyncHandler(async (req: Request, res: Response) => {
    const items = await POSCashierService.getLowStockItems();
    res.json({
      success: true,
      data: items
    });
  });

  // Quick Sales
  static getQuickSales = asyncHandler(async (req: Request, res: Response) => {
    const products = await POSCashierService.getQuickSales();
    res.json({
      success: true,
      data: products
    });
  });
}