import React from 'react';
import { usePermissions } from '../context/PermissionContext';

// System Permission Types
export type SystemPermission = 
  // User Management
  | 'users.create' | 'users.read' | 'users.update' | 'users.delete' | 'users.manage_roles'
  // Role Management
  | 'roles.create' | 'roles.read' | 'roles.update' | 'roles.delete'
  // Admin Management
  | 'admin.overview' | 'admin.active_users' | 'admin.user_activity' | 'admin.settings'
  // Sales & POS
  | 'sales.create' | 'sales.read' | 'sales.update' | 'sales.delete' | 'sales.export'
  | 'pos.access' | 'pos.sell' | 'pos.refund' | 'pos.discount' | 'pos.cash_management'
  | 'pos.product_search' | 'pos.price_override' | 'pos.customer_lookup'
  | 'pos.payment_cash' | 'pos.payment_card' | 'pos.payment_other'
  | 'pos.receipt_generate' | 'pos.receipt_reprint'
  // Inventory Management
  | 'inventory.create' | 'inventory.read' | 'inventory.update' | 'inventory.delete' | 'inventory.adjust'
  | 'products.create' | 'products.read' | 'products.update' | 'products.delete'
  // HR Management
  | 'hr.staff_create' | 'hr.staff_read' | 'hr.staff_update' | 'hr.staff_delete'
  | 'hr.attendance_read' | 'hr.attendance_update' | 'hr.timesheet_manage'
  | 'hr.leave_requests' | 'hr.leave_approve' | 'hr.leave_reject' | 'hr.leave_create'
  | 'hr.payroll_read' | 'hr.payroll_update' | 'hr.compensation_manage'
  | 'hr.performance_read' | 'hr.performance_update'
  | 'hr.training_read' | 'hr.training_create' | 'hr.training_assign'
  | 'hr.analytics'
  // Marketing Management
  | 'campaigns.create' | 'campaigns.read' | 'campaigns.update' | 'campaigns.delete'
  | 'campaigns.launch' | 'campaigns.pause' | 'campaigns.analytics'
  | 'templates.create' | 'templates.read' | 'templates.update' | 'templates.delete'
  | 'notifications.send' | 'notifications.read' | 'notifications.manage'
  // Reports & Analytics
  | 'reports.read' | 'reports.export' | 'reports.hr' | 'reports.marketing'
  | 'reports.events' | 'reports.analytics'
  // Claims Management
  | 'claims.create' | 'claims.read' | 'claims.update' | 'claims.delete'
  | 'claims.approve' | 'claims.reject'
  // Branch Management
  | 'branches.create' | 'branches.read' | 'branches.update' | 'branches.delete' | 'branches.manage'
  // Client Management
  | 'client.profile' | 'client.orders' | 'client.notifications'
  // Order Management
  | 'orders.create' | 'orders.read' | 'orders.update' | 'orders.cancel'
  // Payment Management
  | 'payments.create' | 'payments.read' | 'payments.refund'
  // Customer Management
  | 'customers.create' | 'customers.read' | 'customers.update'
  // Supplier Management
  | 'suppliers.create' | 'suppliers.read' | 'suppliers.update' | 'suppliers.delete'
  // Settings
  | 'settings.read' | 'settings.update';

// System Role Types
export type SystemRole = 
  | 'super_admin'
  | 'admin'
  | 'hr_admin'
  | 'hr'
  | 'marketing_admin'
  | 'marketing'
  | 'sales_admin'
  | 'sales_staff'
  | 'pos_cashier'
  | 'inventory_admin'
  | 'inventory_clerk'
  | 'accounting_admin'
  | 'accounting_staff'
  | 'user';

interface CanProps {
  children: React.ReactNode;
  permission?: SystemPermission;
  permissions?: SystemPermission[];
  roles?: SystemRole[];
  requireAll?: boolean; // If true, user must have ALL permissions/roles
  fallback?: React.ReactNode;
  showLoading?: boolean;
  loadingComponent?: React.ReactNode;
  // Element type to render
  as?: 'button' | 'div' | 'span';
  // Props for the rendered element
  buttonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  divProps?: React.HTMLAttributes<HTMLDivElement>;
  spanProps?: React.HTMLAttributes<HTMLSpanElement>;
}

