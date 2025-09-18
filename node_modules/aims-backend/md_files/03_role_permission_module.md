# 03 - Role-Based Access Control (RBAC) Module Guide

## Overview
This guide will implement a comprehensive RBAC system with roles, permissions, and middleware for your AIMS backend.

## Prerequisites
- ✅ Backend setup completed (01_backend_setup.md)
- ✅ Authentication module completed (02_auth_module.md)
- ✅ Database schema modules executed (especially 02_auth_users.sql)

## Step 1: RBAC Types

### 1.1 Create RBAC Types
**File: `src/types/rbac.ts`**
```typescript
export interface Role {
  id: string;
  name: string;
  description?: string;
  is_system_role: boolean;
  created_at: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  assigned_at: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
  granted_at: string;
}

export interface RolePermissionAudit {
  id: string;
  user_id?: string;
  target_user_id: string;
  role_id?: string;
  permission_id?: string;
  action: 'role_granted' | 'role_revoked' | 'permission_granted' | 'permission_revoked';
  granted_by: string;
  granted_at: string;
  revoked_by?: string;
  revoked_at?: string;
  notes?: string;
}

export interface UserWithRoles {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  branch_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  roles: Role[];
}

export interface PermissionCheck {
  resource: string;
  action: string;
}

export interface RBACResponse {
  success: boolean;
  message: string;
  data?: any;
}
```

## Step 2: RBAC Service

