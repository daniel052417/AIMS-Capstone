import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../context/PermissionContext';

interface PagePermissionConfig {
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * HOC that wraps page components with permission checks
 * Automatically redirects to unauthorized page if user lacks required permissions
 */
export function withPagePermissions<P extends object>(
  Component: React.ComponentType<P>,
  config: PagePermissionConfig = {}
) {
  return function PageWithPermissions(props: P) {
    const {
      permissions = [],
      roles = [],
      requireAll = false,
      redirectTo = '/unauthorized',
      fallback = null
    } = config;

    const { hasPermission, hasRole, hasAnyPermission, hasAnyRole, isLoading } = usePermissions();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    // Check permissions
    let hasRequiredPermissions = true;
    if (permissions.length > 0) {
      if (requireAll) {
        hasRequiredPermissions = permissions.every(permission => hasPermission(permission));
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

    const hasAccess = hasRequiredPermissions && hasRequiredRoles;

    if (!hasAccess) {
      if (fallback) {
        return <>{fallback}</>;
      }
      return <Navigate to={redirectTo} replace />;
    }

    return <Component {...props} />;
  };
}

/**
 * Hook for page-level permission checks
 */
export const usePagePermissions = (
  permissions: string[] = [],
  roles: string[] = [],
  requireAll: boolean = false
) => {
  const { hasPermission, hasRole, hasAnyPermission, hasAnyRole, isLoading } = usePermissions();

  if (isLoading) {
    return { hasAccess: false, isLoading: true };
  }

  // Check permissions
  let hasRequiredPermissions = true;
  if (permissions.length > 0) {
    if (requireAll) {
      hasRequiredPermissions = permissions.every(permission => hasPermission(permission));
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
    hasAccess: hasRequiredPermissions && hasRequiredRoles,
    isLoading: false
  };
};






