# User Permissions Backend Integration Guide

## Overview
This guide provides a complete backend implementation for the UserPermissions.tsx frontend module, including database migrations, API endpoints, and integration steps for granular permission management.

## Table of Contents
1. [Database Migrations](#database-migrations)
2. [API Endpoints](#api-endpoints)
3. [Backend Implementation](#backend-implementation)
4. [Permission Logic & Inheritance](#permission-logic--inheritance)
5. [Frontend Integration](#frontend-integration)
6. [Testing & Deployment](#testing--deployment)

---

## Database Migrations

### 1. User Permissions Table
```sql
-- File: backend/sql_files/15_user_permissions.sql
-- =====================================================
-- User Permissions Table (Direct Permission Overrides)
-- =====================================================

CREATE TABLE IF NOT EXISTS "public"."user_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "granted" boolean DEFAULT true,
    "granted_at" timestamp with time zone DEFAULT "now"(),
    "granted_by_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "notes" text
);

ALTER TABLE "public"."user_permissions" OWNER TO "postgres";

-- Primary key
ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id");

-- Foreign keys
ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_permission_id_fkey" 
    FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_granted_by_fkey" 
    FOREIGN KEY ("granted_by_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- Unique constraint (one permission per user)
ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_user_permission_unique" 
    UNIQUE ("user_id", "permission_id");

-- Indexes
CREATE INDEX "idx_user_permissions_user_id" ON "public"."user_permissions" ("user_id");
CREATE INDEX "idx_user_permissions_permission_id" ON "public"."user_permissions" ("permission_id");
CREATE INDEX "idx_user_permissions_granted" ON "public"."user_permissions" ("granted");
CREATE INDEX "idx_user_permissions_granted_at" ON "public"."user_permissions" ("granted_at");
```

### 2. Enhanced Permissions Table
```sql
-- File: backend/sql_files/16_enhanced_permissions.sql
-- =====================================================
-- Enhanced Permissions Table with Categories
-- =====================================================

-- Update existing permissions table to include categories
ALTER TABLE "public"."permissions" 
ADD COLUMN IF NOT EXISTS "module" character varying(50),
ADD COLUMN IF NOT EXISTS "category" character varying(50),
ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;

-- Create index for module and category filtering
CREATE INDEX IF NOT EXISTS "idx_permissions_module" ON "public"."permissions" ("module");
CREATE INDEX IF NOT EXISTS "idx_permissions_category" ON "public"."permissions" ("category");
CREATE INDEX IF NOT EXISTS "idx_permissions_active" ON "public"."permissions" ("is_active");

-- Insert default permissions if they don't exist
INSERT INTO "public"."permissions" ("permission_name", "module", "category", "description", "is_active")
VALUES 
  -- User Management
  ('users.create', 'users', 'User Management', 'Create new user accounts', true),
  ('users.read', 'users', 'User Management', 'View user information', true),
  ('users.update', 'users', 'User Management', 'Edit user details', true),
  ('users.delete', 'users', 'User Management', 'Delete user accounts', true),
  
  -- Inventory Management
  ('inventory.create', 'inventory', 'Inventory Management', 'Add new inventory items', true),
  ('inventory.read', 'inventory', 'Inventory Management', 'View inventory levels', true),
  ('inventory.update', 'inventory', 'Inventory Management', 'Edit product information', true),
  ('inventory.delete', 'inventory', 'Inventory Management', 'Remove inventory items', true),
  
  -- Sales Management
  ('sales.create', 'sales', 'Sales Management', 'Process new transactions', true),
  ('sales.read', 'sales', 'Sales Management', 'View sales records', true),
  ('sales.update', 'sales', 'Sales Management', 'Modify transaction details', true),
  ('sales.delete', 'sales', 'Sales Management', 'Remove transactions', true),
  
  -- Marketing
  ('marketing.create', 'marketing', 'Marketing', 'Create marketing campaigns', true),
  ('marketing.read', 'marketing', 'Marketing', 'View campaign data', true),
  ('marketing.update', 'marketing', 'Marketing', 'Modify campaigns', true),
  ('marketing.delete', 'marketing', 'Marketing', 'Remove campaigns', true),
  
  -- Reports & Analytics
  ('reports.create', 'reports', 'Reports & Analytics', 'Generate new reports', true),
  ('reports.read', 'reports', 'Reports & Analytics', 'Access report data', true),
  ('reports.update', 'reports', 'Reports & Analytics', 'Modify reports', true),
  ('reports.delete', 'reports', 'Reports & Analytics', 'Remove reports', true),
  
  -- System Settings
  ('settings.create', 'settings', 'System Settings', 'Add system settings', true),
  ('settings.read', 'settings', 'System Settings', 'View system configuration', true),
  ('settings.update', 'settings', 'System Settings', 'Modify system settings', true),
  ('settings.delete', 'settings', 'System Settings', 'Remove settings', true)
ON CONFLICT ("permission_name") DO NOTHING;
```

### 3. Permission Audit Table
```sql
-- File: backend/sql_files/17_permission_audit.sql
-- =====================================================
-- Permission Audit Table
-- =====================================================

CREATE TABLE IF NOT EXISTS "public"."permission_audit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "action" character varying(20) NOT NULL,
    "old_value" boolean,
    "new_value" boolean,
    "changed_by" "uuid" NOT NULL,
    "ip_address" inet,
    "user_agent" text,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "notes" text,
    CONSTRAINT "chk_pa_action" CHECK (("action"::text = ANY (ARRAY[
        'granted'::character varying,
        'revoked'::character varying,
        'updated'::character varying
    ]::text[])))
);

ALTER TABLE "public"."permission_audit" OWNER TO "postgres";

-- Primary key
ALTER TABLE ONLY "public"."permission_audit"
    ADD CONSTRAINT "permission_audit_pkey" PRIMARY KEY ("id");

-- Foreign keys
ALTER TABLE ONLY "public"."permission_audit"
    ADD CONSTRAINT "permission_audit_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."permission_audit"
    ADD CONSTRAINT "permission_audit_permission_id_fkey" 
    FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."permission_audit"
    ADD CONSTRAINT "permission_audit_changed_by_fkey" 
    FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- Indexes
CREATE INDEX "idx_permission_audit_user_id" ON "public"."permission_audit" ("user_id");
CREATE INDEX "idx_permission_audit_permission_id" ON "public"."permission_audit" ("permission_id");
CREATE INDEX "idx_permission_audit_action" ON "public"."permission_audit" ("action");
CREATE INDEX "idx_permission_audit_created_at" ON "public"."permission_audit" ("created_at");
```

---

## API Endpoints

### User Permissions Endpoints

#### 1. Get User Permissions (with inheritance)
```typescript
GET /api/v1/users/:id/permissions
Query Parameters:
- include_inherited: boolean (include role-based permissions)
- module: string (filter by module)
- category: string (filter by category)
- active_only: boolean (show only active permissions)
```

#### 2. Update User Permissions
```typescript
PUT /api/v1/users/:id/permissions
Body: {
  permissions: Array<{
    permission_id: string;
    granted: boolean;
    notes?: string;
  }>;
}
```

### Permission Management Endpoints

#### 3. Get All Permissions
```typescript
GET /api/v1/permissions
Query Parameters:
- module: string (filter by module)
- category: string (filter by category)
- active_only: boolean (show only active permissions)
```

#### 4. Get Permissions by Categories
```typescript
GET /api/v1/permissions/categories
```

#### 5. Get Direct User Permissions
```typescript
GET /api/v1/permissions/user/:userId
```

#### 6. Bulk Update User Permissions
```typescript
PUT /api/v1/permissions/user/:userId
Body: {
  permissions: Array<{
    permission_id: string;
    granted: boolean;
    notes?: string;
  }>;
}
```

---

## Backend Implementation

### 1. User Permissions Service

```typescript
// File: backend/src/services/userPermissions.service.ts
import { supabaseAdmin } from '../config/supabaseClient';
import { PermissionAuditService } from './permissionAudit.service';

export interface Permission {
  id: string;
  permission_name: string;
  module: string;
  category: string;
  description: string;
  is_active: boolean;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  granted: boolean;
  granted_at: string;
  granted_by_user_id?: string;
  notes?: string;
  permission: Permission;
}

export interface MergedUserPermission {
  permission_id: string;
  permission_name: string;
  module: string;
  category: string;
  description: string;
  granted: boolean;
  source: 'role' | 'direct' | 'inherited';
  role_name?: string;
  granted_at?: string;
  granted_by?: string;
  notes?: string;
}

export interface PermissionFilters {
  include_inherited?: boolean;
  module?: string;
  category?: string;
  active_only?: boolean;
}

export class UserPermissionsService {
  // Get user permissions with role inheritance
  static async getUserPermissions(
    userId: string, 
    filters: PermissionFilters = {}
  ): Promise<MergedUserPermission[]> {
    const {
      include_inherited = true,
      module = '',
      category = '',
      active_only = true
    } = filters;

    // Get user's roles
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select(`
        role_id,
        roles!inner(
          id,
          name,
          role_permissions!inner(
            permission_id,
            permissions!inner(
              id,
              permission_name,
              module,
              category,
              description,
              is_active
            )
          )
        )
      `)
      .eq('user_id', userId);

    // Get direct user permissions
    const { data: directPermissions } = await supabaseAdmin
      .from('user_permissions')
      .select(`
        id,
        permission_id,
        granted,
        granted_at,
        granted_by_user_id,
        notes,
        permissions!inner(
          id,
          permission_name,
          module,
          category,
          description,
          is_active
        )
      `)
      .eq('user_id', userId);

    // Merge permissions with inheritance logic
    const mergedPermissions = new Map<string, MergedUserPermission>();

    // Add role-based permissions
    if (include_inherited && userRoles) {
      userRoles.forEach((userRole: any) => {
        const roleName = userRole.roles.name;
        userRole.roles.role_permissions?.forEach((rp: any) => {
          const permission = rp.permissions;
          
          // Apply filters
          if (active_only && !permission.is_active) return;
          if (module && permission.module !== module) return;
          if (category && permission.category !== category) return;

          mergedPermissions.set(permission.id, {
            permission_id: permission.id,
            permission_name: permission.permission_name,
            module: permission.module,
            category: permission.category,
            description: permission.description,
            granted: true, // Role permissions are always granted
            source: 'role',
            role_name: roleName
          });
        });
      });
    }

    // Add/override with direct permissions
    if (directPermissions) {
      directPermissions.forEach((up: any) => {
        const permission = up.permissions;
        
        // Apply filters
        if (active_only && !permission.is_active) return;
        if (module && permission.module !== module) return;
        if (category && permission.category !== category) return;

        mergedPermissions.set(permission.id, {
          permission_id: permission.id,
          permission_name: permission.permission_name,
          module: permission.module,
          category: permission.category,
          description: permission.description,
          granted: up.granted,
          source: 'direct',
          granted_at: up.granted_at,
          granted_by: up.granted_by_user_id,
          notes: up.notes
        });
      });
    }

    return Array.from(mergedPermissions.values());
  }

  // Get permissions grouped by categories
  static async getPermissionsByCategories(): Promise<Record<string, Permission[]>> {
    const { data: permissions, error } = await supabaseAdmin
      .from('permissions')
      .select('*')
      .eq('is_active', true)
      .order('category, module, permission_name');

    if (error) {
      throw new Error(`Failed to fetch permissions: ${error.message}`);
    }

    // Group by category
    const groupedPermissions: Record<string, Permission[]> = {};
    permissions?.forEach(permission => {
      const category = permission.category || 'Other';
      if (!groupedPermissions[category]) {
        groupedPermissions[category] = [];
      }
      groupedPermissions[category].push(permission);
    });

    return groupedPermissions;
  }

  // Get all permissions with filters
  static async getAllPermissions(filters: {
    module?: string;
    category?: string;
    active_only?: boolean;
  } = {}): Promise<Permission[]> {
    const { module = '', category = '', active_only = true } = filters;

    let query = supabaseAdmin
      .from('permissions')
      .select('*')
      .order('category, module, permission_name');

    if (active_only) {
      query = query.eq('is_active', true);
    }

    if (module) {
      query = query.eq('module', module);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: permissions, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch permissions: ${error.message}`);
    }

    return permissions || [];
  }

  // Update user permissions (bulk)
  static async updateUserPermissions(
    userId: string,
    permissions: Array<{
      permission_id: string;
      granted: boolean;
      notes?: string;
    }>,
    changedBy: string
  ): Promise<void> {
    // Get current permissions for audit
    const currentPermissions = await this.getUserPermissions(userId, { include_inherited: false });

    // Process each permission update
    for (const perm of permissions) {
      const currentPerm = currentPermissions.find(p => p.permission_id === perm.permission_id);
      const oldValue = currentPerm?.granted ?? false;

      if (oldValue !== perm.granted) {
        // Upsert the permission
        const { error: upsertError } = await supabaseAdmin
          .from('user_permissions')
          .upsert({
            user_id: userId,
            permission_id: perm.permission_id,
            granted: perm.granted,
            granted_by_user_id: changedBy,
            notes: perm.notes,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,permission_id'
          });

        if (upsertError) {
          throw new Error(`Failed to update permission ${perm.permission_id}: ${upsertError.message}`);
        }

        // Log the change
        await PermissionAuditService.logPermissionChange({
          user_id: userId,
          permission_id: perm.permission_id,
          action: perm.granted ? 'granted' : 'revoked',
          old_value: oldValue,
          new_value: perm.granted,
          changed_by: changedBy,
          notes: perm.notes
        });
      }
    }
  }

  // Remove a specific user permission
  static async removeUserPermission(
    userId: string,
    permissionId: string,
    changedBy: string
  ): Promise<void> {
    // Get current permission for audit
    const currentPermissions = await this.getUserPermissions(userId, { include_inherited: false });
    const currentPerm = currentPermissions.find(p => p.permission_id === permissionId);

    // Delete the permission
    const { error } = await supabaseAdmin
      .from('user_permissions')
      .delete()
      .eq('user_id', userId)
      .eq('permission_id', permissionId);

    if (error) {
      throw new Error(`Failed to remove permission: ${error.message}`);
    }

    // Log the removal
    if (currentPerm) {
      await PermissionAuditService.logPermissionChange({
        user_id: userId,
        permission_id: permissionId,
        action: 'revoked',
        old_value: currentPerm.granted,
        new_value: false,
        changed_by: changedBy,
        notes: 'Permission removed'
      });
    }
  }

  // Get permission statistics for a user
  static async getUserPermissionStats(userId: string): Promise<{
    total_permissions: number;
    granted_permissions: number;
    role_permissions: number;
    direct_permissions: number;
    denied_permissions: number;
  }> {
    const permissions = await this.getUserPermissions(userId, { include_inherited: true });
    
    const total = permissions.length;
    const granted = permissions.filter(p => p.granted).length;
    const roleBased = permissions.filter(p => p.source === 'role').length;
    const direct = permissions.filter(p => p.source === 'direct').length;
    const denied = total - granted;

    return {
      total_permissions: total,
      granted_permissions: granted,
      role_permissions: roleBased,
      direct_permissions: direct,
      denied_permissions: denied
    };
  }
}
```

### 2. Permission Audit Service

```typescript
// File: backend/src/services/permissionAudit.service.ts
import { supabaseAdmin } from '../config/supabaseClient';

export interface PermissionAuditData {
  user_id: string;
  permission_id: string;
  action: 'granted' | 'revoked' | 'updated';
  old_value?: boolean;
  new_value?: boolean;
  changed_by: string;
  ip_address?: string;
  user_agent?: string;
  notes?: string;
}

export class PermissionAuditService {
  static async logPermissionChange(data: PermissionAuditData): Promise<void> {
    const { error } = await supabaseAdmin
      .from('permission_audit')
      .insert([{
        user_id: data.user_id,
        permission_id: data.permission_id,
        action: data.action,
        old_value: data.old_value,
        new_value: data.new_value,
        changed_by: data.changed_by,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        notes: data.notes
      }]);

    if (error) {
      console.error('Failed to log permission change:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  static async getPermissionAuditLogs(
    userId: string, 
    limit: number = 50
  ): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('permission_audit')
      .select(`
        *,
        permission:permissions!permission_audit_permission_id_fkey(
          permission_name,
          module,
          category
        ),
        changed_by_user:users!permission_audit_changed_by_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch permission audit logs: ${error.message}`);
    }

    return data || [];
  }
}
```

### 3. User Permissions Controller

```typescript
// File: backend/src/controllers/userPermissions.controller.ts
import { Request, Response } from 'express';
import { UserPermissionsService } from '../services/userPermissions.service';
import { AuthenticatedRequest } from '../middleware/auth';

export class UserPermissionsController {
  // GET /api/v1/users/:id/permissions
  static async getUserPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const filters = {
        include_inherited: req.query.include_inherited === 'true',
        module: req.query.module as string,
        category: req.query.category as string,
        active_only: req.query.active_only !== 'false'
      };

      const permissions = await UserPermissionsService.getUserPermissions(id, filters);

      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch user permissions'
      });
    }
  }

  // PUT /api/v1/users/:id/permissions
  static async updateUserPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      const changedBy = req.user?.userId;

      if (!changedBy) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      await UserPermissionsService.updateUserPermissions(id, permissions, changedBy);

      res.json({
        success: true,
        message: 'User permissions updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update user permissions'
      });
    }
  }

  // GET /api/v1/permissions
  static async getAllPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters = {
        module: req.query.module as string,
        category: req.query.category as string,
        active_only: req.query.active_only !== 'false'
      };

      const permissions = await UserPermissionsService.getAllPermissions(filters);

      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch permissions'
      });
    }
  }

  // GET /api/v1/permissions/categories
  static async getPermissionsByCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const permissions = await UserPermissionsService.getPermissionsByCategories();

      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch permissions by categories'
      });
    }
  }

  // GET /api/v1/permissions/user/:userId
  static async getUserDirectPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const permissions = await UserPermissionsService.getUserPermissions(userId, { 
        include_inherited: false 
      });

      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch user direct permissions'
      });
    }
  }

  // PUT /api/v1/permissions/user/:userId
  static async bulkUpdateUserPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { permissions } = req.body;
      const changedBy = req.user?.userId;

      if (!changedBy) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      await UserPermissionsService.updateUserPermissions(userId, permissions, changedBy);

      res.json({
        success: true,
        message: 'User permissions updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update user permissions'
      });
    }
  }

  // DELETE /api/v1/permissions/user/:userId/:permissionId
  static async removeUserPermission(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, permissionId } = req.params;
      const changedBy = req.user?.userId;

      if (!changedBy) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      await UserPermissionsService.removeUserPermission(userId, permissionId, changedBy);

      res.json({
        success: true,
        message: 'Permission removed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove permission'
      });
    }
  }

  // GET /api/v1/users/:id/permissions/stats
  static async getUserPermissionStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const stats = await UserPermissionsService.getUserPermissionStats(id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch permission statistics'
      });
    }
  }
}
```

### 4. User Permissions Routes

```typescript
// File: backend/src/routes/userPermissions.routes.ts
import { Router } from 'express';
import { UserPermissionsController } from '../controllers/userPermissions.controller';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// User permissions routes
router.get('/users/:id/permissions',
  requirePermission('user.read'),
  UserPermissionsController.getUserPermissions
);

