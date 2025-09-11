"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_DESCRIPTIONS = exports.ROLE_HIERARCHY = exports.ROLES = void 0;
exports.ROLES = {
    SUPER_ADMIN: 'super_admin',
    HR_ADMIN: 'hr_admin',
    HR_STAFF: 'hr_staff',
    MARKETING_ADMIN: 'marketing_admin',
    MARKETING_STAFF: 'marketing_staff',
    CASHIER: 'cashier',
    INVENTORY_CLERK: 'inventory_clerk',
    CUSTOMER: 'customer'
};
exports.ROLE_HIERARCHY = {
    [exports.ROLES.SUPER_ADMIN]: 100,
    [exports.ROLES.HR_ADMIN]: 80,
    [exports.ROLES.MARKETING_ADMIN]: 80,
    [exports.ROLES.HR_STAFF]: 60,
    [exports.ROLES.MARKETING_STAFF]: 60,
    [exports.ROLES.CASHIER]: 40,
    [exports.ROLES.INVENTORY_CLERK]: 40,
    [exports.ROLES.CUSTOMER]: 20
};
exports.ROLE_DESCRIPTIONS = {
    [exports.ROLES.SUPER_ADMIN]: 'Full system access and administration',
    [exports.ROLES.HR_ADMIN]: 'Human resources administration and management',
    [exports.ROLES.HR_STAFF]: 'Human resources staff operations',
    [exports.ROLES.MARKETING_ADMIN]: 'Marketing campaigns and content administration',
    [exports.ROLES.MARKETING_STAFF]: 'Marketing staff operations',
    [exports.ROLES.CASHIER]: 'Point of sale operations and transactions',
    [exports.ROLES.INVENTORY_CLERK]: 'Inventory management and stock operations',
    [exports.ROLES.CUSTOMER]: 'Customer account and shopping operations'
};
//# sourceMappingURL=roles.js.map