/**
 * Unified component for conditional rendering based on permissions and roles
 * Replaces DynamicButton, PermissionWrapper, and ConditionalRender
 * 
 * @example
 * // Generic permission wrapper (defaults to div)
 * <Can permission="users.create">
 *   <button onClick={handleClick}>Add User</button>
 * </Can>
 * 
 * // As a button with props (recommended for buttons)
 * <Can 
 *   permission="users.create" 
 *   as="button"
 *   buttonProps={{ 
 *     className: "btn-primary", 
 *     onClick: handleClick 
 *   }}
 * >
 *   Add User
 * </Can>
 * 
 * // Multiple permissions (any)
 * <Can permissions={['users.update', 'users.delete']}>
 *   <AdminPanel />
 * </Can>
 * 
 * // Multiple permissions (all required)
 * <Can permissions={['users.update', 'users.delete']} requireAll={true}>
 *   <FullAdminPanel />
 * </Can>
 * 
 * // Role + permission combination
 * <Can roles={['admin']} permissions={['settings.read']}>
 *   <SettingsPanel />
 * </Can>
 * 
 * // As a span element
 * <Can 
 *   permission="users.read" 
 *   as="span"
 *   buttonProps={{ className: "text-blue-600" }}
 * >
 *   View User
 * </Can>
 */
export const Can: React.FC<CanProps> = ({
  children,
  permission,
  permissions = [],
  roles = [],
  requireAll = false,
  fallback = null,
  showLoading = true,
  loadingComponent = <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>,
  as = 'div',
  buttonProps = {},
  divProps = {},
  spanProps = {}
}) => {
  const { 
    hasPermission, 
    hasRole, 
    hasAnyPermission, 
    hasAnyRole, 
    isLoading 
  } = usePermissions();

  // Show loading state
  if (isLoading && showLoading) {
    return <>{loadingComponent}</>;
  }

  // Check single permission
  let hasRequiredPermissions = true;
  if (permission) {
    hasRequiredPermissions = hasPermission(permission);
  } else if (permissions.length > 0) {
    if (requireAll) {
      hasRequiredPermissions = permissions.every(perm => hasPermission(perm));
    } else {
      hasRequiredPermissions = hasAnyPermission(permissions);
    }
  }

  // Check roles
  let hasRequiredRoles = true;
  if (roles.length > 0) {
    if (requireAll) {
      hasRequiredRoles = roles.every(role => hasRole(role));
    } else {
      hasRequiredRoles = hasAnyRole(roles);
    }
  }

  const canShow = hasRequiredPermissions && hasRequiredRoles;

  if (!canShow) {
    return <>{fallback}</>;
  }

  // Render based on the 'as' prop
  if (as === 'button') {
    return <button {...buttonProps}>{children}</button>;
  } else if (as === 'span') {
    return <span {...spanProps}>{children}</span>;
  } else {
    // Default to div wrapper for generic permission checking
    return <div {...divProps}>{children}</div>;
  }
};

/**
 * Hook for conditional rendering logic
 * Useful when you need to check permissions in component logic
 */
export const useCan = (
  permission?: SystemPermission,
  permissions: SystemPermission[] = [],
  roles: SystemRole[] = [],
  requireAll: boolean = false
) => {
  const { 
    hasPermission, 
    hasRole, 
    hasAnyPermission, 
    hasAnyRole, 
    isLoading 
  } = usePermissions();

  if (isLoading) {
    return { can: false, isLoading: true };
  }

  // Check single permission
  let hasRequiredPermissions = true;
  if (permission) {
    hasRequiredPermissions = hasPermission(permission);
  } else if (permissions.length > 0) {
    if (requireAll) {
      hasRequiredPermissions = permissions.every(perm => hasPermission(perm));
    } else {
      hasRequiredPermissions = hasAnyPermission(permissions);
    }
  }

  // Check roles
  let hasRequiredRoles = true;
  if (roles.length > 0) {
    if (requireAll) {
      hasRequiredRoles = roles.every(role => hasRole(role));
    } else {
      hasRequiredRoles = hasAnyRole(roles);
    }
  }

  return {
    can: hasRequiredPermissions && hasRequiredRoles,
    isLoading: false
  };
};

/**
 * Higher-order component for wrapping components with permission checks
 * Replaces withPermission from PermissionWrapper
 */
export const withCan = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  config: {
    permission?: SystemPermission;
    permissions?: SystemPermission[];
    roles?: SystemRole[];
    requireAll?: boolean;
    fallback?: React.ReactNode;
  } = {}
) => {
  return function CanWrappedComponent(props: P) {
    return (
      <Can
        permission={config.permission}
        permissions={config.permissions}
        roles={config.roles}
        requireAll={config.requireAll}
        fallback={config.fallback}
      >
        <WrappedComponent {...props} />
      </Can>
    );
  };
};

