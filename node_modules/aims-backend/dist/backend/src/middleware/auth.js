"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.requireRole = exports.optionalAuth = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const supabaseClient_1 = require("../config/supabaseClient");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token required'
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwt.secret);
        const { data: user, error } = await supabaseClient_1.supabaseAdmin
            .from('users')
            .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        updated_at
      `)
            .eq('id', decoded.userId)
            .single();
        if (error || !user) {
            res.status(401).json({
                success: false,
                message: 'Invalid token or user not found'
            });
            return;
        }
        if (!user.is_active) {
            res.status(401).json({
                success: false,
                message: 'User account is inactive'
            });
            return;
        }
        const { data: permissions } = await supabaseClient_1.supabaseAdmin
            .from('role_permissions')
            .select('permission')
            .eq('role', user.role);
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            permissions: permissions?.map(p => p.permission) || []
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            next();
            return;
        }
        await (0, exports.authenticateToken)(req, res, next);
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
const requirePermission = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        if (!req.user.permissions.includes(requiredPermission)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
            return;
        }
        next();
    };
};
exports.requirePermission = requirePermission;
//# sourceMappingURL=auth.js.map