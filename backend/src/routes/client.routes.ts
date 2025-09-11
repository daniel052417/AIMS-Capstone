import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as clientController from '../controllers/client.controller';

const router = Router();

// Public routes (no authentication required)
router.get('/products', asyncHandler(clientController.getProducts));
router.get('/products/:id', asyncHandler(clientController.getProductById));
router.get('/categories', asyncHandler(clientController.getCategories));
router.get('/promotions', asyncHandler(clientController.getPromotions));
router.get('/promotions/:id', asyncHandler(clientController.getPromotionById));

// Customer registration and login
router.post('/auth/register', asyncHandler(clientController.registerCustomer));
router.post('/auth/login', asyncHandler(clientController.loginCustomer));
router.post('/auth/refresh', asyncHandler(clientController.refreshToken));
router.post('/auth/logout', asyncHandler(clientController.logoutCustomer));

// Password management
router.post('/auth/forgot-password', asyncHandler(clientController.forgotPassword));
router.post('/auth/reset-password', asyncHandler(clientController.resetPassword));
router.post('/auth/change-password', asyncHandler(clientController.changePassword));

// Apply optional authentication for customer-specific routes
router.use(optionalAuth);

// Customer profile
router.get('/profile', asyncHandler(clientController.getProfile));
router.put('/profile', asyncHandler(clientController.updateProfile));
router.delete('/profile', asyncHandler(clientController.deleteProfile));

// Shopping cart
router.get('/cart', asyncHandler(clientController.getCart));
router.post('/cart/add', asyncHandler(clientController.addToCart));
router.put('/cart/update', asyncHandler(clientController.updateCartItem));
router.delete('/cart/remove/:id', asyncHandler(clientController.removeFromCart));
router.delete('/cart/clear', asyncHandler(clientController.clearCart));

// Orders
router.get('/orders', asyncHandler(clientController.getOrders));
router.get('/orders/:id', asyncHandler(clientController.getOrderById));
router.post('/orders', asyncHandler(clientController.createOrder));
router.put('/orders/:id/cancel', asyncHandler(clientController.cancelOrder));

// Wishlist
router.get('/wishlist', asyncHandler(clientController.getWishlist));
router.post('/wishlist/add', asyncHandler(clientController.addToWishlist));
router.delete('/wishlist/remove/:id', asyncHandler(clientController.removeFromWishlist));

// Reviews and ratings
router.get('/reviews', asyncHandler(clientController.getReviews));
router.post('/reviews', asyncHandler(clientController.createReview));
router.put('/reviews/:id', asyncHandler(clientController.updateReview));
router.delete('/reviews/:id', asyncHandler(clientController.deleteReview));

// Notifications
router.get('/notifications', asyncHandler(clientController.getNotifications));
router.put('/notifications/:id/read', asyncHandler(clientController.markNotificationAsRead));
router.put('/notifications/read-all', asyncHandler(clientController.markAllNotificationsAsRead));

// Support
router.get('/support/tickets', asyncHandler(clientController.getSupportTickets));
router.post('/support/tickets', asyncHandler(clientController.createSupportTicket));
router.get('/support/tickets/:id', asyncHandler(clientController.getSupportTicketById));
router.put('/support/tickets/:id', asyncHandler(clientController.updateSupportTicket));

// FAQ
router.get('/faq', asyncHandler(clientController.getFAQ));

// Contact
router.post('/contact', asyncHandler(clientController.contactUs));

export default router;

