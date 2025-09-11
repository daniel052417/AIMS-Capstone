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
const adminController = __importStar(require("../controllers/marketing/admin.controller"));
const staffController = __importStar(require("../controllers/marketing/staff.controller"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/admin/dashboard', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(adminController.getDashboard));
router.get('/admin/campaigns', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(adminController.getCampaigns));
router.get('/admin/campaigns/:id', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(adminController.getCampaignById));
router.post('/admin/campaigns', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(adminController.createCampaign));
router.put('/admin/campaigns/:id', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(adminController.updateCampaign));
router.delete('/admin/campaigns/:id', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(adminController.deleteCampaign));
router.post('/admin/campaigns/:id/publish', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(adminController.publishCampaign));
router.post('/admin/campaigns/:id/unpublish', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(adminController.unpublishCampaign));
router.get('/admin/templates', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(adminController.getTemplates));
router.post('/admin/templates', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(adminController.createTemplate));
router.put('/admin/templates/:id', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(adminController.updateTemplate));
router.delete('/admin/templates/:id', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(adminController.deleteTemplate));
router.get('/admin/analytics', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(adminController.getAnalytics));
router.get('/admin/analytics/campaigns/:id', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(adminController.getCampaignAnalytics));
router.get('/admin/notifications', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(adminController.getNotifications));
router.post('/admin/notifications', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(adminController.createNotification));
router.put('/admin/notifications/:id', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(adminController.updateNotification));
router.delete('/admin/notifications/:id', (0, auth_1.requireRole)(['super_admin', 'marketing_admin']), (0, errorHandler_1.asyncHandler)(adminController.deleteNotification));
router.get('/staff/campaigns', (0, auth_1.requireRole)(['marketing_staff']), (0, errorHandler_1.asyncHandler)(staffController.getCampaigns));
router.get('/staff/campaigns/:id', (0, auth_1.requireRole)(['marketing_staff']), (0, errorHandler_1.asyncHandler)(staffController.getCampaignById));
router.post('/staff/campaigns', (0, auth_1.requireRole)(['marketing_staff']), (0, errorHandler_1.asyncHandler)(staffController.createCampaign));
router.put('/staff/campaigns/:id', (0, auth_1.requireRole)(['marketing_staff']), (0, errorHandler_1.asyncHandler)(staffController.updateCampaign));
router.get('/staff/templates', (0, auth_1.requireRole)(['marketing_staff']), (0, errorHandler_1.asyncHandler)(staffController.getTemplates));
router.get('/staff/analytics', (0, auth_1.requireRole)(['marketing_staff']), (0, errorHandler_1.asyncHandler)(staffController.getAnalytics));
exports.default = router;
//# sourceMappingURL=marketing.routes.js.map