### 2.1 Create RBAC Service
**File: `src/services/rbac.service.ts`**
```typescript
import { supabaseAdmin } from '../config/supabaseClient';
import { 
  Role, 
  Permission, 
  UserRole, 
  RolePermission, 
  UserWithRoles, 
  RBACResponse,
  RolePermissionAudit
} from '../types/rbac';

export class RBACService {
  // Role Management
  static async createRole(name: string, description?: string, isSystemRole = false): Promise<RBACResponse> {
    try {
      const { data: role, error } = await supabaseAdmin
        .from('roles')
        .insert({
          name,
          description,
          is_system_role: isSystemRole
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Role created successfully',
        data: role
      };
    } catch (error: any) {
      console.error('Create role error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create role'
      };
    }
  }

  static async getRoles(): Promise<RBACResponse> {
    try {
      const { data: roles, error } = await supabaseAdmin
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;

      return {
        success: true,
        message: 'Roles retrieved successfully',
        data: roles
      };
    } catch (error: any) {
      console.error('Get roles error:', error);
      return {
        success: false,
        message: error.message || 'Failed to retrieve roles'
      };
    }
  }

  static async updateRole(roleId: string, updates: Partial<Role>): Promise<RBACResponse> {
    try {
      const { data: role, error } = await supabaseAdmin
        .from('roles')
        .update(updates)
        .eq('id', roleId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Role updated successfully',
        data: role
      };
    } catch (error: any) {
      console.error('Update role error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update role'
      };
    }
  }

  static async deleteRole(roleId: string): Promise<RBACResponse> {
    try {
      const { error } = await supabaseAdmin
        .from('roles')
        .delete()
        .eq('id', roleId)
        .eq('is_system_role', false); // Prevent deletion of system roles

      if (error) throw error;

      return {
        success: true,
        message: 'Role deleted successfully'
      };
    } catch (error: any) {
      console.error('Delete role error:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete role'
      };
    }
  }

  // Permission Management
  static async createPermission(name: string, resource: string, action: string, description?: string): Promise<RBACResponse> {
    try {
      const { data: permission, error } = await supabaseAdmin
        .from('permissions')
        .insert({
          name,
          resource,
          action,
          description
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Permission created successfully',
        data: permission
      };
    } catch (error: any) {
      console.error('Create permission error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create permission'
      };
    }
  }

  static async getPermissions(): Promise<RBACResponse> {
    try {
      const { data: permissions, error } = await supabaseAdmin
        .from('permissions')
        .select('*')
        .order('resource', { ascending: true })
        .order('action', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        message: 'Permissions retrieved successfully',
        data: permissions
      };
    } catch (error: any) {
      console.error('Get permissions error:', error);
      return {
        success: false,
        message: error.message || 'Failed to retrieve permissions'
      };
    }
  }

  // User Role Management
  static async assignRoleToUser(userId: string, roleId: string, grantedBy: string): Promise<RBACResponse> {
    try {
      // Check if user exists and is active
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, is_active')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (userError || !user) {
        return {
          success: false,
          message: 'User not found or inactive'
        };
      }

      // Check if role exists
      const { data: role, error: roleError } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('id', roleId)
        .single();

      if (roleError || !role) {
        return {
          success: false,
          message: 'Role not found'
        };
      }

      // Assign role to user
      const { error: assignError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId
        });

      if (assignError) {
        if (assignError.code === '23505') { // Unique constraint violation
          return {
            success: false,
            message: 'User already has this role'
          };
        }
        throw assignError;
      }

      // Log the assignment
      await supabaseAdmin
        .from('role_permission_audit')
        .insert({
          target_user_id: userId,
          role_id: roleId,
          action: 'role_granted',
          granted_by: grantedBy
        });

      return {
        success: true,
        message: 'Role assigned successfully'
      };
    } catch (error: any) {
      console.error('Assign role error:', error);
      return {
        success: false,
        message: error.message || 'Failed to assign role'
      };
    }
  }

  static async removeRoleFromUser(userId: string, roleId: string, revokedBy: string): Promise<RBACResponse> {
    try {
      const { error } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId);

      if (error) throw error;

      // Log the removal
      await supabaseAdmin
        .from('role_permission_audit')
        .insert({
          target_user_id: userId,
          role_id: roleId,
          action: 'role_revoked',
          revoked_by: revokedBy
        });

      return {
        success: true,
        message: 'Role removed successfully'
      };
    } catch (error: any) {
      console.error('Remove role error:', error);
      return {
        success: false,
        message: error.message || 'Failed to remove role'
      };
    }
  }

  static async getUserRoles(userId: string): Promise<RBACResponse> {
    try {
      const { data: userRoles, error } = await supabaseAdmin
        .from('user_roles')
        .select(`
          role_id,
          assigned_at,
          roles (
            id,
            name,
            description,
            is_system_role,
            created_at
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      return {
        success: true,
        message: 'User roles retrieved successfully',
        data: userRoles
      };
    } catch (error: any) {
      console.error('Get user roles error:', error);
      return {
        success: false,
        message: error.message || 'Failed to retrieve user roles'
      };
    }
  }

  // Role Permission Management
  static async assignPermissionToRole(roleId: string, permissionId: string, grantedBy: string): Promise<RBACResponse> {
    try {
      const { error } = await supabaseAdmin
        .from('role_permissions')
        .insert({
          role_id: roleId,
          permission_id: permissionId
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return {
            success: false,
            message: 'Role already has this permission'
          };
        }
        throw error;
      }

      // Log the assignment
      await supabaseAdmin
        .from('role_permission_audit')
        .insert({
          role_id: roleId,
          permission_id: permissionId,
          action: 'permission_granted',
          granted_by: grantedBy
        });

      return {
        success: true,
        message: 'Permission assigned to role successfully'
      };
    } catch (error: any) {
      console.error('Assign permission error:', error);
      return {
        success: false,
        message: error.message || 'Failed to assign permission'
      };
    }
  }

  static async removePermissionFromRole(roleId: string, permissionId: string, revokedBy: string): Promise<RBACResponse> {
    try {
      const { error } = await supabaseAdmin
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)
        .eq('permission_id', permissionId);

      if (error) throw error;

      // Log the removal
      await supabaseAdmin
        .from('role_permission_audit')
        .insert({
          role_id: roleId,
          permission_id: permissionId,
          action: 'permission_revoked',
          revoked_by: revokedBy
        });

      return {
        success: true,
        message: 'Permission removed from role successfully'
      };
    } catch (error: any) {
      console.error('Remove permission error:', error);
      return {
        success: false,
        message: error.message || 'Failed to remove permission'
      };
    }
  }

  // Permission Checking
  static async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const { data: permissions, error } = await supabaseAdmin
        .from('user_roles')
        .select(`
          roles!inner (
            role_permissions (
              permissions (
                name
              )
            )
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const permissionNames: string[] = [];
      permissions?.forEach(userRole => {
        userRole.roles.role_permissions?.forEach(rolePermission => {
          if (rolePermission.permissions?.name) {
            permissionNames.push(rolePermission.permissions.name);
          }
        });
      });

      return [...new Set(permissionNames)]; // Remove duplicates
    } catch (error) {
      console.error('Get user permissions error:', error);
      return [];
    }
  }

  static async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_roles')
        .select(`
          roles!inner (
            role_permissions (
              permissions!inner (
                resource,
                action
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('roles.role_permissions.permissions.resource', resource)
        .eq('roles.role_permissions.permissions.action', action)
        .limit(1);

      if (error) throw error;

      return data && data.length > 0;
    } catch (error) {
      console.error('Check permission error:', error);
      return false;
    }
  }

  static async hasRole(userId: string, roleName: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_roles')
        .select(`
          roles!inner (
            name
          )
        `)
        .eq('user_id', userId)
        .eq('roles.name', roleName)
        .limit(1);

      if (error) throw error;

      return data && data.length > 0;
    } catch (error) {
      console.error('Check role error:', error);
      return false;
    }
  }
}
```

## Step 3: RBAC Middleware

### 3.1 Create RBAC Middleware
**File: `src/middleware/rbac.ts`**
```typescript
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { RBACService } from '../services/rbac.service';

