import React from 'react';
import { useAccess } from '../hooks/usePermission';

interface PermissionWrapperProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallback?: React.ReactNode;
  showLoading?: boolean;
  loadingComponent?: React.ReactNode;
}

export const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallback = null,
  showLoading = true,
  loadingComponent = <div>Loading...</div>
}) => {
  const { canAccess, isLoading } = useAccess(requiredPermissions, requiredRoles);

  if (isLoading && showLoading) {
    return <>{loadingComponent}</>;
  }

  if (!canAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Higher-order component for easier usage
export const withPermission = (
  WrappedComponent: React.ComponentType<any>,
  requiredPermissions: string[] = [],
  requiredRoles: string[] = []
) => {
  return (props: any) => (
    <PermissionWrapper
      requiredPermissions={requiredPermissions}
      requiredRoles={requiredRoles}
    >
      <WrappedComponent {...props} />
    </PermissionWrapper>
  );
};