export const PERMISSIONS = {
  // User management
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  
  // Role management
  ROLES_READ: 'roles:read',
  ROLES_CREATE: 'roles:create',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',
  
  // Permission management
  PERMISSIONS_READ: 'permissions:read',
  PERMISSIONS_CREATE: 'permissions:create',
  PERMISSIONS_UPDATE: 'permissions:update',
  PERMISSIONS_DELETE: 'permissions:delete',
  
  // HR Management
  HR_EMPLOYEES_READ: 'hr:employees:read',
  HR_EMPLOYEES_CREATE: 'hr:employees:create',
  HR_EMPLOYEES_UPDATE: 'hr:employees:update',
  HR_EMPLOYEES_DELETE: 'hr:employees:delete',
  HR_ATTENDANCE_READ: 'hr:attendance:read',
  HR_ATTENDANCE_CREATE: 'hr:attendance:create',
  HR_ATTENDANCE_UPDATE: 'hr:attendance:update',
  HR_LEAVES_READ: 'hr:leaves:read',
  HR_LEAVES_APPROVE: 'hr:leaves:approve',
  HR_LEAVES_REJECT: 'hr:leaves:reject',
  HR_PAYROLL_READ: 'hr:payroll:read',
  HR_PAYROLL_CREATE: 'hr:payroll:create',
  HR_PAYROLL_UPDATE: 'hr:payroll:update',
  
  // Marketing Management
  MARKETING_CAMPAIGNS_READ: 'marketing:campaigns:read',
  MARKETING_CAMPAIGNS_CREATE: 'marketing:campaigns:create',
  MARKETING_CAMPAIGNS_UPDATE: 'marketing:campaigns:update',
  MARKETING_CAMPAIGNS_DELETE: 'marketing:campaigns:delete',
  MARKETING_CAMPAIGNS_PUBLISH: 'marketing:campaigns:publish',
  MARKETING_TEMPLATES_READ: 'marketing:templates:read',
  MARKETING_TEMPLATES_CREATE: 'marketing:templates:create',
  MARKETING_TEMPLATES_UPDATE: 'marketing:templates:update',
  MARKETING_TEMPLATES_DELETE: 'marketing:templates:delete',
  MARKETING_ANALYTICS_READ: 'marketing:analytics:read',
  
  // POS Operations
  POS_TRANSACTIONS_READ: 'pos:transactions:read',
  POS_TRANSACTIONS_CREATE: 'pos:transactions:create',
  POS_TRANSACTIONS_UPDATE: 'pos:transactions:update',
  POS_TRANSACTIONS_DELETE: 'pos:transactions:delete',
  POS_PRODUCTS_READ: 'pos:products:read',
  POS_CUSTOMERS_READ: 'pos:customers:read',
  POS_CUSTOMERS_CREATE: 'pos:customers:create',
  POS_CUSTOMERS_UPDATE: 'pos:customers:update',
  POS_REPORTS_READ: 'pos:reports:read',
  
  // Inventory Management
  INVENTORY_PRODUCTS_READ: 'inventory:products:read',
  INVENTORY_PRODUCTS_CREATE: 'inventory:products:create',
  INVENTORY_PRODUCTS_UPDATE: 'inventory:products:update',
  INVENTORY_PRODUCTS_DELETE: 'inventory:products:delete',
  INVENTORY_STOCK_READ: 'inventory:stock:read',
  INVENTORY_STOCK_UPDATE: 'inventory:stock:update',
  INVENTORY_CATEGORIES_READ: 'inventory:categories:read',
  INVENTORY_CATEGORIES_CREATE: 'inventory:categories:create',
  INVENTORY_CATEGORIES_UPDATE: 'inventory:categories:update',
  INVENTORY_CATEGORIES_DELETE: 'inventory:categories:delete',
  INVENTORY_REPORTS_READ: 'inventory:reports:read',
  
  // System Administration
  SYSTEM_SETTINGS_READ: 'system:settings:read',
  SYSTEM_SETTINGS_UPDATE: 'system:settings:update',
  SYSTEM_AUDIT_READ: 'system:audit:read',
  SYSTEM_HEALTH_READ: 'system:health:read'
} as const;

