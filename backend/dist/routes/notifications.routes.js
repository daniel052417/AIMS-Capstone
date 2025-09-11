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
const notificationsController = __importStar(require("../controllers/notifications.controller"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/user', (0, auth_1.requireRole)(['super_admin', 'hr_admin', 'hr_staff', 'marketing_admin', 'marketing_staff', 'inventory_admin', 'inventory_clerk', 'pos_cashier', 'sales_admin', 'sales_staff']), (0, errorHandler_1.asyncHandler)(notificationsController.getNotifications));
router.post('/user', (0, auth_1.requireRole)(['super_admin']), (0, errorHandler_1.asyncHandler)(notificationsController.createNotification));
router.put('/user/:id/read', (0, auth_1.requireRole)(['super_admin', 'hr_admin', 'hr_staff', 'marketing_admin', 'marketing_staff', 'inventory_admin', 'inventory_clerk', 'pos_cashier', 'sales_admin', 'sales_staff']), (0, errorHandler_1.asyncHandler)(notificationsController.markAsRead));
router.put('/user/mark-all-read', (0, auth_1.requireRole)(['super_admin', 'hr_admin', 'hr_staff', 'marketing_admin', 'marketing_staff', 'inventory_admin', 'inventory_clerk', 'pos_cashier', 'sales_admin', 'sales_staff']), (0, errorHandler_1.asyncHandler)(notificationsController.markAllAsRead));
router.delete('/user/:id', (0, auth_1.requireRole)(['super_admin', 'hr_admin', 'hr_staff', 'marketing_admin', 'marketing_staff', 'inventory_admin', 'inventory_clerk', 'pos_cashier', 'sales_admin', 'sales_staff']), (0, errorHandler_1.asyncHandler)(notificationsController.deleteNotification));
router.get('/templates', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(notificationsController.getNotificationTemplates));
router.get('/templates/:id', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(notificationsController.getNotificationTemplateById));
router.post('/templates', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(notificationsController.createNotificationTemplate));
router.put('/templates/:id', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(notificationsController.updateNotificationTemplate));
router.delete('/templates/:id', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(notificationsController.deleteNotificationTemplate));
router.get('/client', (0, auth_1.requireRole)(['super_admin', 'marketing_admin', 'marketing_staff']), (0, errorHandler_1.asyncHandler)(notificationsController.getClientNotifications));
router.post('/client', (0, auth_1.requireRole)(['super_admin', 'marketing_admin', 'marketing_staff']), (0, errorHandler_1.asyncHandler)(notificationsController.createClientNotification));
router.put('/client/:id', (0, auth_1.requireRole)(['super_admin', 'marketing_admin', 'marketing_staff']), (0, errorHandler_1.asyncHandler)(notificationsController.updateClientNotification));
router.delete('/client/:id', (0, auth_1.requireRole)(['super_admin', 'marketing_admin', 'marketing_staff']), (0, errorHandler_1.asyncHandler)(notificationsController.deleteClientNotification));
router.post('/client/:id/send', (0, auth_1.requireRole)(['super_admin', 'marketing_admin', 'marketing_staff']), (0, errorHandler_1.asyncHandler)(notificationsController.sendClientNotification));
router.post('/bulk', (0, auth_1.requireRole)(['super_admin']), (0, errorHandler_1.asyncHandler)(notificationsController.sendBulkNotification));
router.post('/system', (0, auth_1.requireRole)(['super_admin']), (0, errorHandler_1.asyncHandler)(notificationsController.sendSystemNotification));
router.get('/stats', (0, auth_1.requireRole)(['super_admin', 'hr_admin', 'hr_staff', 'marketing_admin', 'marketing_staff', 'inventory_admin', 'inventory_clerk', 'pos_cashier', 'sales_admin', 'sales_staff']), (0, errorHandler_1.asyncHandler)(notificationsController.getNotificationStats));
exports.default = router;
//# sourceMappingURL=notifications.routes.js.map