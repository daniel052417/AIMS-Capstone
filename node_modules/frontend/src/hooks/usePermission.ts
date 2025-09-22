import { usePermissions } from '../context/PermissionContext';

export const usePermission = (permission: string) => {
  const { hasPermission, isLoading } = usePermissions();
  
  return {
    hasPermission: hasPermission(permission),
    isLoading
  };
};

export const useRole = (role: string) => {
  const { hasRole, isLoading } = usePermissions();
  
  return {
    hasRole: hasRole(role),
    isLoading
  };
};

export const useAccess = (requiredPermissions: string[], requiredRoles?: string[]) => {
  const { canAccess, isLoading } = usePermissions();
  
  return {
    canAccess: canAccess(requiredPermissions, requiredRoles),
    isLoading
  };
};

export const useAnyPermission = (permissions: string[]) => {
  const { hasAnyPermission, isLoading } = usePermissions();
  
  return {
    hasAnyPermission: hasAnyPermission(permissions),
    isLoading
  };
};

export const useAnyRole = (roles: string[]) => {
  const { hasAnyRole, isLoading } = usePermissions();
  
  return {
    hasAnyRole: hasAnyRole(roles),
    isLoading
  };
};