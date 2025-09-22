import React from 'react';
import { usePermissions } from '../context/PermissionContext';

interface ConditionalRenderProps {
  children: React.ReactNode;
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean; // If true, user must have ALL permissions/roles
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions/roles
 * Perfect for showing/hiding UI elements like buttons, sections, etc.
 */
export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
  fallback = null
}) => {
  const { hasPermission, hasRole, hasAnyPermission, hasAnyRole, isLoading } = usePermissions();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>;
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

  const shouldRender = hasRequiredPermissions && hasRequiredRoles;

  if (!shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Hook for conditional rendering logic
 */
export const useConditionalRender = (
  permissions: string[] = [],
  roles: string[] = [],
  requireAll: boolean = false
) => {
  const { hasPermission, hasRole, hasAnyPermission, hasAnyRole, isLoading } = usePermissions();

  if (isLoading) {
    return { shouldRender: false, isLoading: true };
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
    shouldRender: hasRequiredPermissions && hasRequiredRoles,
    isLoading: false
  };
};