import React from 'react';
import { usePermission, useAnyPermission, useAnyRole } from '../hooks/usePermission';

interface DynamicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission?: string;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const DynamicButton: React.FC<DynamicButtonProps> = ({
  permission,
  requiredPermissions = [],
  requiredRoles = [],
  fallback = null,
  children,
  ...props
}) => {
  const { hasPermission } = usePermission(permission || '');
  const { hasAnyPermission } = useAnyPermission(requiredPermissions);
  const { hasAnyRole } = useAnyRole(requiredRoles);

  const canShow = permission ? hasPermission : 
    (requiredPermissions.length > 0 ? hasAnyPermission : true) &&
    (requiredRoles.length > 0 ? hasAnyRole : true);

  if (!canShow) {
    return <>{fallback}</>;
  }

  return <button {...props}>{children}</button>;
};