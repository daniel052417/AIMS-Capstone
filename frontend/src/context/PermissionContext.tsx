import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export interface PermissionContextType {
  permissions: string[];
  roles: string[];
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  canAccess: (requiredPermissions: string[], requiredRoles?: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

interface PermissionProviderProps {
  children: React.ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Update permissions and roles when user data changes
  useEffect(() => {
    if (user && isAuthenticated) {
      setIsLoading(true);
      
      // Use permissions and roles directly from user data (from login response)
      setPermissions(user.permissions || []);
      setRoles(user.roles || []);
      
      setIsLoading(false);
    } else {
      // Clear permissions when user is not authenticated
      setPermissions([]);
      setRoles([]);
      setIsLoading(false);
    }
  }, [user, isAuthenticated]);

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    // Treat super_admin as equivalent to admin for backward compatibility
    if (role === 'admin') {
      return roles.includes('admin') || roles.includes('super_admin');
    }
    return roles.includes(role);
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => permissions.includes(permission));
  };

  const hasAnyRole = (roleList: string[]): boolean => {
    return roleList.some(role => roles.includes(role));
  };

  const canAccess = (requiredPermissions: string[], requiredRoles?: string[]): boolean => {
    const hasRequiredPermissions = requiredPermissions.length === 0 || 
      hasAnyPermission(requiredPermissions);
    
    const hasRequiredRoles = !requiredRoles || requiredRoles.length === 0 || 
      hasAnyRole(requiredRoles);
    
    return hasRequiredPermissions && hasRequiredRoles;
  };

  const refreshPermissions = async () => {
    // Since permissions are now loaded from user data, 
    // we just need to trigger a re-render by updating state
    if (user && isAuthenticated) {
      setPermissions(user.permissions || []);
      setRoles(user.roles || []);
    }
  };

  const value: PermissionContextType = {
    permissions,
    roles,
    isLoading,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAnyRole,
    canAccess,
    refreshPermissions
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};