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
const accountsController = __importStar(require("../controllers/accounts.controller"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/accounts', (0, auth_1.requireRole)(['super_admin', 'accounting_admin']), (0, errorHandler_1.asyncHandler)(accountsController.getAccounts));
router.get('/accounts/:id', (0, auth_1.requireRole)(['super_admin', 'accounting_admin']), (0, errorHandler_1.asyncHandler)(accountsController.getAccountById));
router.post('/accounts', (0, auth_1.requireRole)(['super_admin', 'accounting_admin']), (0, errorHandler_1.asyncHandler)(accountsController.createAccount));
router.put('/accounts/:id', (0, auth_1.requireRole)(['super_admin', 'accounting_admin']), (0, errorHandler_1.asyncHandler)(accountsController.updateAccount));
router.delete('/accounts/:id', (0, auth_1.requireRole)(['super_admin', 'accounting_admin']), (0, errorHandler_1.asyncHandler)(accountsController.deleteAccount));
router.get('/gl-transactions', (0, auth_1.requireRole)(['super_admin', 'accounting_admin']), (0, errorHandler_1.asyncHandler)(accountsController.getGLTransactions));
router.get('/gl-transactions/:id', (0, auth_1.requireRole)(['super_admin', 'accounting_admin']), (0, errorHandler_1.asyncHandler)(accountsController.getGLTransactionById));
router.post('/gl-transactions', (0, auth_1.requireRole)(['super_admin', 'accounting_admin']), (0, errorHandler_1.asyncHandler)(accountsController.createGLTransaction));
router.put('/gl-transactions/:id/post', (0, auth_1.requireRole)(['super_admin', 'accounting_admin']), (0, errorHandler_1.asyncHandler)(accountsController.postGLTransaction));
router.get('/expenses', (0, auth_1.requireRole)(['super_admin', 'accounting_admin', 'accounting_staff']), (0, errorHandler_1.asyncHandler)(accountsController.getExpenses));
router.post('/expenses', (0, auth_1.requireRole)(['super_admin', 'accounting_admin', 'accounting_staff']), (0, errorHandler_1.asyncHandler)(accountsController.createExpense));
router.put('/expenses/:id', (0, auth_1.requireRole)(['super_admin', 'accounting_admin', 'accounting_staff']), (0, errorHandler_1.asyncHandler)(accountsController.updateExpense));
router.put('/expenses/:id/approve', (0, auth_1.requireRole)(['super_admin', 'accounting_admin']), (0, errorHandler_1.asyncHandler)(accountsController.approveExpense));
router.get('/reports/trial-balance', (0, auth_1.requireRole)(['super_admin', 'accounting_admin']), (0, errorHandler_1.asyncHandler)(accountsController.getTrialBalance));
router.get('/reports/profit-loss', (0, auth_1.requireRole)(['super_admin', 'accounting_admin']), (0, errorHandler_1.asyncHandler)(accountsController.getProfitAndLoss));
router.get('/reports/balance-sheet', (0, auth_1.requireRole)(['super_admin', 'accounting_admin']), (0, errorHandler_1.asyncHandler)(accountsController.getBalanceSheet));
exports.default = router;
//# sourceMappingURL=accounts.routes.js.map