import { Request, Response } from 'express';
import { AuthService, LoginCredentials, RegisterData } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Login user with email and password
 * POST /v1/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
      return;
    }

    // Validate password length
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
      return;
    }

    const credentials: LoginCredentials = {
      email: email.trim().toLowerCase(),
      password
    };

    const result = await AuthService.login(credentials);

    if (!result.success) {
      res.status(401).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Login controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Register a new user
 * POST /v1/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, first_name, last_name, role  } = req.body;

    // Validate required fields
    if (!email || !password || !first_name || !last_name) {
      res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
      return;
    }

    // Validate name fields
    if (first_name.trim().length < 2 || last_name.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'First name and last name must be at least 2 characters long'
      });
      return;
    }

    const userData: RegisterData = {
      email: email.trim().toLowerCase(),
      password,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      role: role || 'user'
    };

    const result = await AuthService.register(userData);

    if (!result.success) {
      const statusCode = result.message.includes('already exists') ? 409 : 400;
      res.status(statusCode).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Register controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get current user information
 * GET /v1/auth/me
 */
export const getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await AuthService.getCurrentUser(req.user.id);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Get current user controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Refresh JWT token
 * POST /v1/auth/refresh
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
      return;
    }

    const result = await AuthService.refreshToken(refreshToken);

    if (!result.success) {
      res.status(401).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Refresh token controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Logout user
 * POST /v1/auth/logout
 */
export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await AuthService.logout(req.user.id);

    if (!result.success) {
      res.status(500).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Logout controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Change user password
 * PUT /v1/auth/change-password
 */
export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
      return;
    }

    // Get user's current password hash
    const { supabaseAdmin } = require('../config/supabaseClient');
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
      return;
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id);

    if (updateError) {
      res.status(500).json({
        success: false,
        message: 'Failed to update password'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
