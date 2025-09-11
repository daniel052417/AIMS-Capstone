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
const productsController = __importStar(require("../controllers/products.controller"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/products', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk', 'pos_cashier']), (0, errorHandler_1.asyncHandler)(productsController.getProducts));
router.get('/products/:id', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk', 'pos_cashier']), (0, errorHandler_1.asyncHandler)(productsController.getProductById));
router.post('/products', (0, auth_1.requireRole)(['super_admin', 'inventory_admin']), (0, errorHandler_1.asyncHandler)(productsController.createProduct));
router.put('/products/:id', (0, auth_1.requireRole)(['super_admin', 'inventory_admin']), (0, errorHandler_1.asyncHandler)(productsController.updateProduct));
router.delete('/products/:id', (0, auth_1.requireRole)(['super_admin', 'inventory_admin']), (0, errorHandler_1.asyncHandler)(productsController.deleteProduct));
router.get('/categories', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk', 'pos_cashier']), (0, errorHandler_1.asyncHandler)(productsController.getCategories));
router.post('/categories', (0, auth_1.requireRole)(['super_admin', 'inventory_admin']), (0, errorHandler_1.asyncHandler)(productsController.createCategory));
router.put('/categories/:id', (0, auth_1.requireRole)(['super_admin', 'inventory_admin']), (0, errorHandler_1.asyncHandler)(productsController.updateCategory));
router.delete('/categories/:id', (0, auth_1.requireRole)(['super_admin', 'inventory_admin']), (0, errorHandler_1.asyncHandler)(productsController.deleteCategory));
router.get('/suppliers', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk']), (0, errorHandler_1.asyncHandler)(productsController.getSuppliers));
router.post('/suppliers', (0, auth_1.requireRole)(['super_admin', 'inventory_admin']), (0, errorHandler_1.asyncHandler)(productsController.createSupplier));
router.put('/suppliers/:id', (0, auth_1.requireRole)(['super_admin', 'inventory_admin']), (0, errorHandler_1.asyncHandler)(productsController.updateSupplier));
router.delete('/suppliers/:id', (0, auth_1.requireRole)(['super_admin', 'inventory_admin']), (0, errorHandler_1.asyncHandler)(productsController.deleteSupplier));
router.get('/inventory/levels', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk']), (0, errorHandler_1.asyncHandler)(productsController.getInventoryLevels));
router.put('/inventory/levels/:id', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk']), (0, errorHandler_1.asyncHandler)(productsController.updateInventoryLevel));
router.get('/inventory/movements', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk']), (0, errorHandler_1.asyncHandler)(productsController.getInventoryMovements));
router.post('/inventory/movements', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk']), (0, errorHandler_1.asyncHandler)(productsController.createInventoryMovement));
router.post('/products/:productId/adjust-stock', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk']), (0, errorHandler_1.asyncHandler)(productsController.adjustStock));
router.get('/reports/low-stock', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk']), (0, errorHandler_1.asyncHandler)(productsController.getLowStockProducts));
router.get('/reports/product-sales', (0, auth_1.requireRole)(['super_admin', 'inventory_admin', 'inventory_clerk']), (0, errorHandler_1.asyncHandler)(productsController.getProductSalesReport));
exports.default = router;
//# sourceMappingURL=products.routes.js.map