router.put('/users/:id/permissions',
  requirePermission('user.update'),
  UserPermissionsController.updateUserPermissions
);

router.get('/users/:id/permissions/stats',
  requirePermission('user.read'),
  UserPermissionsController.getUserPermissionStats
);

// Permission management routes
router.get('/permissions',
  requirePermission('permission.read'),
  UserPermissionsController.getAllPermissions
);

router.get('/permissions/categories',
  requirePermission('permission.read'),
  UserPermissionsController.getPermissionsByCategories
);

router.get('/permissions/user/:userId',
  requirePermission('permission.read'),
  UserPermissionsController.getUserDirectPermissions
);

router.put('/permissions/user/:userId',
  requirePermission('permission.update'),
  UserPermissionsController.bulkUpdateUserPermissions
);

router.delete('/permissions/user/:userId/:permissionId',
  requirePermission('permission.update'),
  UserPermissionsController.removeUserPermission
);

export default router;
```

---

## Permission Logic & Inheritance

### Key Logic Rules

1. **Role Inheritance**: Users inherit permissions from their assigned roles
2. **Direct Override**: Direct user permissions override role-based permissions
3. **Permission Precedence**: Direct permissions take precedence over role permissions
4. **Audit Trail**: All permission changes are logged with who made the change and when

### Example Merged Permissions Query

```typescript
// This is the core logic for merging role and direct permissions
const getMergedUserPermissions = async (userId: string) => {
  // 1. Get role-based permissions
  const rolePermissions = await supabaseAdmin
    .from('user_roles')
    .select(`
      roles!inner(
        role_permissions!inner(
          permissions!inner(*)
        )
      )
    `)
    .eq('user_id', userId);

  // 2. Get direct user permissions
  const directPermissions = await supabaseAdmin
    .from('user_permissions')
    .select(`
      permissions!inner(*),
      granted,
      granted_at,
      granted_by_user_id
    `)
    .eq('user_id', userId);

  // 3. Merge with direct permissions taking precedence
  const merged = new Map();
  
  // Add role permissions first
  rolePermissions?.forEach(role => {
    role.roles.role_permissions?.forEach(rp => {
      merged.set(rp.permissions.id, {
        ...rp.permissions,
        granted: true,
        source: 'role',
        role_name: role.roles.name
      });
    });
  });

  // Override with direct permissions
  directPermissions?.forEach(up => {
    merged.set(up.permissions.id, {
      ...up.permissions,
      granted: up.granted,
      source: 'direct',
      granted_at: up.granted_at,
      granted_by: up.granted_by_user_id
    });
  });

  return Array.from(merged.values());
};
```

---

## Frontend Integration

### 1. User Permissions Service (Frontend)

```typescript
// File: frontend/src/services/userPermissionsService.ts
import { apiClient } from '../api/apiClient';

