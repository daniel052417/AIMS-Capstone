"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.logout = exports.refreshToken = exports.getCurrentUser = exports.register = exports.login = void 0;
const auth_service_1 = require("../services/auth.service");
const errorHandler_1 = require("../middleware/errorHandler");
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
            return;
        }
        const credentials = {
            email: email.trim().toLowerCase(),
            password
        };
        const result = await auth_service_1.AuthService.login(credentials);
        if (!result.success) {
            res.status(401).json(result);
            return;
        }
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Login controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { email, password, first_name, last_name, role, department } = req.body;
        if (!email || !password || !first_name || !last_name) {
            res.status(400).json({
                success: false,
                message: 'Email, password, first name, and last name are required'
            });
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
            return;
        }
        if (first_name.trim().length < 2 || last_name.trim().length < 2) {
            res.status(400).json({
                success: false,
                message: 'First name and last name must be at least 2 characters long'
            });
            return;
        }
        const userData = {
            email: email.trim().toLowerCase(),
            password,
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            role: role || 'user',
            department: department || null
        };
        const result = await auth_service_1.AuthService.register(userData);
        if (!result.success) {
            const statusCode = result.message.includes('already exists') ? 409 : 400;
            res.status(statusCode).json(result);
            return;
        }
        res.status(201).json(result);
    }
    catch (error) {
        console.error('Register controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.getCurrentUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const result = await auth_service_1.AuthService.getCurrentUser(req.user.id);
        if (!result.success) {
            res.status(404).json(result);
            return;
        }
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Get current user controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
            return;
        }
        const result = await auth_service_1.AuthService.refreshToken(refreshToken);
        if (!result.success) {
            res.status(401).json(result);
            return;
        }
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Refresh token controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const result = await auth_service_1.AuthService.logout(req.user.id);
        if (!result.success) {
            res.status(500).json(result);
            return;
        }
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Logout controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        const bcrypt = require('bcryptjs');
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isCurrentPasswordValid) {
            res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
            return;
        }
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
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
    }
    catch (error) {
        console.error('Change password controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
//# sourceMappingURL=auth.controller.js.map