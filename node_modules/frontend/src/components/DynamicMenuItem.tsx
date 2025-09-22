import React from 'react';
import { Link } from 'react-router-dom';
import { useAccess } from '../hooks/usePermission';

interface DynamicMenuItemProps {
  to: string;
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  icon?: React.ReactNode;
  className?: string;
}

export const DynamicMenuItem: React.FC<DynamicMenuItemProps> = ({
  to,
  children,
  requiredPermissions = [],
  requiredRoles = [],
  icon,
  className = ''
}) => {
  const { canAccess } = useAccess(requiredPermissions, requiredRoles);

  if (!canAccess) {
    return null;
  }

  return (
    <Link to={to} className={className}>
      {icon}
      {children}
    </Link>
  );
};