export interface Permission {
  id: string;
  permission_name: string;
  module: string;
  category: string;
  description: string;
  is_active: boolean;
}

export interface MergedUserPermission {
  permission_id: string;
  permission_name: string;
  module: string;
  category: string;
  description: string;
  granted: boolean;
  source: 'role' | 'direct' | 'inherited';
  role_name?: string;
  granted_at?: string;
  granted_by?: string;
  notes?: string;
}

export interface UserPermissionStats {
  total_permissions: number;
  granted_permissions: number;
  role_permissions: number;
  direct_permissions: number;
  denied_permissions: number;
}

export class UserPermissionsService {
  // Get user permissions with inheritance
  static async getUserPermissions(
    userId: string,
    includeInherited: boolean = true
  ): Promise<MergedUserPermission[]> {
    const params = new URLSearchParams();
    params.append('include_inherited', includeInherited.toString());
    
    const response = await apiClient.get(`/v1/users/${userId}/permissions?${params}`);
    return response.data;
  }

  // Update user permissions
  static async updateUserPermissions(
    userId: string,
    permissions: Array<{
      permission_id: string;
      granted: boolean;
      notes?: string;
    }>
  ): Promise<void> {
    await apiClient.put(`/v1/users/${userId}/permissions`, { permissions });
  }

