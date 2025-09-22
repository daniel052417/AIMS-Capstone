import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../context/PermissionContext';

interface RequirePermissionProps {
  children: React.ReactNode;
  permissions?: string[];
  roles?: string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * HOC that conditionally renders children based on user permissions/roles
 * If user doesn't have required permissions, shows fallback or redirects
 */
export const RequirePermission: React.FC<RequirePermissionProps> = ({
  children,
  permissions = [],
  roles = [],
  fallback = null,
  redirectTo = '/unauthorized'
}) => {
  const { canAccess, isLoading } = usePermissions();

  if (isLoading) {
    return <div className="flex items-center justify-center p-4">Loading...</div>;
  }

  const hasAccess = canAccess(permissions, roles);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

/**
 * HOC that wraps a component with permission requirements
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: string[] = [],
  requiredRoles: string[] = []
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <RequirePermission permissions={requiredPermissions} roles={requiredRoles}>
        <Component {...props} />
      </RequirePermission>
    );
  };
}

/**
 * Hook for conditional rendering based on permissions
 */
export const useRequirePermission = (permissions: string[] = [], roles: string[] = []) => {
  const { canAccess, isLoading } = usePermissions();
  
  return {
    canAccess: canAccess(permissions, roles),
    isLoading
  };
};




