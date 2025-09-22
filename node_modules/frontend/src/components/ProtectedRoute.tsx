import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAccess } from '../hooks/usePermission';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  redirectTo = '/unauthorized',
  fallback = <div>Loading...</div>
}) => {
  const { canAccess, isLoading } = useAccess(requiredPermissions, requiredRoles);
  const location = useLocation();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!canAccess) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};