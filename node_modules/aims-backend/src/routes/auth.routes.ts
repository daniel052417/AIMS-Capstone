import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as authController from '../controllers/auth.controller';

const router = Router();

/**
 * @route   POST /v1/auth/login
 * @desc    Login user with email and password
 * @access  Public
 */
router.post('/login', asyncHandler(authController.login));

/**
 * @route   POST /v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', asyncHandler(authController.register));

/**
 * @route   POST /v1/auth/refresh
 * @desc    Refresh JWT token
 * @access  Public
 */
router.post('/refresh', asyncHandler(authController.refreshToken));

/**
 * @route   GET /v1/auth/me
 * @desc    Get current user information
 * @access  Private
 */
router.get('/me', authenticateToken, asyncHandler(authController.getCurrentUser));

/**
 * @route   POST /v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticateToken, asyncHandler(authController.logout));

/**
 * @route   PUT /v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticateToken, asyncHandler(authController.changePassword));

export default router;

