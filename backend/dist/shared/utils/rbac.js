"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAnyRole = exports.validateRole = exports.validatePermission = exports.getAccessibleDepartments = exports.canAccessDepartment = exports.canManageUser = exports.canAccessResource = exports.hasHigherRole = exports.hasAnyRole = exports.hasRole = exports.hasAllPermissions = exports.hasAnyPermission = exports.hasPermission = void 0;
const roles_1 = require("../constants/roles");
const hasPermission = (user, permission) => {
    return user.permissions.includes(permission);
};
exports.hasPermission = hasPermission;
const hasAnyPermission = (user, permissions) => {
    return permissions.some(permission => user.permissions.includes(permission));
};
exports.hasAnyPermission = hasAnyPermission;
const hasAllPermissions = (user, permissions) => {
    return permissions.every(permission => user.permissions.includes(permission));
};
exports.hasAllPermissions = hasAllPermissions;
const hasRole = (user, role) => {
    return user.role === role;
};
exports.hasRole = hasRole;
const hasAnyRole = (user, roles) => {
    return roles.includes(user.role);
};
exports.hasAnyRole = hasAnyRole;
const hasHigherRole = (user, targetRole) => {
    const userLevel = roles_1.ROLE_HIERARCHY[user.role] || 0;
    const targetLevel = roles_1.ROLE_HIERARCHY[targetRole] || 0;
    return userLevel > targetLevel;
};
exports.hasHigherRole = hasHigherRole;
const canAccessResource = (user, resource, action) => {
    const permission = `${resource}:${action}`;
    return (0, exports.hasPermission)(user, permission);
};
exports.canAccessResource = canAccessResource;
const canManageUser = (user, targetUser) => {
    if (user.role === roles_1.ROLES.SUPER_ADMIN) {
        return true;
    }
    if (user.id === targetUser.id) {
        return false;
    }
    return (0, exports.hasHigherRole)(user, targetUser.role);
};
exports.canManageUser = canManageUser;
const canAccessDepartment = (user, department) => {
    if (user.role === roles_1.ROLES.SUPER_ADMIN) {
        return true;
    }
    return user.department === department;
};
exports.canAccessDepartment = canAccessDepartment;
const getAccessibleDepartments = (user) => {
    if (user.role === roles_1.ROLES.SUPER_ADMIN) {
        return Object.values(roles_1.ROLES);
    }
    return user.department ? [user.department] : [];
};
exports.getAccessibleDepartments = getAccessibleDepartments;
const validatePermission = (user, requiredPermission) => {
    if (!(0, exports.hasPermission)(user, requiredPermission)) {
        throw new Error(`Insufficient permissions. Required: ${requiredPermission}`);
    }
    return true;
};
exports.validatePermission = validatePermission;
const validateRole = (user, requiredRole) => {
    if (!(0, exports.hasRole)(user, requiredRole)) {
        throw new Error(`Insufficient role. Required: ${requiredRole}`);
    }
    return true;
};
exports.validateRole = validateRole;
const validateAnyRole = (user, requiredRoles) => {
    if (!(0, exports.hasAnyRole)(user, requiredRoles)) {
        throw new Error(`Insufficient role. Required one of: ${requiredRoles.join(', ')}`);
    }
    return true;
};
exports.validateAnyRole = validateAnyRole;
//# sourceMappingURL=rbac.js.map