// Permission Groups for easier management
export const PERMISSION_GROUPS = {
  USER_MANAGEMENT: ['users.create', 'users.read', 'users.update', 'users.delete', 'users.manage_roles'] as const,
  ROLE_MANAGEMENT: ['roles.create', 'roles.read', 'roles.update', 'roles.delete'] as const,
  ADMIN_MANAGEMENT: ['admin.overview', 'admin.active_users', 'admin.user_activity', 'admin.settings'] as const,
  SALES_MANAGEMENT: ['sales.create', 'sales.read', 'sales.update', 'sales.delete', 'sales.export'] as const,
  POS_MANAGEMENT: ['pos.access', 'pos.sell', 'pos.refund', 'pos.discount', 'pos.cash_management', 'pos.product_search', 'pos.price_override', 'pos.customer_lookup', 'pos.payment_cash', 'pos.payment_card', 'pos.payment_other', 'pos.receipt_generate', 'pos.receipt_reprint'] as const,
  INVENTORY_MANAGEMENT: ['inventory.create', 'inventory.read', 'inventory.update', 'inventory.delete', 'inventory.adjust', 'products.create', 'products.read', 'products.update', 'products.delete'] as const,
  HR_MANAGEMENT: ['hr.staff_create', 'hr.staff_read', 'hr.staff_update', 'hr.staff_delete', 'hr.attendance_read', 'hr.attendance_update', 'hr.timesheet_manage', 'hr.leave_requests', 'hr.leave_approve', 'hr.leave_reject', 'hr.leave_create', 'hr.payroll_read', 'hr.payroll_update', 'hr.compensation_manage', 'hr.performance_read', 'hr.performance_update', 'hr.training_read', 'hr.training_create', 'hr.training_assign', 'hr.analytics'] as const,
  MARKETING_MANAGEMENT: ['campaigns.create', 'campaigns.read', 'campaigns.update', 'campaigns.delete', 'campaigns.launch', 'campaigns.pause', 'campaigns.analytics', 'templates.create', 'templates.read', 'templates.update', 'templates.delete', 'notifications.send', 'notifications.read', 'notifications.manage'] as const,
  REPORTS_MANAGEMENT: ['reports.read', 'reports.export', 'reports.hr', 'reports.marketing', 'reports.events', 'reports.analytics'] as const,
  CLAIMS_MANAGEMENT: ['claims.create', 'claims.read', 'claims.update', 'claims.delete', 'claims.approve', 'claims.reject'] as const,
  BRANCH_MANAGEMENT: ['branches.create', 'branches.read', 'branches.update', 'branches.delete', 'branches.manage'] as const,
  CLIENT_MANAGEMENT: ['client.profile', 'client.orders', 'client.notifications'] as const,
  ORDER_MANAGEMENT: ['orders.create', 'orders.read', 'orders.update', 'orders.cancel'] as const,
  PAYMENT_MANAGEMENT: ['payments.create', 'payments.read', 'payments.refund'] as const,
  CUSTOMER_MANAGEMENT: ['customers.create', 'customers.read', 'customers.update'] as const,
  SUPPLIER_MANAGEMENT: ['suppliers.create', 'suppliers.read', 'suppliers.update', 'suppliers.delete'] as const,
  SETTINGS_MANAGEMENT: ['settings.read', 'settings.update'] as const,
} as const;

// Role Groups for easier management
export const ROLE_GROUPS = {
  ADMIN_ROLES: ['super_admin', 'admin'] as const,
  HR_ROLES: ['hr_admin', 'hr'] as const,
  MARKETING_ROLES: ['marketing_admin', 'marketing'] as const,
  SALES_ROLES: ['sales_admin', 'sales_staff', 'pos_cashier'] as const,
  INVENTORY_ROLES: ['inventory_admin', 'inventory_clerk'] as const,
  ACCOUNTING_ROLES: ['accounting_admin', 'accounting_staff'] as const,
  USER_ROLES: ['user'] as const,
} as const;

// Utility functions for permission checking
export const PermissionUtils = {
  /**
   * Check if a permission belongs to a specific group
   */
  isInGroup: (permission: SystemPermission, group: keyof typeof PERMISSION_GROUPS): boolean => {
    return (PERMISSION_GROUPS[group] as readonly string[]).includes(permission);
  },

  /**
   * Get all permissions for a specific group
   */
  getGroupPermissions: (group: keyof typeof PERMISSION_GROUPS): readonly SystemPermission[] => {
    return PERMISSION_GROUPS[group];
  },

  /**
   * Check if a role belongs to a specific group
   */
  isRoleInGroup: (role: SystemRole, group: keyof typeof ROLE_GROUPS): boolean => {
    return (ROLE_GROUPS[group] as readonly string[]).includes(role);
  },

  /**
   * Get all roles for a specific group
   */
  getGroupRoles: (group: keyof typeof ROLE_GROUPS): readonly SystemRole[] => {
    return ROLE_GROUPS[group];
  },

  /**
   * Get permission display name
   */
  getPermissionDisplayName: (permission: SystemPermission): string => {
    const parts = permission.split('.');
    const module = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const action = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    return `${module} ${action}`;
  },

  /**
   * Get role display name
   */
  getRoleDisplayName: (role: SystemRole): string => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
};

export default Can;






