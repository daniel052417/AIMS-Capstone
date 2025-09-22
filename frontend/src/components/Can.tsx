import React from 'react';
import { usePermissions } from '../context/PermissionContext';

interface CanProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean; // If true, user must have ALL permissions/roles
  fallback?: React.ReactNode;
  showLoading?: boolean;
  loadingComponent?: React.ReactNode;
  // For button-specific props when used as a button wrapper
  as?: 'button' | 'div' | 'span';
  buttonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

/**
 * Unified component for conditional rendering based on permissions and roles
 * Replaces DynamicButton, PermissionWrapper, and ConditionalRender
 * 
 * @example
 * // Simple permission check
 * <Can permission="users.create">
 *   <button>Add User</button>
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
 * // As a button with props
 * <Can 
 *   permission="users.create" 
 *   as="button"
 *   buttonProps={{ className: "btn-primary", onClick: handleClick }}
 * >
 *   Add User
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
  buttonProps = {}
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
    return <span {...buttonProps}>{children}</span>;
  } else {
    return <div {...buttonProps}>{children}</div>;
  }
};

/**
 * Hook for conditional rendering logic
 * Useful when you need to check permissions in component logic
 */
export const useCan = (
  permission?: string,
  permissions: string[] = [],
  roles: string[] = [],
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
    permission?: string;
    permissions?: string[];
    roles?: string[];
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

export default Can;




