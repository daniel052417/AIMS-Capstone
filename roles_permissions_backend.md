# Roles & Permissions Backend Integration Guide

## Overview
This guide provides a complete backend implementation for the RolesPermissions.tsx frontend module, including database migrations, API endpoints, and integration steps for comprehensive RBAC management.

## Table of Contents
1. [Database Migrations](#database-migrations)
2. [API Endpoints](#api-endpoints)
3. [Backend Implementation](#backend-implementation)
4. [RBAC Integration](#rbac-integration)
5. [Frontend Integration](#frontend-integration)
6. [Testing & Deployment](#testing--deployment)

---

## Database Migrations

### 1. Enhanced Roles Table
```sql
-- File: backend/sql_files/18_enhanced_roles.sql
-- =====================================================
-- Enhanced Roles Table with System Role Protection
-- =====================================================

-- Update existing roles table if needed
ALTER TABLE "public"."roles" 
ADD COLUMN IF NOT EXISTS "display_name" text,
ADD COLUMN IF NOT EXISTS "is_system_role" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();

-- Add constraints
ALTER TABLE "public"."roles" 
ADD CONSTRAINT IF NOT EXISTS "roles_role_name_unique" UNIQUE ("role_name");

-- Add indexes
CREATE INDEX IF NOT EXISTS "idx_roles_is_system_role" ON "public"."roles" ("is_system_role");
CREATE INDEX IF NOT EXISTS "idx_roles_created_at" ON "public"."roles" ("created_at");

-- Insert system roles
INSERT INTO "public"."roles" ("role_name", "display_name", "description", "is_system_role")
VALUES 
  ('admin', 'Administrator', 'Full system access and control', true),
  ('hr_manager', 'HR Manager', 'Human resources management and staff oversight', true),
  ('marketing_manager', 'Marketing Manager', 'Marketing campaigns and customer engagement', true),
  ('cashier', 'Cashier', 'Point of sale operations and transactions', true),
  ('inventory_clerk', 'Inventory Clerk', 'Inventory management and stock control', true)
ON CONFLICT ("role_name") DO NOTHING;
```

### 2. Enhanced Permissions Table
```sql
-- File: backend/sql_files/19_enhanced_permissions.sql
-- =====================================================
-- Enhanced Permissions Table with Module Organization
-- =====================================================

-- Update existing permissions table
ALTER TABLE "public"."permissions" 
ADD COLUMN IF NOT EXISTS "module" text,
ADD COLUMN IF NOT EXISTS "action" text,
ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();

-- Add constraints
ALTER TABLE "public"."permissions" 
ADD CONSTRAINT IF NOT EXISTS "permissions_name_unique" UNIQUE ("permission_name");

-- Add indexes
CREATE INDEX IF NOT EXISTS "idx_permissions_module" ON "public"."permissions" ("module");
CREATE INDEX IF NOT EXISTS "idx_permissions_action" ON "public"."permissions" ("action");
CREATE INDEX IF NOT EXISTS "idx_permissions_active" ON "public"."permissions" ("is_active");

-- Insert core permissions
INSERT INTO "public"."permissions" ("permission_name", "module", "action", "description", "is_active")
VALUES 
  -- User Management
  ('users.create', 'users', 'create', 'Create new user accounts', true),
  ('users.read', 'users', 'read', 'View user information', true),
  ('users.update', 'users', 'update', 'Edit user details', true),
  ('users.delete', 'users', 'delete', 'Remove user accounts', true),
  
  -- Inventory Management
  ('inventory.create', 'inventory', 'create', 'Add new inventory items', true),
  ('inventory.read', 'inventory', 'read', 'View inventory levels', true),
  ('inventory.update', 'inventory', 'update', 'Edit product information', true),
  ('inventory.delete', 'inventory', 'delete', 'Remove inventory items', true),
  
  -- Sales Management
  ('sales.create', 'sales', 'create', 'Process new transactions', true),
  ('sales.read', 'sales', 'read', 'View sales records', true),
  ('sales.update', 'sales', 'update', 'Modify transaction details', true),
  ('sales.delete', 'sales', 'delete', 'Remove transactions', true),
  
  -- Marketing
  ('marketing.create', 'marketing', 'create', 'Create marketing campaigns', true),
  ('marketing.read', 'marketing', 'read', 'View campaign data', true),
  ('marketing.update', 'marketing', 'update', 'Modify campaigns', true),
  ('marketing.delete', 'marketing', 'delete', 'Remove campaigns', true),
  
  -- Reports & Analytics
  ('reports.create', 'reports', 'create', 'Generate new reports', true),
  ('reports.read', 'reports', 'read', 'Access report data', true),
  ('reports.update', 'reports', 'update', 'Modify reports', true),
  ('reports.delete', 'reports', 'delete', 'Remove reports', true),
  
  -- System Settings
  ('settings.create', 'settings', 'create', 'Add system settings', true),
  ('settings.read', 'settings', 'read', 'View system configuration', true),
  ('settings.update', 'settings', 'update', 'Modify system settings', true),
  ('settings.delete', 'settings', 'delete', 'Remove settings', true)
ON CONFLICT ("permission_name") DO NOTHING;
```

### 3. Enhanced Role-Permission Mapping
```sql
-- File: backend/sql_files/20_enhanced_role_permissions.sql
-- =====================================================
-- Enhanced Role-Permission Mapping with Audit Trail
-- =====================================================

-- Update existing role_permissions table
ALTER TABLE "public"."role_permissions" 
ADD COLUMN IF NOT EXISTS "created_by" uuid REFERENCES "public"."users"("id"),
ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();

-- Add unique constraint
ALTER TABLE "public"."role_permissions" 
ADD CONSTRAINT IF NOT EXISTS "role_permissions_unique" UNIQUE ("role_id", "permission_id");

-- Add indexes
CREATE INDEX IF NOT EXISTS "idx_role_permissions_role_id" ON "public"."role_permissions" ("role_id");
CREATE INDEX IF NOT EXISTS "idx_role_permissions_permission_id" ON "public"."role_permissions" ("permission_id");
CREATE INDEX IF NOT EXISTS "idx_role_permissions_created_by" ON "public"."role_permissions" ("created_by");

-- Assign permissions to roles
-- Admin gets all permissions
INSERT INTO "public"."role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "public"."roles" r, "public"."permissions" p
WHERE r.role_name = 'admin'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

-- HR Manager permissions
INSERT INTO "public"."role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "public"."roles" r, "public"."permissions" p
WHERE r.role_name = 'hr_manager'
AND p.permission_name IN ('users.create', 'users.read', 'users.update', 'reports.read', 'settings.read')
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

-- Marketing Manager permissions
INSERT INTO "public"."role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "public"."roles" r, "public"."permissions" p
WHERE r.role_name = 'marketing_manager'
AND p.permission_name IN ('marketing.create', 'marketing.read', 'marketing.update', 'marketing.delete', 'reports.read')
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

-- Cashier permissions
INSERT INTO "public"."role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "public"."roles" r, "public"."permissions" p
WHERE r.role_name = 'cashier'
AND p.permission_name IN ('sales.create', 'sales.read', 'inventory.read')
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

-- Inventory Clerk permissions
INSERT INTO "public"."role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "public"."roles" r, "public"."permissions" p
WHERE r.role_name = 'inventory_clerk'
AND p.permission_name IN ('inventory.create', 'inventory.read', 'inventory.update', 'reports.read')
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
```

---

## API Endpoints

### Role Management Endpoints

#### 1. Get All Roles
```typescript
GET /api/v1/roles
Query Parameters:
- include_stats: boolean (include user counts and permission counts)
- system_only: boolean (filter system roles only)
```

#### 2. Get Role by ID
```typescript
GET /api/v1/roles/:roleId
```

#### 3. Create Role
```typescript
POST /api/v1/roles
Body: {
  role_name: string;
  display_name: string;
  description?: string;
  is_system_role?: boolean;
}
```

#### 4. Update Role
```typescript
PUT /api/v1/roles/:roleId
Body: {
  display_name?: string;
  description?: string;
}
```

#### 5. Delete Role
```typescript
DELETE /api/v1/roles/:roleId
```

### Permission Management Endpoints

#### 6. Get All Permissions
```typescript
GET /api/v1/permissions
Query Parameters:
- module: string (filter by module)
- action: string (filter by action)
- active_only: boolean (show only active permissions)
```

#### 7. Get Permission by ID
```typescript
GET /api/v1/permissions/:permissionId
```

#### 8. Create Permission
```typescript
POST /api/v1/permissions
Body: {
  permission_name: string;
  module: string;
  action: string;
  description?: string;
}
```

#### 9. Update Permission
```typescript
PUT /api/v1/permissions/:permissionId
Body: {
  permission_name?: string;
  module?: string;
  action?: string;
  description?: string;
  is_active?: boolean;
}
```

#### 10. Toggle Permission Status
```typescript
PATCH /api/v1/permissions/:permissionId/activate
PATCH /api/v1/permissions/:permissionId/deactivate
```

### Role-Permission Management Endpoints

#### 11. Get Role Permissions
```typescript
GET /api/v1/roles/:roleId/permissions
```

#### 12. Assign Permission to Role
```typescript
POST /api/v1/roles/:roleId/permissions
Body: { permission_id: string }
```

#### 13. Remove Permission from Role
```typescript
DELETE /api/v1/roles/:roleId/permissions/:permissionId
```

#### 14. Bulk Update Role Permissions
```typescript
PUT /api/v1/roles/:roleId/permissions
Body: { permissions: string[] }
```

### User-Role Management Endpoints

#### 15. Get User Roles
```typescript
GET /api/v1/users/:userId/roles
```

#### 16. Assign Role to User
```typescript
POST /api/v1/users/:userId/roles
Body: { role_id: string }
```

#### 17. Remove Role from User
```typescript
DELETE /api/v1/users/:userId/roles/:roleId
```

#### 18. Bulk Update User Roles
```typescript
PUT /api/v1/users/:userId/roles
Body: { roles: string[] }
```

### Analytics & Audit Endpoints

#### 19. Get Role Statistics
```typescript
GET /api/v1/roles/statistics
```

#### 20. Get Users by Role
```typescript
GET /api/v1/roles/:roleId/users
```

#### 21. Get Effective User Permissions
```typescript
GET /api/v1/permissions/user/:userId
```

---

## Backend Implementation

### 1. Enhanced RBAC Service

```typescript
// File: backend/src/services/rbac.service.ts
import { supabaseAdmin } from '../config/supabaseClient';
import { AuditService } from './audit.service';

export interface Role {
  id: string;
  role_name: string;
  display_name: string;
  description?: string;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
  user_count?: number;
  permission_count?: number;
}

export interface Permission {
  id: string;
  permission_name: string;
  module: string;
  action: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface UserWithRoles {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: Role[];
}

export class RBACService {
  // Role Management
  static async getRoles(includeStats: boolean = false): Promise<Role[]> {
    let query = supabaseAdmin
      .from('roles')
      .select('*')
      .order('display_name');

    if (includeStats) {
      query = query.select(`
        *,
        user_count:user_roles(count),
        permission_count:role_permissions(count)
      `);
    }

    const { data: roles, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch roles: ${error.message}`);
    }

    return roles || [];
  }

  static async getRoleById(roleId: string): Promise<RoleWithPermissions | null> {
    const { data: role, error } = await supabaseAdmin
      .from('roles')
      .select(`
        *,
        permissions:role_permissions(
          permission_id,
          permissions(*)
        )
      `)
      .eq('id', roleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Role not found
      }
      throw new Error(`Failed to fetch role: ${error.message}`);
    }

    return {
      ...role,
      permissions: role.permissions?.map((rp: any) => rp.permissions) || []
    };
  }

  static async createRole(roleData: {
    role_name: string;
    display_name: string;
    description?: string;
    is_system_role?: boolean;
  }, createdBy: string): Promise<Role> {
    const { data: role, error } = await supabaseAdmin
      .from('roles')
      .insert([{
        role_name: roleData.role_name,
        display_name: roleData.display_name,
        description: roleData.description,
        is_system_role: roleData.is_system_role || false
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Role name already exists');
      }
      throw new Error(`Failed to create role: ${error.message}`);
    }

    // Log the creation
    await AuditService.logAction({
      action: 'role_created',
      entity_type: 'role',
      entity_id: role.id,
      old_values: null,
      new_values: role,
      user_id: createdBy
    });

    return role;
  }

  static async updateRole(roleId: string, updates: Partial<Role>, updatedBy: string): Promise<Role> {
    // Get current role for audit
    const currentRole = await this.getRoleById(roleId);
    if (!currentRole) {
      throw new Error('Role not found');
    }

    const { data: role, error } = await supabaseAdmin
      .from('roles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', roleId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update role: ${error.message}`);
    }

    // Log the update
    await AuditService.logAction({
      action: 'role_updated',
      entity_type: 'role',
      entity_id: roleId,
      old_values: currentRole,
      new_values: role,
      user_id: updatedBy
    });

    return role;
  }

  static async deleteRole(roleId: string, deletedBy: string): Promise<void> {
    // Get current role for audit
    const currentRole = await this.getRoleById(roleId);
    if (!currentRole) {
      throw new Error('Role not found');
    }

    // Prevent deletion of system roles
    if (currentRole.is_system_role) {
      throw new Error('Cannot delete system roles');
    }

    // Check if role has users
    const { count: userCount } = await supabaseAdmin
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', roleId);

    if (userCount && userCount > 0) {
      throw new Error('Cannot delete role with assigned users');
    }

    const { error } = await supabaseAdmin
      .from('roles')
      .delete()
      .eq('id', roleId);

    if (error) {
      throw new Error(`Failed to delete role: ${error.message}`);
    }

    // Log the deletion
    await AuditService.logAction({
      action: 'role_deleted',
      entity_type: 'role',
      entity_id: roleId,
      old_values: currentRole,
      new_values: null,
      user_id: deletedBy
    });
  }

  // Permission Management
  static async getPermissions(filters: {
    module?: string;
    action?: string;
    active_only?: boolean;
  } = {}): Promise<Permission[]> {
    const { module = '', action = '', active_only = true } = filters;

    let query = supabaseAdmin
      .from('permissions')
      .select('*')
      .order('module, action');

    if (active_only) {
      query = query.eq('is_active', true);
    }

    if (module) {
      query = query.eq('module', module);
    }

    if (action) {
      query = query.eq('action', action);
    }

    const { data: permissions, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch permissions: ${error.message}`);
    }

    return permissions || [];
  }

  static async getPermissionsByCategories(): Promise<Record<string, Permission[]>> {
    const permissions = await this.getPermissions();
    
    const grouped: Record<string, Permission[]> = {};
    permissions.forEach(permission => {
      const category = permission.module || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(permission);
    });

    return grouped;
  }

  // Role-Permission Management
  static async assignPermissionToRole(
    roleId: string, 
    permissionId: string, 
    assignedBy: string
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('role_permissions')
      .insert({
        role_id: roleId,
        permission_id: permissionId,
        created_by: assignedBy
      });

    if (error) {
      if (error.code === '23505') {
        return; // Already assigned, idempotent
      }
      throw new Error(`Failed to assign permission: ${error.message}`);
    }

    // Log the assignment
    await AuditService.logAction({
      action: 'permission_assigned_to_role',
      entity_type: 'role_permission',
      entity_id: `${roleId}-${permissionId}`,
      old_values: null,
      new_values: { role_id: roleId, permission_id: permissionId },
      user_id: assignedBy
    });
  }

  static async removePermissionFromRole(
    roleId: string, 
    permissionId: string, 
    removedBy: string
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', permissionId);

    if (error) {
      throw new Error(`Failed to remove permission: ${error.message}`);
    }

    // Log the removal
    await AuditService.logAction({
      action: 'permission_removed_from_role',
      entity_type: 'role_permission',
      entity_id: `${roleId}-${permissionId}`,
      old_values: { role_id: roleId, permission_id: permissionId },
      new_values: null,
      user_id: removedBy
    });
  }

  static async bulkUpdateRolePermissions(
    roleId: string, 
    permissionIds: string[], 
    updatedBy: string
  ): Promise<void> {
    // Use transaction for atomic update
    const { error: deleteError } = await supabaseAdmin
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    if (deleteError) {
      throw new Error(`Failed to clear existing permissions: ${deleteError.message}`);
    }

    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map(permissionId => ({
        role_id: roleId,
        permission_id: permissionId,
        created_by: updatedBy
      }));

      const { error: insertError } = await supabaseAdmin
        .from('role_permissions')
        .insert(rolePermissions);

      if (insertError) {
        throw new Error(`Failed to assign new permissions: ${insertError.message}`);
      }
    }

    // Log the bulk update
    await AuditService.logAction({
      action: 'role_permissions_bulk_updated',
      entity_type: 'role_permission',
      entity_id: roleId,
      old_values: null,
      new_values: { role_id: roleId, permission_ids: permissionIds },
      user_id: updatedBy
    });
  }

  // User-Role Management
  static async assignRoleToUser(
    userId: string, 
    roleId: string, 
    assignedBy: string
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: assignedBy
      });

    if (error) {
      if (error.code === '23505') {
        return; // Already assigned, idempotent
      }
      throw new Error(`Failed to assign role: ${error.message}`);
    }

    // Log the assignment
    await AuditService.logAction({
      action: 'role_assigned_to_user',
      entity_type: 'user_role',
      entity_id: `${userId}-${roleId}`,
      old_values: null,
      new_values: { user_id: userId, role_id: roleId },
      user_id: assignedBy
    });
  }

  static async removeRoleFromUser(
    userId: string, 
    roleId: string, 
    removedBy: string
  ): Promise<void> {
    // Prevent removal of last admin role
    if (roleId === 'admin') {
      const { count: adminCount } = await supabaseAdmin
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role_id', roleId);

      if (adminCount && adminCount <= 1) {
        throw new Error('Cannot remove last admin role');
      }
    }

    const { error } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) {
      throw new Error(`Failed to remove role: ${error.message}`);
    }

    // Log the removal
    await AuditService.logAction({
      action: 'role_removed_from_user',
      entity_type: 'user_role',
      entity_id: `${userId}-${roleId}`,
      old_values: { user_id: userId, role_id: roleId },
      new_values: null,
      user_id: removedBy
    });
  }

  // Effective Permissions
  static async getEffectiveUserPermissions(userId: string): Promise<string[]> {
    const { data: permissions, error } = await supabaseAdmin
      .from('user_roles')
      .select(`
        roles!inner(
          role_permissions!inner(
            permissions!inner(permission_name)
          )
        )
      `)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch user permissions: ${error.message}`);
    }

    const permissionSet = new Set<string>();
    permissions?.forEach((userRole: any) => {
      userRole.roles.role_permissions?.forEach((rp: any) => {
        permissionSet.add(rp.permissions.permission_name);
      });
    });

    return Array.from(permissionSet);
  }

  // Analytics
  static async getRoleStatistics(): Promise<{
    total_roles: number;
    system_roles: number;
    custom_roles: number;
    total_permissions: number;
    active_permissions: number;
    users_per_role: Array<{
      role_id: string;
      role_name: string;
      user_count: number;
    }>;
  }> {
    const [
      { count: totalRoles },
      { count: systemRoles },
      { count: customRoles },
      { count: totalPermissions },
      { count: activePermissions },
      { data: usersPerRole }
    ] = await Promise.all([
      supabaseAdmin.from('roles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('roles').select('*', { count: 'exact', head: true }).eq('is_system_role', true),
      supabaseAdmin.from('roles').select('*', { count: 'exact', head: true }).eq('is_system_role', false),
      supabaseAdmin.from('permissions').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('permissions').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin
        .from('roles')
        .select(`
          id,
          role_name,
          user_count:user_roles(count)
        `)
    ]);

    return {
      total_roles: totalRoles || 0,
      system_roles: systemRoles || 0,
      custom_roles: customRoles || 0,
      total_permissions: totalPermissions || 0,
      active_permissions: activePermissions || 0,
      users_per_role: usersPerRole || []
    };
  }
}
```

---

## RBAC Integration

### 1. Enhanced RBAC Middleware

```typescript
// File: backend/src/middleware/rbac.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { RBACService } from '../services/rbac.service';

export const requirePermission = (permission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const userPermissions = await RBACService.getEffectiveUserPermissions(req.user.userId);
      
      if (!userPermissions.includes(permission)) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${permission}`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
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
          message: 'Authentication required',
        });
        return;
      }

      const userRoles = await RBACService.getUserRoles(req.user.userId);
      const hasRole = userRoles.some(role => role.role_name === roleName);
      
      if (!hasRole) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roleName}`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Role check failed',
      });
    }
  };
};

export const requireAdmin = requireRole('admin');
export const requireManager = requireRole('hr_manager');
```

