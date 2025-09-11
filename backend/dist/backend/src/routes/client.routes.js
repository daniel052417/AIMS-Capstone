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
const clientController = __importStar(require("../controllers/client.controller"));
const router = (0, express_1.Router)();
router.get('/products', (0, errorHandler_1.asyncHandler)(clientController.getProducts));
router.get('/products/:id', (0, errorHandler_1.asyncHandler)(clientController.getProductById));
router.get('/categories', (0, errorHandler_1.asyncHandler)(clientController.getCategories));
router.get('/promotions', (0, errorHandler_1.asyncHandler)(clientController.getPromotions));
router.get('/promotions/:id', (0, errorHandler_1.asyncHandler)(clientController.getPromotionById));
router.post('/auth/register', (0, errorHandler_1.asyncHandler)(clientController.registerCustomer));
router.post('/auth/login', (0, errorHandler_1.asyncHandler)(clientController.loginCustomer));
router.post('/auth/refresh', (0, errorHandler_1.asyncHandler)(clientController.refreshToken));
router.post('/auth/logout', (0, errorHandler_1.asyncHandler)(clientController.logoutCustomer));
router.post('/auth/forgot-password', (0, errorHandler_1.asyncHandler)(clientController.forgotPassword));
router.post('/auth/reset-password', (0, errorHandler_1.asyncHandler)(clientController.resetPassword));
router.post('/auth/change-password', (0, errorHandler_1.asyncHandler)(clientController.changePassword));
router.use(auth_1.optionalAuth);
router.get('/profile', (0, errorHandler_1.asyncHandler)(clientController.getProfile));
router.put('/profile', (0, errorHandler_1.asyncHandler)(clientController.updateProfile));
router.delete('/profile', (0, errorHandler_1.asyncHandler)(clientController.deleteProfile));
router.get('/cart', (0, errorHandler_1.asyncHandler)(clientController.getCart));
router.post('/cart/add', (0, errorHandler_1.asyncHandler)(clientController.addToCart));
router.put('/cart/update', (0, errorHandler_1.asyncHandler)(clientController.updateCartItem));
router.delete('/cart/remove/:id', (0, errorHandler_1.asyncHandler)(clientController.removeFromCart));
router.delete('/cart/clear', (0, errorHandler_1.asyncHandler)(clientController.clearCart));
router.get('/orders', (0, errorHandler_1.asyncHandler)(clientController.getOrders));
router.get('/orders/:id', (0, errorHandler_1.asyncHandler)(clientController.getOrderById));
router.post('/orders', (0, errorHandler_1.asyncHandler)(clientController.createOrder));
router.put('/orders/:id/cancel', (0, errorHandler_1.asyncHandler)(clientController.cancelOrder));
router.get('/wishlist', (0, errorHandler_1.asyncHandler)(clientController.getWishlist));
router.post('/wishlist/add', (0, errorHandler_1.asyncHandler)(clientController.addToWishlist));
router.delete('/wishlist/remove/:id', (0, errorHandler_1.asyncHandler)(clientController.removeFromWishlist));
router.get('/reviews', (0, errorHandler_1.asyncHandler)(clientController.getReviews));
router.post('/reviews', (0, errorHandler_1.asyncHandler)(clientController.createReview));
router.put('/reviews/:id', (0, errorHandler_1.asyncHandler)(clientController.updateReview));
router.delete('/reviews/:id', (0, errorHandler_1.asyncHandler)(clientController.deleteReview));
router.get('/notifications', (0, errorHandler_1.asyncHandler)(clientController.getNotifications));
router.put('/notifications/:id/read', (0, errorHandler_1.asyncHandler)(clientController.markNotificationAsRead));
router.put('/notifications/read-all', (0, errorHandler_1.asyncHandler)(clientController.markAllNotificationsAsRead));
router.get('/support/tickets', (0, errorHandler_1.asyncHandler)(clientController.getSupportTickets));
router.post('/support/tickets', (0, errorHandler_1.asyncHandler)(clientController.createSupportTicket));
router.get('/support/tickets/:id', (0, errorHandler_1.asyncHandler)(clientController.getSupportTicketById));
router.put('/support/tickets/:id', (0, errorHandler_1.asyncHandler)(clientController.updateSupportTicket));
router.get('/faq', (0, errorHandler_1.asyncHandler)(clientController.getFAQ));
router.post('/contact', (0, errorHandler_1.asyncHandler)(clientController.contactUs));
exports.default = router;
//# sourceMappingURL=client.routes.js.map