export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const PERMISSION_DESCRIPTIONS = {
  [PERMISSIONS.USERS_READ]: 'View user accounts',
  [PERMISSIONS.USERS_CREATE]: 'Create new user accounts',
  [PERMISSIONS.USERS_UPDATE]: 'Update user account information',
  [PERMISSIONS.USERS_DELETE]: 'Delete user accounts',
  
  [PERMISSIONS.ROLES_READ]: 'View roles and permissions',
  [PERMISSIONS.ROLES_CREATE]: 'Create new roles',
  [PERMISSIONS.ROLES_UPDATE]: 'Update role information',
  [PERMISSIONS.ROLES_DELETE]: 'Delete roles',
  
  [PERMISSIONS.PERMISSIONS_READ]: 'View system permissions',
  [PERMISSIONS.PERMISSIONS_CREATE]: 'Create new permissions',
  [PERMISSIONS.PERMISSIONS_UPDATE]: 'Update permission information',
  [PERMISSIONS.PERMISSIONS_DELETE]: 'Delete permissions',
  
  [PERMISSIONS.HR_EMPLOYEES_READ]: 'View employee information',
  [PERMISSIONS.HR_EMPLOYEES_CREATE]: 'Create new employee records',
  [PERMISSIONS.HR_EMPLOYEES_UPDATE]: 'Update employee information',
  [PERMISSIONS.HR_EMPLOYEES_DELETE]: 'Delete employee records',
  [PERMISSIONS.HR_ATTENDANCE_READ]: 'View attendance records',
  [PERMISSIONS.HR_ATTENDANCE_CREATE]: 'Create attendance records',
  [PERMISSIONS.HR_ATTENDANCE_UPDATE]: 'Update attendance records',
  [PERMISSIONS.HR_LEAVES_READ]: 'View leave requests',
  [PERMISSIONS.HR_LEAVES_APPROVE]: 'Approve leave requests',
  [PERMISSIONS.HR_LEAVES_REJECT]: 'Reject leave requests',
  [PERMISSIONS.HR_PAYROLL_READ]: 'View payroll information',
  [PERMISSIONS.HR_PAYROLL_CREATE]: 'Create payroll records',
  [PERMISSIONS.HR_PAYROLL_UPDATE]: 'Update payroll records',
  
  [PERMISSIONS.MARKETING_CAMPAIGNS_READ]: 'View marketing campaigns',
  [PERMISSIONS.MARKETING_CAMPAIGNS_CREATE]: 'Create marketing campaigns',
  [PERMISSIONS.MARKETING_CAMPAIGNS_UPDATE]: 'Update marketing campaigns',
  [PERMISSIONS.MARKETING_CAMPAIGNS_DELETE]: 'Delete marketing campaigns',
  [PERMISSIONS.MARKETING_CAMPAIGNS_PUBLISH]: 'Publish marketing campaigns',
  [PERMISSIONS.MARKETING_TEMPLATES_READ]: 'View marketing templates',
  [PERMISSIONS.MARKETING_TEMPLATES_CREATE]: 'Create marketing templates',
  [PERMISSIONS.MARKETING_TEMPLATES_UPDATE]: 'Update marketing templates',
  [PERMISSIONS.MARKETING_TEMPLATES_DELETE]: 'Delete marketing templates',
  [PERMISSIONS.MARKETING_ANALYTICS_READ]: 'View marketing analytics',
  
  [PERMISSIONS.POS_TRANSACTIONS_READ]: 'View POS transactions',
  [PERMISSIONS.POS_TRANSACTIONS_CREATE]: 'Create POS transactions',
  [PERMISSIONS.POS_TRANSACTIONS_UPDATE]: 'Update POS transactions',
  [PERMISSIONS.POS_TRANSACTIONS_DELETE]: 'Cancel POS transactions',
  [PERMISSIONS.POS_PRODUCTS_READ]: 'View products in POS',
  [PERMISSIONS.POS_CUSTOMERS_READ]: 'View customer information',
  [PERMISSIONS.POS_CUSTOMERS_CREATE]: 'Create customer records',
  [PERMISSIONS.POS_CUSTOMERS_UPDATE]: 'Update customer information',
  [PERMISSIONS.POS_REPORTS_READ]: 'View POS reports',
  
  [PERMISSIONS.INVENTORY_PRODUCTS_READ]: 'View inventory products',
  [PERMISSIONS.INVENTORY_PRODUCTS_CREATE]: 'Create inventory products',
  [PERMISSIONS.INVENTORY_PRODUCTS_UPDATE]: 'Update inventory products',
  [PERMISSIONS.INVENTORY_PRODUCTS_DELETE]: 'Delete inventory products',
  [PERMISSIONS.INVENTORY_STOCK_READ]: 'View stock levels',
  [PERMISSIONS.INVENTORY_STOCK_UPDATE]: 'Update stock levels',
  [PERMISSIONS.INVENTORY_CATEGORIES_READ]: 'View product categories',
  [PERMISSIONS.INVENTORY_CATEGORIES_CREATE]: 'Create product categories',
  [PERMISSIONS.INVENTORY_CATEGORIES_UPDATE]: 'Update product categories',
  [PERMISSIONS.INVENTORY_CATEGORIES_DELETE]: 'Delete product categories',
  [PERMISSIONS.INVENTORY_REPORTS_READ]: 'View inventory reports',
  
  [PERMISSIONS.SYSTEM_SETTINGS_READ]: 'View system settings',
  [PERMISSIONS.SYSTEM_SETTINGS_UPDATE]: 'Update system settings',
  [PERMISSIONS.SYSTEM_AUDIT_READ]: 'View audit logs',
  [PERMISSIONS.SYSTEM_HEALTH_READ]: 'View system health status'
} as const;

