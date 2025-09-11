"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.POSCashierController = void 0;
const cashier_service_1 = require("../../services/pos/cashier.service");
const errorHandler_1 = require("../../middleware/errorHandler");
class POSCashierController {
}
exports.POSCashierController = POSCashierController;
_a = POSCashierController;
POSCashierController.getDashboard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const dashboard = await cashier_service_1.POSCashierService.getDashboard();
    res.json({
        success: true,
        data: dashboard
    });
});
POSCashierController.getProducts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const result = await cashier_service_1.POSCashierService.getProducts(filters);
    res.json({
        success: true,
        data: result
    });
});
POSCashierController.searchProducts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { search } = req.query;
    if (!search) {
        return res.status(400).json({
            success: false,
            message: 'Search term is required'
        });
    }
    const products = await cashier_service_1.POSCashierService.searchProducts(search);
    res.json({
        success: true,
        data: products
    });
});
POSCashierController.getProductById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const product = await cashier_service_1.POSCashierService.getProductById(id);
    res.json({
        success: true,
        data: product
    });
});
POSCashierController.getCustomers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const result = await cashier_service_1.POSCashierService.getCustomers(filters);
    res.json({
        success: true,
        data: result
    });
});
POSCashierController.searchCustomers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { search } = req.query;
    if (!search) {
        return res.status(400).json({
            success: false,
            message: 'Search term is required'
        });
    }
    const customers = await cashier_service_1.POSCashierService.searchCustomers(search);
    res.json({
        success: true,
        data: customers
    });
});
POSCashierController.getCustomerById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const customer = await cashier_service_1.POSCashierService.getCustomerById(id);
    res.json({
        success: true,
        data: customer
    });
});
POSCashierController.createCustomer = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const customerData = req.body;
    const customer = await cashier_service_1.POSCashierService.createCustomer(customerData);
    res.status(201).json({
        success: true,
        data: customer
    });
});
POSCashierController.updateCustomer = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const customerData = req.body;
    const customer = await cashier_service_1.POSCashierService.updateCustomer(id, customerData);
    res.json({
        success: true,
        data: customer
    });
});
POSCashierController.getTransactions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const result = await cashier_service_1.POSCashierService.getTransactions(filters);
    res.json({
        success: true,
        data: result
    });
});
POSCashierController.getTransactionById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const transaction = await cashier_service_1.POSCashierService.getTransactionById(id);
    res.json({
        success: true,
        data: transaction
    });
});
POSCashierController.createTransaction = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const transactionData = req.body;
    const transaction = await cashier_service_1.POSCashierService.createTransaction(transactionData);
    res.status(201).json({
        success: true,
        data: transaction
    });
});
POSCashierController.updateTransaction = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const transactionData = req.body;
    const transaction = await cashier_service_1.POSCashierService.updateTransaction(id, transactionData);
    res.json({
        success: true,
        data: transaction
    });
});
POSCashierController.cancelTransaction = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const transaction = await cashier_service_1.POSCashierService.cancelTransaction(id);
    res.json({
        success: true,
        data: transaction
    });
});
POSCashierController.createSalesTransaction = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const transactionData = req.body;
    const transaction = await cashier_service_1.POSCashierService.createSalesTransaction(transactionData);
    res.status(201).json({
        success: true,
        data: transaction
    });
});
POSCashierController.getSalesTransactionById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const transaction = await cashier_service_1.POSCashierService.getSalesTransactionById(id);
    res.json({
        success: true,
        data: transaction
    });
});
POSCashierController.getTransactionItems = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { transactionId } = req.params;
    const items = await cashier_service_1.POSCashierService.getTransactionItems(transactionId);
    res.json({
        success: true,
        data: items
    });
});
POSCashierController.createTransactionItem = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const itemData = req.body;
    const item = await cashier_service_1.POSCashierService.createTransactionItem(itemData);
    res.status(201).json({
        success: true,
        data: item
    });
});
POSCashierController.processPayment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const paymentData = req.body;
    const payment = await cashier_service_1.POSCashierService.processPayment(paymentData);
    res.status(201).json({
        success: true,
        data: payment
    });
});
POSCashierController.getPayments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { transactionId } = req.params;
    const payments = await cashier_service_1.POSCashierService.getPayments(transactionId);
    res.json({
        success: true,
        data: payments
    });
});
POSCashierController.startSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const sessionData = req.body;
    const session = await cashier_service_1.POSCashierService.startSession(sessionData);
    res.status(201).json({
        success: true,
        data: session
    });
});
POSCashierController.endSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const closingData = req.body;
    const session = await cashier_service_1.POSCashierService.endSession(id, closingData);
    res.json({
        success: true,
        data: session
    });
});
POSCashierController.getCurrentSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { cashierId } = req.params;
    const session = await cashier_service_1.POSCashierService.getCurrentSession(cashierId);
    res.json({
        success: true,
        data: session
    });
});
POSCashierController.getSessionById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const session = await cashier_service_1.POSCashierService.getSessionById(id);
    res.json({
        success: true,
        data: session
    });
});
POSCashierController.generateReceipt = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { transactionId } = req.params;
    const receipt = await cashier_service_1.POSCashierService.generateReceipt(transactionId);
    res.json({
        success: true,
        data: receipt
    });
});
POSCashierController.getDailyReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { date } = req.params;
    const report = await cashier_service_1.POSCashierService.getDailyReport(date);
    res.json({
        success: true,
        data: report
    });
});
POSCashierController.getSalesReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const report = await cashier_service_1.POSCashierService.getSalesReport(filters);
    res.json({
        success: true,
        data: report
    });
});
POSCashierController.checkInventory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { productId } = req.params;
    const inventory = await cashier_service_1.POSCashierService.checkInventory(productId);
    res.json({
        success: true,
        data: inventory
    });
});
POSCashierController.getLowStockItems = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const items = await cashier_service_1.POSCashierService.getLowStockItems();
    res.json({
        success: true,
        data: items
    });
});
POSCashierController.getQuickSales = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const products = await cashier_service_1.POSCashierService.getQuickSales();
    res.json({
        success: true,
        data: products
    });
});
//# sourceMappingURL=cashier.controller.js.map