export const requirePermission = (resource: string, action: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const hasPermission = await RBACService.hasPermission(req.user.userId, resource, action);
      
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${action} on ${resource}`
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

export const requireRole = (roleName: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const hasRole = await RBACService.hasRole(req.user.userId, roleName);
      
      if (!hasRole) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roleName}`
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Role check failed'
      });
    }
  };
};

export const requireAnyRole = (roleNames: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const hasAnyRole = await Promise.all(
        roleNames.map(roleName => RBACService.hasRole(req.user!.userId, roleName))
      );

      if (!hasAnyRole.some(hasRole => hasRole)) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required one of these roles: ${roleNames.join(', ')}`
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Role check failed'
      });
    }
  };
};

export const requireBranchAccess = (branchIdParam = 'branchId') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Super admins can access all branches
      const isSuperAdmin = await RBACService.hasRole(req.user.userId, 'super_admin');
      if (isSuperAdmin) {
        next();
        return;
      }

      const requestedBranchId = req.params[branchIdParam] || req.body.branch_id;
      const userBranchId = req.user.branchId;

      if (requestedBranchId && userBranchId && requestedBranchId !== userBranchId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your assigned branch'
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Branch access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Branch access check failed'
      });
    }
  };
};
```

## Step 4: RBAC Controller

### 4.1 Create RBAC Controller
**File: `src/controllers/rbac.controller.ts`**
```typescript
import { Request, Response } from 'express';
import { RBACService } from '../services/rbac.service';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class RBACController {
  // Role Management
  static createRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, description, is_system_role } = req.body;
    const result = await RBACService.createRole(name, description, is_system_role);
    
    res.status(result.success ? 201 : 400).json(result);
  });

  static getRoles = asyncHandler(async (req: Request, res: Response) => {
    const result = await RBACService.getRoles();
    res.status(result.success ? 200 : 400).json(result);
  });

  static updateRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { roleId } = req.params;
    const updates = req.body;
    const result = await RBACService.updateRole(roleId, updates);
    
    res.status(result.success ? 200 : 400).json(result);
  });

  static deleteRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { roleId } = req.params;
    const result = await RBACService.deleteRole(roleId);
    
    res.status(result.success ? 200 : 400).json(result);
  });

  // Permission Management
  static createPermission = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, resource, action, description } = req.body;
    const result = await RBACService.createPermission(name, resource, action, description);
    
    res.status(result.success ? 201 : 400).json(result);
  });

  static getPermissions = asyncHandler(async (req: Request, res: Response) => {
    const result = await RBACService.getPermissions();
    res.status(result.success ? 200 : 400).json(result);
  });

  // User Role Management
  static assignRoleToUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId, roleId } = req.body;
    const grantedBy = req.user!.userId;
    const result = await RBACService.assignRoleToUser(userId, roleId, grantedBy);
    
    res.status(result.success ? 200 : 400).json(result);
  });

  static removeRoleFromUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId, roleId } = req.body;
    const revokedBy = req.user!.userId;
    const result = await RBACService.removeRoleFromUser(userId, roleId, revokedBy);
    
    res.status(result.success ? 200 : 400).json(result);
  });

  static getUserRoles = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const result = await RBACService.getUserRoles(userId);
    
    res.status(result.success ? 200 : 400).json(result);
  });

  // Role Permission Management
  static assignPermissionToRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { roleId, permissionId } = req.body;
    const grantedBy = req.user!.userId;
    const result = await RBACService.assignPermissionToRole(roleId, permissionId, grantedBy);
    
    res.status(result.success ? 200 : 400).json(result);
  });

  static removePermissionFromRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { roleId, permissionId } = req.body;
    const revokedBy = req.user!.userId;
    const result = await RBACService.removePermissionFromRole(roleId, permissionId, revokedBy);
    
    res.status(result.success ? 200 : 400).json(result);
  });

  // User Info
  static getUserPermissions = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const permissions = await RBACService.getUserPermissions(userId);
    
    res.status(200).json({
      success: true,
      message: 'User permissions retrieved successfully',
      data: permissions
    });
  });

  static checkPermission = asyncHandler(async (req: Request, res: Response) => {
    const { userId, resource, action } = req.query;
    
    if (!userId || !resource || !action) {
      res.status(400).json({
        success: false,
        message: 'userId, resource, and action are required'
      });
      return;
    }

    const hasPermission = await RBACService.hasPermission(
      userId as string, 
      resource as string, 
      action as string
    );
    
    res.status(200).json({
      success: true,
      message: 'Permission check completed',
      data: { hasPermission }
    });
  });
}
```

## Step 5: RBAC Routes

### 5.1 Create RBAC Routes
**File: `src/routes/rbac.routes.ts`**
```typescript
import { Router } from 'express';
import { RBACController } from '../controllers/rbac.controller';
import { authenticateToken, requirePermission, requireRole } from '../middleware/auth';
import { requirePermission as requirePerm } from '../middleware/rbac';

const router = Router();

// All RBAC routes require authentication
router.use(authenticateToken);

// Role Management
router.post('/roles', 
  requireRole('super_admin'),
  RBACController.createRole
);

router.get('/roles', 
  requirePerm('roles', 'read'),
  RBACController.getRoles
);

router.put('/roles/:roleId', 
  requireRole('super_admin'),
  RBACController.updateRole
);

router.delete('/roles/:roleId', 
  requireRole('super_admin'),
  RBACController.deleteRole
);

// Permission Management
router.post('/permissions', 
  requireRole('super_admin'),
  RBACController.createPermission
);

router.get('/permissions', 
  requirePerm('permissions', 'read'),
  RBACController.getPermissions
);

// User Role Management
router.post('/users/assign-role', 
  requirePerm('users', 'update'),
  RBACController.assignRoleToUser
);

router.post('/users/remove-role', 
  requirePerm('users', 'update'),
  RBACController.removeRoleFromUser
);

router.get('/users/:userId/roles', 
  requirePerm('users', 'read'),
  RBACController.getUserRoles
);

// Role Permission Management
router.post('/roles/assign-permission', 
  requireRole('super_admin'),
  RBACController.assignPermissionToRole
);

router.post('/roles/remove-permission', 
  requireRole('super_admin'),
  RBACController.removePermissionFromRole
);

// Utility endpoints
router.get('/users/:userId/permissions', 
  requirePerm('users', 'read'),
  RBACController.getUserPermissions
);

router.get('/check-permission', 
  requirePerm('permissions', 'read'),
  RBACController.checkPermission
);

export default router;
```

## Step 6: Update Main Routes

### 6.1 Add RBAC Routes to Main Router
**File: `src/routes/index.ts`**
```typescript
import { Router } from 'express';
import authRoutes from './auth.routes';
import rbacRoutes from './rbac.routes';
// ... other imports

const router = Router();

// API version prefix
const API_VERSION = '/v1';

// Route definitions
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/rbac`, rbacRoutes);
// ... other routes

