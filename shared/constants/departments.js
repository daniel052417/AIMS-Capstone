"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEPARTMENT_ROLES = exports.DEPARTMENT_CONFIG = void 0;
const department_1 = require("../types/department");
exports.DEPARTMENT_CONFIG = {
    [department_1.DEPARTMENTS.ADMIN]: {
        name: 'Administration',
        description: 'System administration and management',
        color: '#8B5CF6',
        icon: 'settings'
    },
    [department_1.DEPARTMENTS.HR]: {
        name: 'Human Resources',
        description: 'Employee management and HR operations',
        color: '#10B981',
        icon: 'users'
    },
    [department_1.DEPARTMENTS.MARKETING]: {
        name: 'Marketing',
        description: 'Marketing campaigns and promotions',
        color: '#F59E0B',
        icon: 'megaphone'
    },
    [department_1.DEPARTMENTS.SALES]: {
        name: 'Sales',
        description: 'Sales operations and customer relations',
        color: '#EF4444',
        icon: 'trending-up'
    },
    [department_1.DEPARTMENTS.INVENTORY]: {
        name: 'Inventory',
        description: 'Stock management and product operations',
        color: '#3B82F6',
        icon: 'package'
    },
    [department_1.DEPARTMENTS.FINANCE]: {
        name: 'Finance',
        description: 'Financial management and accounting',
        color: '#059669',
        icon: 'currency-dollar'
    },
    [department_1.DEPARTMENTS.IT]: {
        name: 'Information Technology',
        description: 'IT support and system maintenance',
        color: '#6366F1',
        icon: 'computer'
    },
    [department_1.DEPARTMENTS.CUSTOMER_SERVICE]: {
        name: 'Customer Service',
        description: 'Customer support and service',
        color: '#EC4899',
        icon: 'chat'
    }
};
exports.DEPARTMENT_ROLES = {
    [department_1.DEPARTMENTS.ADMIN]: ['super_admin'],
    [department_1.DEPARTMENTS.HR]: ['hr_admin', 'hr_staff'],
    [department_1.DEPARTMENTS.MARKETING]: ['marketing_admin', 'marketing_staff'],
    [department_1.DEPARTMENTS.SALES]: ['cashier'],
    [department_1.DEPARTMENTS.INVENTORY]: ['inventory_clerk'],
    [department_1.DEPARTMENTS.FINANCE]: ['finance_admin', 'finance_staff'],
    [department_1.DEPARTMENTS.IT]: ['it_admin', 'it_staff'],
    [department_1.DEPARTMENTS.CUSTOMER_SERVICE]: ['customer_service_admin', 'customer_service_staff']
};
//# sourceMappingURL=departments.js.map