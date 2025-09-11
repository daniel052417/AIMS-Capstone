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
const purchasesController = __importStar(require("../controllers/purchases.controller"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/orders', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk']), (0, errorHandler_1.asyncHandler)(purchasesController.getPurchaseOrders));
router.get('/orders/:id', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk']), (0, errorHandler_1.asyncHandler)(purchasesController.getPurchaseOrderById));
router.post('/orders', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk']), (0, errorHandler_1.asyncHandler)(purchasesController.createPurchaseOrder));
router.put('/orders/:id', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk']), (0, errorHandler_1.asyncHandler)(purchasesController.updatePurchaseOrder));
router.put('/orders/:id/approve', (0, auth_1.requireRole)(['super_admin', 'inventory_admin']), (0, errorHandler_1.asyncHandler)(purchasesController.approvePurchaseOrder));
router.put('/items/:id', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk']), (0, errorHandler_1.asyncHandler)(purchasesController.updatePurchaseOrderItem));
router.put('/items/:id/receive', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk']), (0, errorHandler_1.asyncHandler)(purchasesController.receivePurchaseOrderItem));
router.get('/suppliers', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk']), (0, errorHandler_1.asyncHandler)(purchasesController.getSuppliers));
router.get('/suppliers/:id', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk']), (0, errorHandler_1.asyncHandler)(purchasesController.getSupplierById));
router.post('/suppliers', (0, auth_1.requireRole)(['super_admin', 'inventory_admin']), (0, errorHandler_1.asyncHandler)(purchasesController.createSupplier));
router.put('/suppliers/:id', (0, auth_1.requireRole)(['super_admin', 'inventory_admin']), (0, errorHandler_1.asyncHandler)(purchasesController.updateSupplier));
router.get('/reports/purchases', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk']), (0, errorHandler_1.asyncHandler)(purchasesController.getPurchaseReport));
router.get('/reports/supplier-performance', (0, auth_1.requireRole)(['super_admin', 'inventory_admin']), (0, errorHandler_1.asyncHandler)(purchasesController.getSupplierPerformance));
router.get('/dashboard', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk']), (0, errorHandler_1.asyncHandler)(purchasesController.getPurchasesDashboard));
exports.default = router;
//# sourceMappingURL=purchases.routes.js.map