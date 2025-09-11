import { ROLES, ROLE_HIERARCHY } from '../constants/roles';
import { PERMISSIONS } from '../constants/permissions';

export interface UserContext {
  id: string;
  role: string;
  department?: string;
  permissions: string[];
}

export const hasPermission = (user: UserContext, permission: string): boolean => {
  return user.permissions.includes(permission);
};

export const hasAnyPermission = (user: UserContext, permissions: string[]): boolean => {
  return permissions.some(permission => user.permissions.includes(permission));
};

export const hasAllPermissions = (user: UserContext, permissions: string[]): boolean => {
  return permissions.every(permission => user.permissions.includes(permission));
};

export const hasRole = (user: UserContext, role: string): boolean => {
  return user.role === role;
};

export const hasAnyRole = (user: UserContext, roles: string[]): boolean => {
  return roles.includes(user.role);
};

export const hasHigherRole = (user: UserContext, targetRole: string): boolean => {
  const userLevel = ROLE_HIERARCHY[user.role as keyof typeof ROLE_HIERARCHY] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole as keyof typeof ROLE_HIERARCHY] || 0;
  return userLevel > targetLevel;
};

export const canAccessResource = (user: UserContext, resource: string, action: string): boolean => {
  const permission = `${resource}:${action}`;
  return hasPermission(user, permission);
};

export const canManageUser = (user: UserContext, targetUser: UserContext): boolean => {
  // Super admin can manage anyone
  if (user.role === ROLES.SUPER_ADMIN) {
    return true;
  }
  
  // Users can't manage themselves
  if (user.id === targetUser.id) {
    return false;
  }
  
  // Check if user has higher role than target
  return hasHigherRole(user, targetUser.role);
};

export const canAccessDepartment = (user: UserContext, department: string): boolean => {
  // Super admin can access all departments
  if (user.role === ROLES.SUPER_ADMIN) {
    return true;
  }
  
  // Check if user belongs to the department
  return user.department === department;
};

export const getAccessibleDepartments = (user: UserContext): string[] => {
  if (user.role === ROLES.SUPER_ADMIN) {
    return Object.values(ROLES);
  }
  
  return user.department ? [user.department] : [];
};

export const validatePermission = (user: UserContext, requiredPermission: string): boolean => {
  if (!hasPermission(user, requiredPermission)) {
    throw new Error(`Insufficient permissions. Required: ${requiredPermission}`);
  }
  return true;
};

export const validateRole = (user: UserContext, requiredRole: string): boolean => {
  if (!hasRole(user, requiredRole)) {
    throw new Error(`Insufficient role. Required: ${requiredRole}`);
  }
  return true;
};

export const validateAnyRole = (user: UserContext, requiredRoles: string[]): boolean => {
  if (!hasAnyRole(user, requiredRoles)) {
    throw new Error(`Insufficient role. Required one of: ${requiredRoles.join(', ')}`);
  }
  return true;
};