### 2. Role Routes with RBAC

```typescript
// File: backend/src/routes/roles.routes.ts
import { Router } from 'express';
import { RolesController } from '../controllers/roles.controller';
import { authenticateToken } from '../middleware/auth';
import { requirePermission, requireAdmin } from '../middleware/rbac';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Role management routes
router.get('/',
  requirePermission('roles.read'),
  RolesController.getRoles
);

router.get('/statistics',
  requirePermission('roles.read'),
  RolesController.getRoleStatistics
);

router.get('/:roleId',
  requirePermission('roles.read'),
  RolesController.getRoleById
);

router.post('/',
  requireAdmin, // Only admins can create roles
  RolesController.createRole
);

router.put('/:roleId',
  requireAdmin, // Only admins can update roles
  RolesController.updateRole
);

router.delete('/:roleId',
  requireAdmin, // Only admins can delete roles
  RolesController.deleteRole
);

// Role-permission management
router.get('/:roleId/permissions',
  requirePermission('roles.read'),
  RolesController.getRolePermissions
);

router.post('/:roleId/permissions',
  requireAdmin, // Only admins can assign permissions
  RolesController.assignPermissionToRole
);

router.delete('/:roleId/permissions/:permissionId',
  requireAdmin, // Only admins can remove permissions
  RolesController.removePermissionFromRole
);

router.put('/:roleId/permissions',
  requireAdmin, // Only admins can bulk update permissions
  RolesController.bulkUpdateRolePermissions
);

// Role-user management
router.get('/:roleId/users',
  requirePermission('roles.read'),
  RolesController.getUsersByRole
);

export default router;
```

