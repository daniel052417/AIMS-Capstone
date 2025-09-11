export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  HR_ADMIN: 'hr_admin',
  HR_STAFF: 'hr_staff',
  MARKETING_ADMIN: 'marketing_admin',
  MARKETING_STAFF: 'marketing_staff',
  CASHIER: 'cashier',
  INVENTORY_CLERK: 'inventory_clerk',
  CUSTOMER: 'customer'
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.HR_ADMIN]: 80,
  [ROLES.MARKETING_ADMIN]: 80,
  [ROLES.HR_STAFF]: 60,
  [ROLES.MARKETING_STAFF]: 60,
  [ROLES.CASHIER]: 40,
  [ROLES.INVENTORY_CLERK]: 40,
  [ROLES.CUSTOMER]: 20
} as const;

export const ROLE_DESCRIPTIONS = {
  [ROLES.SUPER_ADMIN]: 'Full system access and administration',
  [ROLES.HR_ADMIN]: 'Human resources administration and management',
  [ROLES.HR_STAFF]: 'Human resources staff operations',
  [ROLES.MARKETING_ADMIN]: 'Marketing campaigns and content administration',
  [ROLES.MARKETING_STAFF]: 'Marketing staff operations',
  [ROLES.CASHIER]: 'Point of sale operations and transactions',
  [ROLES.INVENTORY_CLERK]: 'Inventory management and stock operations',
  [ROLES.CUSTOMER]: 'Customer account and shopping operations'
} as const;

