"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const salesController = __importStar(require("../controllers/sales.controller"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/orders', (0, auth_1.requireRole)(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), (0, errorHandler_1.asyncHandler)(salesController.getSalesOrders));
router.get('/orders/:id', (0, auth_1.requireRole)(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), (0, errorHandler_1.asyncHandler)(salesController.getSalesOrderById));
router.post('/orders', (0, auth_1.requireRole)(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), (0, errorHandler_1.asyncHandler)(salesController.createSalesOrder));
router.put('/orders/:id', (0, auth_1.requireRole)(['super_admin', 'sales_admin', 'sales_staff']), (0, errorHandler_1.asyncHandler)(salesController.updateSalesOrder));
router.put('/orders/:id/status', (0, auth_1.requireRole)(['super_admin', 'sales_admin', 'sales_staff']), (0, errorHandler_1.asyncHandler)(salesController.updateOrderStatus));
router.get('/transactions', (0, auth_1.requireRole)(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), (0, errorHandler_1.asyncHandler)(salesController.getSalesTransactions));
router.post('/transactions', (0, auth_1.requireRole)(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), (0, errorHandler_1.asyncHandler)(salesController.createSalesTransaction));
router.get('/payments', (0, auth_1.requireRole)(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), (0, errorHandler_1.asyncHandler)(salesController.getPayments));
router.post('/payments', (0, auth_1.requireRole)(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), (0, errorHandler_1.asyncHandler)(salesController.createPayment));
router.get('/customers', (0, auth_1.requireRole)(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), (0, errorHandler_1.asyncHandler)(salesController.getCustomers));
router.get('/customers/:id', (0, auth_1.requireRole)(['super_admin', 'sales_admin', 'sales_staff', 'pos_cashier']), (0, errorHandler_1.asyncHandler)(salesController.getCustomerById));
router.post('/customers', (0, auth_1.requireRole)(['super_admin', 'sales_admin', 'sales_staff']), (0, errorHandler_1.asyncHandler)(salesController.createCustomer));
router.put('/customers/:id', (0, auth_1.requireRole)(['super_admin', 'sales_admin', 'sales_staff']), (0, errorHandler_1.asyncHandler)(salesController.updateCustomer));
router.get('/reports/sales', (0, auth_1.requireRole)(['super_admin', 'sales_admin', 'sales_staff']), (0, errorHandler_1.asyncHandler)(salesController.getSalesReport));
router.get('/reports/top-products', (0, auth_1.requireRole)(['super_admin', 'sales_admin', 'sales_staff']), (0, errorHandler_1.asyncHandler)(salesController.getTopSellingProducts));
router.get('/reports/customer-sales', (0, auth_1.requireRole)(['super_admin', 'sales_admin', 'sales_staff']), (0, errorHandler_1.asyncHandler)(salesController.getCustomerSalesReport));
router.get('/dashboard', (0, auth_1.requireRole)(['super_admin', 'sales_admin', 'sales_staff']), (0, errorHandler_1.asyncHandler)(salesController.getSalesDashboard));
exports.default = router;
//# sourceMappingURL=sales.routes.js.map