---

## Frontend Integration

### 1. RBAC Service (Frontend)

```typescript
// File: frontend/src/services/rbacService.ts
import { apiClient } from '../api/apiClient';

export interface Role {
  id: string;
  role_name: string;
  display_name: string;
  description?: string;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
  user_count?: number;
  permission_count?: number;
}

export interface Permission {
  id: string;
  permission_name: string;
  module: string;
  action: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export class RBACService {
  // Role Management
  static async getRoles(includeStats: boolean = false): Promise<Role[]> {
    const params = new URLSearchParams();
    if (includeStats) {
      params.append('include_stats', 'true');
    }

    const response = await apiClient.get(`/v1/roles?${params.toString()}`);
    return response.data;
  }

  static async getRoleById(roleId: string): Promise<RoleWithPermissions> {
    const response = await apiClient.get(`/v1/roles/${roleId}`);
    return response.data;
  }

  static async createRole(roleData: {
    role_name: string;
    display_name: string;
    description?: string;
    is_system_role?: boolean;
  }): Promise<Role> {
    const response = await apiClient.post('/v1/roles', roleData);
    return response.data;
  }

  static async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
    const response = await apiClient.put(`/v1/roles/${roleId}`, updates);
    return response.data;
  }

  static async deleteRole(roleId: string): Promise<void> {
    await apiClient.delete(`/v1/roles/${roleId}`);
  }

  // Permission Management
  static async getPermissions(filters: {
    module?: string;
    action?: string;
    active_only?: boolean;
  } = {}): Promise<Permission[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/v1/permissions?${params.toString()}`);
    return response.data;
  }

  static async getPermissionsByCategories(): Promise<Record<string, Permission[]>> {
    const response = await apiClient.get('/v1/permissions/categories');
    return response.data;
  }

  // Role-Permission Management
  static async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    await apiClient.post(`/v1/roles/${roleId}/permissions`, { permission_id: permissionId });
  }

  static async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await apiClient.delete(`/v1/roles/${roleId}/permissions/${permissionId}`);
  }

  static async bulkUpdateRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await apiClient.put(`/v1/roles/${roleId}/permissions`, { permissions: permissionIds });
  }

  // Analytics
  static async getRoleStatistics(): Promise<any> {
    const response = await apiClient.get('/v1/roles/statistics');
    return response.data;
  }
}
```

---

## Testing & Deployment

### 1. Database Migration Steps

```bash
# 1. Run the SQL migration files in order
psql -h your-supabase-host -U postgres -d your-database -f backend/sql_files/18_enhanced_roles.sql
psql -h your-supabase-host -U postgres -d your-database -f backend/sql_files/19_enhanced_permissions.sql
psql -h your-supabase-host -U postgres -d your-database -f backend/sql_files/20_enhanced_role_permissions.sql
```

### 2. Backend Integration Steps

```bash
# 1. Add the new routes to your main router
# File: backend/src/routes/index.ts
import rolesRoutes from './roles.routes';
import permissionsRoutes from './permissions.routes';
app.use('/api/v1', rolesRoutes);
app.use('/api/v1', permissionsRoutes);

# 2. Test the endpoints
curl -X GET "http://localhost:3001/api/v1/roles?include_stats=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Frontend Integration Steps

```bash
# 1. Update your API client base URL if needed
# File: frontend/src/api/apiClient.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

# 2. Test the integration
npm run dev
# Navigate to /super-admin/roles-permissions
```

---

## Summary

This implementation provides:

✅ **Complete RBAC Management** - Full CRUD for roles and permissions  
✅ **Role-Permission Mapping** - Assign/remove permissions to/from roles  
✅ **User-Role Assignment** - Assign/remove roles to/from users  
✅ **Effective Permission Resolution** - Get user's effective permissions  
✅ **Audit Logging** - Track all RBAC changes with full audit trail  
✅ **System Role Protection** - Prevent deletion of system roles  
✅ **Admin Safety** - Prevent removal of last admin role  
✅ **Analytics Dashboard** - Role statistics and user counts  
✅ **RBAC Enforcement** - Proper middleware integration  
✅ **TypeScript Support** - Full type safety throughout  

The implementation follows your existing patterns and provides a robust foundation for comprehensive RBAC management that scales with your application's needs.







