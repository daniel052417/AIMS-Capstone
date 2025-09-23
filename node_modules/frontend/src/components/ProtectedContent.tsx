import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../context/PermissionContext';
import { FallbackUI } from './FallbackUI';

interface ProtectedContentProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export const ProtectedContent: React.FC<ProtectedContentProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  redirectTo = '/unauthorized',
  fallback = null
}) => {
  const { hasPermission, hasRole, hasAnyPermission, hasAnyRole, isLoading, permissions, roles } = usePermissions();
  const location = useLocation();

  // Add debug logging
  console.log('=== PROTECTED CONTENT DEBUG ===');
  console.log('Current path:', location.pathname);
  console.log('Required permissions:', requiredPermissions);
  console.log('Required roles:', requiredRoles);
  console.log('User permissions:', permissions);
  console.log('User roles:', roles);

  if (isLoading) {
    console.log('Permissions still loading...');
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Check permissions
  let hasRequiredPermissions = true;
  if (requiredPermissions.length > 0) {
    hasRequiredPermissions = hasAnyPermission(requiredPermissions);
    console.log('Permission check result:', hasRequiredPermissions);
  }

  // Check roles - treat super_admin as equivalent to admin
  let hasRequiredRoles = true;
  if (requiredRoles.length > 0) {
    hasRequiredRoles = requiredRoles.some(role => {
      if (role === 'admin') {
        return hasRole('admin') || hasRole('super_admin');
      }
      return hasRole(role);
    });
    console.log('Role check result:', hasRequiredRoles);
  }

  const hasAccess = hasRequiredPermissions && hasRequiredRoles;
  console.log('Final access result:', hasAccess);

  if (!hasAccess) {
    console.log('ACCESS DENIED - showing fallback or unauthorized');
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="p-6">
        <FallbackUI 
          type="permission" 
          message="You don't have permission to access this page" 
          size="lg"
        />
      </div>
    );
  }

  console.log('ACCESS GRANTED - rendering children');
  return <>{children}</>;
};

export default ProtectedContent;






