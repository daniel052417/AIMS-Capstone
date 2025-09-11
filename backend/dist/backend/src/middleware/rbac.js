"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireDepartment = exports.requireAnyPermission = exports.requireAllPermissions = exports.requirePermission = exports.requireRole = void 0;
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
                message: 'Insufficient permissions',
                required: allowedRoles,
                current: req.user.role
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
                message: 'Insufficient permissions',
                required: requiredPermission,
                current: req.user.permissions
            });
            return;
        }
        next();
    };
};
exports.requirePermission = requirePermission;
const requireAllPermissions = (requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const hasAllPermissions = requiredPermissions.every(permission => req.user.permissions.includes(permission));
        if (!hasAllPermissions) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
                required: requiredPermissions,
                current: req.user.permissions
            });
            return;
        }
        next();
    };
};
exports.requireAllPermissions = requireAllPermissions;
const requireAnyPermission = (requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const hasAnyPermission = requiredPermissions.some(permission => req.user.permissions.includes(permission));
        if (!hasAnyPermission) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
                required: requiredPermissions,
                current: req.user.permissions
            });
            return;
        }
        next();
    };
};
exports.requireAnyPermission = requireAnyPermission;
const requireDepartment = (allowedDepartments) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        if (!req.user.department || !allowedDepartments.includes(req.user.department)) {
            res.status(403).json({
                success: false,
                message: 'Access denied for your department',
                required: allowedDepartments,
                current: req.user.department
            });
            return;
        }
        next();
    };
};
exports.requireDepartment = requireDepartment;
//# sourceMappingURL=rbac.js.map