export default router;
```

## Step 7: Seed Initial Data

### 7.1 Create Seed Script
**File: `src/scripts/seed-rbac.ts`**
```typescript
import { RBACService } from '../services/rbac.service';

const seedRBAC = async () => {
  console.log('🌱 Seeding RBAC data...');

  // Create system roles
  const roles = [
    { name: 'super_admin', description: 'System administrator with full access', is_system_role: true },
    { name: 'hr_admin', description: 'Human resources administrator', is_system_role: false },
    { name: 'inventory_clerk', description: 'Inventory management clerk', is_system_role: false },
    { name: 'cashier', description: 'Point of sale cashier', is_system_role: false },
    { name: 'marketing_staff', description: 'Marketing team member', is_system_role: false },
    { name: 'staff', description: 'General staff member', is_system_role: false }
  ];

  for (const role of roles) {
    const result = await RBACService.createRole(role.name, role.description, role.is_system_role);
    console.log(`Role ${role.name}: ${result.success ? '✅' : '❌'}`);
  }

  // Create permissions
  const permissions = [
    // User management
    { name: 'users.create', resource: 'users', action: 'create', description: 'Create new users' },
    { name: 'users.read', resource: 'users', action: 'read', description: 'View users' },
    { name: 'users.update', resource: 'users', action: 'update', description: 'Update users' },
    { name: 'users.delete', resource: 'users', action: 'delete', description: 'Delete users' },
    
    // Product management
    { name: 'products.create', resource: 'products', action: 'create', description: 'Create products' },
    { name: 'products.read', resource: 'products', action: 'read', description: 'View products' },
    { name: 'products.update', resource: 'products', action: 'update', description: 'Update products' },
    { name: 'products.delete', resource: 'products', action: 'delete', description: 'Delete products' },
    
    // Inventory management
    { name: 'inventory.create', resource: 'inventory', action: 'create', description: 'Manage inventory' },
    { name: 'inventory.read', resource: 'inventory', action: 'read', description: 'View inventory' },
    { name: 'inventory.update', resource: 'inventory', action: 'update', description: 'Update inventory' },
    
    // Order management
    { name: 'orders.create', resource: 'orders', action: 'create', description: 'Create orders' },
    { name: 'orders.read', resource: 'orders', action: 'read', description: 'View orders' },
    { name: 'orders.update', resource: 'orders', action: 'update', description: 'Update orders' },
    
    // Payment processing
    { name: 'payments.create', resource: 'payments', action: 'create', description: 'Process payments' },
    { name: 'payments.read', resource: 'payments', action: 'read', description: 'View payments' },
    
    // Role and permission management
    { name: 'roles.create', resource: 'roles', action: 'create', description: 'Create roles' },
    { name: 'roles.read', resource: 'roles', action: 'read', description: 'View roles' },
    { name: 'roles.update', resource: 'roles', action: 'update', description: 'Update roles' },
    { name: 'roles.delete', resource: 'roles', action: 'delete', description: 'Delete roles' },
    
    { name: 'permissions.create', resource: 'permissions', action: 'create', description: 'Create permissions' },
    { name: 'permissions.read', resource: 'permissions', action: 'read', description: 'View permissions' },
    { name: 'permissions.update', resource: 'permissions', action: 'update', description: 'Update permissions' },
    { name: 'permissions.delete', resource: 'permissions', action: 'delete', description: 'Delete permissions' }
  ];

  for (const permission of permissions) {
    const result = await RBACService.createPermission(
      permission.name, 
      permission.resource, 
      permission.action, 
      permission.description
    );
    console.log(`Permission ${permission.name}: ${result.success ? '✅' : '❌'}`);
  }

  console.log('✅ RBAC seeding completed!');
};

