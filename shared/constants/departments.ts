import { DEPARTMENTS } from '../types/department';

export const DEPARTMENT_CONFIG = {
  [DEPARTMENTS.ADMIN]: {
    name: 'Administration',
    description: 'System administration and management',
    color: '#8B5CF6',
    icon: 'settings'
  },
  [DEPARTMENTS.HR]: {
    name: 'Human Resources',
    description: 'Employee management and HR operations',
    color: '#10B981',
    icon: 'users'
  },
  [DEPARTMENTS.MARKETING]: {
    name: 'Marketing',
    description: 'Marketing campaigns and promotions',
    color: '#F59E0B',
    icon: 'megaphone'
  },
  [DEPARTMENTS.SALES]: {
    name: 'Sales',
    description: 'Sales operations and customer relations',
    color: '#EF4444',
    icon: 'trending-up'
  },
  [DEPARTMENTS.INVENTORY]: {
    name: 'Inventory',
    description: 'Stock management and product operations',
    color: '#3B82F6',
    icon: 'package'
  },
  [DEPARTMENTS.FINANCE]: {
    name: 'Finance',
    description: 'Financial management and accounting',
    color: '#059669',
    icon: 'currency-dollar'
  },
  [DEPARTMENTS.IT]: {
    name: 'Information Technology',
    description: 'IT support and system maintenance',
    color: '#6366F1',
    icon: 'computer'
  },
  [DEPARTMENTS.CUSTOMER_SERVICE]: {
    name: 'Customer Service',
    description: 'Customer support and service',
    color: '#EC4899',
    icon: 'chat'
  }
} as const;

export const DEPARTMENT_ROLES = {
  [DEPARTMENTS.ADMIN]: ['super_admin'],
  [DEPARTMENTS.HR]: ['hr_admin', 'hr_staff'],
  [DEPARTMENTS.MARKETING]: ['marketing_admin', 'marketing_staff'],
  [DEPARTMENTS.SALES]: ['cashier'],
  [DEPARTMENTS.INVENTORY]: ['inventory_clerk'],
  [DEPARTMENTS.FINANCE]: ['finance_admin', 'finance_staff'],
  [DEPARTMENTS.IT]: ['it_admin', 'it_staff'],
  [DEPARTMENTS.CUSTOMER_SERVICE]: ['customer_service_admin', 'customer_service_staff']
} as const;

