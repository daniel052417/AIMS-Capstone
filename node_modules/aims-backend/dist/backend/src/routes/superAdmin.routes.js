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
const superAdminController = __importStar(require("../controllers/superAdmin.controller"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['super_admin']));
router.get('/dashboard', (0, errorHandler_1.asyncHandler)(superAdminController.getDashboardData));
router.get('/analytics', (0, errorHandler_1.asyncHandler)(superAdminController.getAnalytics));
router.get('/users', (0, errorHandler_1.asyncHandler)(superAdminController.getUsers));
router.get('/users/:id', (0, errorHandler_1.asyncHandler)(superAdminController.getUserById));
router.post('/users', (0, errorHandler_1.asyncHandler)(superAdminController.createUser));
router.put('/users/:id', (0, errorHandler_1.asyncHandler)(superAdminController.updateUser));
router.delete('/users/:id', (0, errorHandler_1.asyncHandler)(superAdminController.deleteUser));
router.get('/roles', (0, errorHandler_1.asyncHandler)(superAdminController.getRoles));
router.post('/roles', (0, errorHandler_1.asyncHandler)(superAdminController.createRole));
router.put('/roles/:id', (0, errorHandler_1.asyncHandler)(superAdminController.updateRole));
router.delete('/roles/:id', (0, errorHandler_1.asyncHandler)(superAdminController.deleteRole));
router.get('/permissions', (0, errorHandler_1.asyncHandler)(superAdminController.getPermissions));
router.post('/permissions', (0, errorHandler_1.asyncHandler)(superAdminController.createPermission));
router.put('/permissions/:id', (0, errorHandler_1.asyncHandler)(superAdminController.updatePermission));
router.delete('/permissions/:id', (0, errorHandler_1.asyncHandler)(superAdminController.deletePermission));
router.get('/settings/app', (0, errorHandler_1.asyncHandler)(superAdminController.getAppSettings));
router.put('/settings/app', (0, errorHandler_1.asyncHandler)(superAdminController.updateAppSettings));
router.get('/settings/system', (0, errorHandler_1.asyncHandler)(superAdminController.getSystemSettings));
router.put('/settings/system/:key', (0, errorHandler_1.asyncHandler)(superAdminController.updateSystemSetting));
router.get('/audit-logs', (0, errorHandler_1.asyncHandler)(superAdminController.getAuditLogs));
router.get('/audit-logs/:id', (0, errorHandler_1.asyncHandler)(superAdminController.getAuditLogById));
router.get('/staff', (0, errorHandler_1.asyncHandler)(superAdminController.getStaffWithAccounts));
router.get('/users/:userId/components', (0, errorHandler_1.asyncHandler)(superAdminController.getUserAccessibleComponents));
router.get('/users/:userId/permissions', (0, errorHandler_1.asyncHandler)(superAdminController.getUserPermissions));
router.get('/users/:userId/check-permission', (0, errorHandler_1.asyncHandler)(superAdminController.checkUserPermission));
router.get('/system/health', (0, errorHandler_1.asyncHandler)(superAdminController.getSystemHealth));
router.get('/system/stats', (0, errorHandler_1.asyncHandler)(superAdminController.getSystemStats));
exports.default = router;
//# sourceMappingURL=superAdmin.routes.js.map