// Run if called directly
if (require.main === module) {
  seedRBAC().catch(console.error);
}

export default seedRBAC;
```

## Step 8: Testing RBAC

### 8.1 Test Role Creation
```bash
curl -X POST http://localhost:3001/v1/rbac/roles \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test_role",
    "description": "Test role for testing",
    "is_system_role": false
  }'
```

### 8.2 Test Permission Assignment
```bash
curl -X POST http://localhost:3001/v1/rbac/users/assign-role \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "roleId": "role-uuid"
  }'
```

### 8.3 Test Permission Check
```bash
curl -X GET "http://localhost:3001/v1/rbac/check-permission?userId=user-uuid&resource=products&action=read" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Next Steps
✅ **You've completed the RBAC module!**

**What's next?**
- Move to `04_crud_modules.md` to implement example CRUD operations
- Or run the seed script to populate initial RBAC data

**Current Status:**
- ✅ Role and permission management
- ✅ User role assignment
- ✅ Permission checking middleware
- ✅ Branch access control
- ✅ Audit logging for RBAC changes
- ✅ Comprehensive RBAC API endpoints

**Testing Checklist:**
- [ ] Create roles and permissions
- [ ] Assign roles to users
- [ ] Test permission-based access control
- [ ] Test role-based access control
- [ ] Test branch access restrictions
- [ ] Verify audit logging works