  // Get all permissions grouped by categories
  static async getPermissionsByCategories(): Promise<Record<string, Permission[]>> {
    const response = await apiClient.get('/v1/permissions/categories');
    return response.data;
  }

  // Get all permissions
  static async getAllPermissions(): Promise<Permission[]> {
    const response = await apiClient.get('/v1/permissions');
    return response.data;
  }

  // Get user permission statistics
  static async getUserPermissionStats(userId: string): Promise<UserPermissionStats> {
    const response = await apiClient.get(`/v1/users/${userId}/permissions/stats`);
    return response.data;
  }

  // Remove a specific permission
  static async removeUserPermission(userId: string, permissionId: string): Promise<void> {
    await apiClient.delete(`/v1/permissions/user/${userId}/${permissionId}`);
  }
}
```

### 2. Updated UserPermissions.tsx

```typescript
// File: frontend/src/pages/super-admin/UserPermissions.tsx
import React, { useState, useEffect } from 'react';
import { Shield, User, Settings, Eye, Edit, Save, X, CheckCircle, XCircle } from 'lucide-react';
import { UserPermissionsService, MergedUserPermission, Permission } from '../../services/userPermissionsService';

const UserPermissions: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [editingPermissions, setEditingPermissions] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [userPermissions, setUserPermissions] = useState<MergedUserPermission[]>([]);
  const [permissionCategories, setPermissionCategories] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);

  // Load permission categories on component mount
  useEffect(() => {
    loadPermissionCategories();
  }, []);

  // Load user permissions when user is selected
  useEffect(() => {
    if (selectedUser) {
      loadUserPermissions();
    }
  }, [selectedUser]);

  const loadPermissionCategories = async () => {
    try {
      setLoading(true);
      const categories = await UserPermissionsService.getPermissionsByCategories();
      setPermissionCategories(categories);
    } catch (error) {
      console.error('Failed to load permission categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPermissions = async () => {
    try {
      setLoading(true);
      const permissions = await UserPermissionsService.getUserPermissions(selectedUser, true);
      setUserPermissions(permissions);
      
      // Initialize editing state with current permissions
      const permissionMap: Record<string, boolean> = {};
      permissions.forEach(perm => {
        permissionMap[perm.permission_id] = perm.granted;
      });
      setPermissions(permissionMap);
    } catch (error) {
      console.error('Failed to load user permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }));
  };

  const handleSavePermissions = async () => {
    try {
      setLoading(true);
      
      // Convert permissions to the format expected by the API
      const permissionUpdates = Object.entries(permissions).map(([permissionId, granted]) => ({
        permission_id: permissionId,
        granted,
        notes: 'Updated via UserPermissions UI'
      }));

      await UserPermissionsService.updateUserPermissions(selectedUser, permissionUpdates);
      
      // Reload permissions to get updated data
      await loadUserPermissions();
      setEditingPermissions(false);
    } catch (error) {
      console.error('Failed to save permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setPermissions({});
    setEditingPermissions(false);
  };

  const getPermissionSource = (permissionId: string) => {
    const permission = userPermissions.find(p => p.permission_id === permissionId);
    return permission?.source || 'role';
  };

  const getPermissionRole = (permissionId: string) => {
    const permission = userPermissions.find(p => p.permission_id === permissionId);
    return permission?.role_name;
  };

  // ... rest of the component with updated handlers and data integration
};
```

---

## Testing & Deployment

### 1. Database Migration Steps

```bash
# 1. Run the SQL migration files in order
psql -h your-supabase-host -U postgres -d your-database -f backend/sql_files/15_user_permissions.sql
psql -h your-supabase-host -U postgres -d your-database -f backend/sql_files/16_enhanced_permissions.sql
psql -h your-supabase-host -U postgres -d your-database -f backend/sql_files/17_permission_audit.sql
```

### 2. Backend Integration Steps

```bash
# 1. Add the new routes to your main router
# File: backend/src/routes/index.ts
import userPermissionsRoutes from './userPermissions.routes';
app.use('/api/v1', userPermissionsRoutes);

# 2. Test the endpoints
curl -X GET "http://localhost:3001/api/v1/users/USER_ID/permissions?include_inherited=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Frontend Integration Steps

```bash
# 1. Update your API client base URL if needed
# File: frontend/src/api/apiClient.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

# 2. Test the integration
npm run dev
# Navigate to /super-admin/user-permissions
```

---

## Summary

This implementation provides:

✅ **Granular Permission Management** - Individual user permission overrides  
✅ **Role Inheritance** - Users inherit permissions from their roles  
✅ **Permission Precedence** - Direct permissions override role permissions  
✅ **Category Organization** - Permissions grouped by functional modules  
✅ **Real-time Updates** - Toggle permissions on/off with immediate feedback  
✅ **Audit Logging** - Complete audit trail of all permission changes  
✅ **RBAC Integration** - Uses your existing authentication and authorization  
✅ **TypeScript Support** - Full type safety throughout the stack  

The implementation follows your existing patterns and provides a robust foundation for granular permission management that scales with your application's needs.







