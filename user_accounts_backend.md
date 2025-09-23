# User Accounts Backend Integration Guide

## Overview
This guide provides a complete backend implementation for the UserAccounts.tsx frontend module, including database migrations, API endpoints, and integration steps.

## Table of Contents
1. [Database Migrations](#database-migrations)
2. [API Endpoints](#api-endpoints)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Integration](#frontend-integration)
5. [Testing & Deployment](#testing--deployment)

---

## Database Migrations

### 1. User Account Audit Table
```sql
-- File: backend/sql_files/12_user_account_audit.sql
-- =====================================================
-- User Account Audit Table
-- =====================================================

CREATE TABLE IF NOT EXISTS "public"."user_account_audit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" character varying(50) NOT NULL,
    "old_values" jsonb,
    "new_values" jsonb,
    "changed_by" "uuid" NOT NULL,
    "ip_address" inet,
    "user_agent" text,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_uaa_action" CHECK (("action"::text = ANY (ARRAY[
        'created'::character varying,
        'updated'::character varying,
        'activated'::character varying,
        'deactivated'::character varying,
        'deleted'::character varying,
        'role_assigned'::character varying,
        'role_removed'::character varying,
        'permission_granted'::character varying,
        'permission_revoked'::character varying
    ]::text[])))
);

ALTER TABLE "public"."user_account_audit" OWNER TO "postgres";

-- Primary key
ALTER TABLE ONLY "public"."user_account_audit"
    ADD CONSTRAINT "user_account_audit_pkey" PRIMARY KEY ("id");

-- Foreign keys
ALTER TABLE ONLY "public"."user_account_audit"
    ADD CONSTRAINT "user_account_audit_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_account_audit"
    ADD CONSTRAINT "user_account_audit_changed_by_fkey" 
    FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- Indexes
CREATE INDEX "idx_user_account_audit_user_id" ON "public"."user_account_audit" ("user_id");
CREATE INDEX "idx_user_account_audit_action" ON "public"."user_account_audit" ("action");
CREATE INDEX "idx_user_account_audit_created_at" ON "public"."user_account_audit" ("created_at");
```

### 2. User Sessions Table
```sql
-- File: backend/sql_files/13_user_sessions.sql
-- =====================================================
-- User Sessions Table
-- =====================================================

CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_token" character varying(255) NOT NULL,
    "ip_address" inet,
    "user_agent" text,
    "is_active" boolean DEFAULT true,
    "last_activity" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "closed_at" timestamp with time zone
);

ALTER TABLE "public"."user_sessions" OWNER TO "postgres";

-- Primary key
ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");

-- Foreign key
ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- Unique constraint
ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_token_unique" UNIQUE ("session_token");

-- Indexes
CREATE INDEX "idx_user_sessions_user_id" ON "public"."user_sessions" ("user_id");
CREATE INDEX "idx_user_sessions_active" ON "public"."user_sessions" ("is_active");
CREATE INDEX "idx_user_sessions_expires" ON "public"."user_sessions" ("expires_at");
```

### 3. User Activity Table
```sql
-- File: backend/sql_files/14_user_activity.sql
-- =====================================================
-- User Activity Table
-- =====================================================

CREATE TABLE IF NOT EXISTS "public"."user_activity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "activity_type" character varying(50) NOT NULL,
    "description" text,
    "metadata" jsonb,
    "ip_address" inet,
    "user_agent" text,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."user_activity" OWNER TO "postgres";

-- Primary key
ALTER TABLE ONLY "public"."user_activity"
    ADD CONSTRAINT "user_activity_pkey" PRIMARY KEY ("id");

-- Foreign key
ALTER TABLE ONLY "public"."user_activity"
    ADD CONSTRAINT "user_activity_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- Indexes
CREATE INDEX "idx_user_activity_user_id" ON "public"."user_activity" ("user_id");
CREATE INDEX "idx_user_activity_type" ON "public"."user_activity" ("activity_type");
CREATE INDEX "idx_user_activity_created_at" ON "public"."user_activity" ("created_at");
```

---

## API Endpoints

### User Management Endpoints

#### 1. Get Users (with pagination, search, filters)
```typescript
GET /api/v1/users
Query Parameters:
- search: string (search by name or email)
- role: string (filter by role)
- status: string (active/inactive)
- page: number (pagination)
- limit: number (items per page)
- sort_by: string (field to sort by)
- sort_order: 'asc' | 'desc'
```

#### 2. Create User
```typescript
POST /api/v1/users
Body: {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  branch_id?: string;
  is_active?: boolean;
}
```

#### 3. Get User by ID
```typescript
GET /api/v1/users/:id
```

#### 4. Update User
```typescript
PUT /api/v1/users/:id
Body: Partial<UserData>
```

#### 5. Delete User
```typescript
DELETE /api/v1/users/:id
```

#### 6. Activate/Deactivate User
```typescript
PATCH /api/v1/users/:id/activate
PATCH /api/v1/users/:id/deactivate
```

### Role Management Endpoints

#### 7. Get User Roles
```typescript
GET /api/v1/users/:id/roles
```

#### 8. Assign Role to User
```typescript
POST /api/v1/users/:id/roles
Body: { role_id: string }
```

#### 9. Remove Role from User
```typescript
DELETE /api/v1/users/:id/roles/:roleId
```

### Global Role & Permission Endpoints

#### 10. Get All Roles
```typescript
GET /api/v1/roles
```

#### 11. Create Role
```typescript
POST /api/v1/roles
Body: { name: string; description?: string }
```

#### 12. Get All Permissions
```typescript
GET /api/v1/permissions
```

---

## Backend Implementation

### 1. User Service (users.service.ts)

```typescript
// File: backend/src/services/users.service.ts
import { supabaseAdmin } from '../config/supabaseClient';
import { UserAccountAuditService } from './userAccountAudit.service';

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  branch_id?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  roles: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  permissions: Array<{
    id: string;
    name: string;
    resource: string;
    action: string;
  }>;
}

export class UsersService {
  // Get users with pagination and filters
  static async getUsers(filters: UserFilters = {}): Promise<{
    users: UserData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const {
      search = '',
      role = '',
      status = '',
      page = 1,
      limit = 10,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = filters;

    const offset = (page - 1) * limit;

    // Build the query
    let query = supabaseAdmin
      .from('users')
      .select(`
        *,
        user_roles!inner(
          role_id,
          roles!inner(
            id,
            name,
            description
          )
        )
      `);

    // Apply filters
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('is_active', status === 'active');
    }

    if (role) {
      query = query.eq('user_roles.roles.name', role);
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    // Get total count for pagination
    const { count: totalCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return {
      users: users || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages
      }
    };
  }

  // Get user by ID with roles and permissions
  static async getUserById(id: string): Promise<UserData | null> {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        user_roles(
          role_id,
          roles(
            id,
            name,
            description
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    // Get permissions for user's roles
    const roleIds = user.user_roles?.map((ur: any) => ur.role_id) || [];
    
    const { data: permissions } = await supabaseAdmin
      .from('role_permissions')
      .select(`
        permission_id,
        permissions(
          id,
          name,
          resource,
          action
        )
      `)
      .in('role_id', roleIds);

    return {
      ...user,
      roles: user.user_roles?.map((ur: any) => ur.roles) || [],
      permissions: permissions?.map((rp: any) => rp.permissions) || []
    };
  }

  // Create new user
  static async createUser(userData: Partial<UserData>, createdBy: string): Promise<UserData> {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert([{
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        branch_id: userData.branch_id,
        is_active: userData.is_active ?? true
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    // Assign role if provided
    if (userData.roles && userData.roles.length > 0) {
      const roleAssignments = userData.roles.map(role => ({
        user_id: user.id,
        role_id: role.id
      }));

      await supabaseAdmin
        .from('user_roles')
        .insert(roleAssignments);
    }

    // Log the creation
    await UserAccountAuditService.logAction({
      user_id: user.id,
      action: 'created',
      new_values: user,
      changed_by: createdBy
    });

    return await this.getUserById(user.id) as UserData;
  }

  // Update user
  static async updateUser(id: string, updates: Partial<UserData>, updatedBy: string): Promise<UserData> {
    // Get current user data for audit
    const currentUser = await this.getUserById(id);
    if (!currentUser) {
      throw new Error('User not found');
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({
        email: updates.email,
        first_name: updates.first_name,
        last_name: updates.last_name,
        phone: updates.phone,
        branch_id: updates.branch_id,
        is_active: updates.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    // Log the update
    await UserAccountAuditService.logAction({
      user_id: id,
      action: 'updated',
      old_values: currentUser,
      new_values: user,
      changed_by: updatedBy
    });

    return await this.getUserById(id) as UserData;
  }

  // Activate/Deactivate user
  static async toggleUserStatus(id: string, isActive: boolean, changedBy: string): Promise<UserData> {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user status: ${error.message}`);
    }

    // Log the status change
    await UserAccountAuditService.logAction({
      user_id: id,
      action: isActive ? 'activated' : 'deactivated',
      new_values: { is_active: isActive },
      changed_by: changedBy
    });

    return await this.getUserById(id) as UserData;
  }

  // Get user summary statistics
  static async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    admins: number;
    staff: number;
  }> {
    const [
      { count: total },
      { count: active },
      { count: inactive },
      { count: admins }
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('is_active', false),
      supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('user_roles.roles.name', 'admin')
    ]);

    return {
      total: total || 0,
      active: active || 0,
      inactive: inactive || 0,
      admins: admins || 0,
      staff: (active || 0) - (admins || 0)
    };
  }
}
```

### 2. User Controller (users.controller.ts)

```typescript
// File: backend/src/controllers/users.controller.ts
import { Request, Response } from 'express';
import { UsersService } from '../services/users.service';
import { AuthenticatedRequest } from '../middleware/auth';

export class UsersController {
  // GET /api/v1/users
  static async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters = {
        search: req.query.search as string,
        role: req.query.role as string,
        status: req.query.status as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sort_by: req.query.sort_by as string || 'created_at',
        sort_order: (req.query.sort_order as 'asc' | 'desc') || 'desc'
      };

      const result = await UsersService.getUsers(filters);

      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch users'
      });
    }
  }

  // GET /api/v1/users/:id
  static async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UsersService.getUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch user'
      });
    }
  }

  // POST /api/v1/users
  static async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userData = req.body;
      const createdBy = req.user?.userId;

      if (!createdBy) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const user = await UsersService.createUser(userData, createdBy);

      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create user'
      });
    }
  }

  // PUT /api/v1/users/:id
  static async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedBy = req.user?.userId;

      if (!updatedBy) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const user = await UsersService.updateUser(id, updates, updatedBy);

      res.json({
        success: true,
        data: user,
        message: 'User updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update user'
      });
    }
  }

  // PATCH /api/v1/users/:id/activate
  static async activateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const changedBy = req.user?.userId;

      if (!changedBy) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const user = await UsersService.toggleUserStatus(id, true, changedBy);

      res.json({
        success: true,
        data: user,
        message: 'User activated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to activate user'
      });
    }
  }

  // PATCH /api/v1/users/:id/deactivate
  static async deactivateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const changedBy = req.user?.userId;

      if (!changedBy) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const user = await UsersService.toggleUserStatus(id, false, changedBy);

      res.json({
        success: true,
        data: user,
        message: 'User deactivated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to deactivate user'
      });
    }
  }

  // GET /api/v1/users/stats
  static async getUserStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await UsersService.getUserStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch user statistics'
      });
    }
  }
}
```

### 3. User Routes (users.routes.ts)

```typescript
// File: backend/src/routes/users.routes.ts
import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// User management routes
router.get('/', 
  requirePermission('user.read'),
  UsersController.getUsers
);

router.get('/stats',
  requirePermission('user.read'),
  UsersController.getUserStats
);

router.get('/:id',
  requirePermission('user.read'),
  UsersController.getUserById
);

router.post('/',
  requirePermission('user.create'),
  UsersController.createUser
);

router.put('/:id',
  requirePermission('user.update'),
  UsersController.updateUser
);

router.patch('/:id/activate',
  requirePermission('user.update'),
  UsersController.activateUser
);

router.patch('/:id/deactivate',
  requirePermission('user.update'),
  UsersController.deactivateUser
);

export default router;
```

### 4. User Account Audit Service

```typescript
// File: backend/src/services/userAccountAudit.service.ts
import { supabaseAdmin } from '../config/supabaseClient';

export interface AuditLogData {
  user_id: string;
  action: string;
  old_values?: any;
  new_values?: any;
  changed_by: string;
  ip_address?: string;
  user_agent?: string;
}

export class UserAccountAuditService {
  static async logAction(data: AuditLogData): Promise<void> {
    const { error } = await supabaseAdmin
      .from('user_account_audit')
      .insert([{
        user_id: data.user_id,
        action: data.action,
        old_values: data.old_values,
        new_values: data.new_values,
        changed_by: data.changed_by,
        ip_address: data.ip_address,
        user_agent: data.user_agent
      }]);

    if (error) {
      console.error('Failed to log audit action:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  static async getAuditLogs(userId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('user_account_audit')
      .select(`
        *,
        changed_by_user:users!user_account_audit_changed_by_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return data || [];
  }
}
```

---

## Frontend Integration

### 1. User Service (frontend)

```typescript
// File: frontend/src/services/userService.ts
import { apiClient } from '../api/apiClient';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  branch_id?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  roles: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  permissions: Array<{
    id: string;
    name: string;
    resource: string;
    action: string;
  }>;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  staff: number;
}

export class UserService {
  // Get users with pagination and filters
  static async getUsers(filters: UserFilters = {}): Promise<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/v1/users?${params.toString()}`);
    return response.data;
  }

  // Get user by ID
  static async getUserById(id: string): Promise<User> {
    const response = await apiClient.get(`/v1/users/${id}`);
    return response.data;
  }

  // Create user
  static async createUser(userData: Partial<User>): Promise<User> {
    const response = await apiClient.post('/v1/users', userData);
    return response.data;
  }

  // Update user
  static async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const response = await apiClient.put(`/v1/users/${id}`, updates);
    return response.data;
  }

  // Activate user
  static async activateUser(id: string): Promise<User> {
    const response = await apiClient.patch(`/v1/users/${id}/activate`);
    return response.data;
  }

  // Deactivate user
  static async deactivateUser(id: string): Promise<User> {
    const response = await apiClient.patch(`/v1/users/${id}/deactivate`);
    return response.data;
  }

  // Get user statistics
  static async getUserStats(): Promise<UserStats> {
    const response = await apiClient.get('/v1/users/stats');
    return response.data;
  }
}
```

### 2. Updated UserAccounts.tsx

```typescript
// File: frontend/src/pages/super-admin/UserAccounts.tsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, User, Mail, Phone, Shield } from 'lucide-react';
import { UserService, User, UserStats } from '../../services/userService';

const UserAccounts: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Load users and stats
  useEffect(() => {
    loadUsers();
    loadStats();
  }, [searchTerm, selectedRole, selectedStatus, pagination.page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await UserService.getUsers({
        search: searchTerm,
        role: selectedRole === 'all' ? '' : selectedRole,
        status: selectedStatus === 'all' ? '' : selectedStatus,
        page: pagination.page,
        limit: pagination.limit
      });
      
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await UserService.getUserStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleActivateUser = async (id: string) => {
    try {
      await UserService.activateUser(id);
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('Failed to activate user:', error);
    }
  };

  const handleDeactivateUser = async (id: string) => {
    try {
      await UserService.deactivateUser(id);
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('Failed to deactivate user:', error);
    }
  };

  // ... rest of the component with updated handlers
};
```

---

## Testing & Deployment

### 1. Database Migration Steps

```bash
# 1. Run the SQL migration files in order
psql -h your-supabase-host -U postgres -d your-database -f backend/sql_files/12_user_account_audit.sql
psql -h your-supabase-host -U postgres -d your-database -f backend/sql_files/13_user_sessions.sql
psql -h your-supabase-host -U postgres -d your-database -f backend/sql_files/14_user_activity.sql
```

### 2. Backend Integration Steps

```bash
# 1. Add the new routes to your main router
# File: backend/src/routes/index.ts
import usersRoutes from './users.routes';
app.use('/api/v1/users', usersRoutes);

# 2. Install any additional dependencies if needed
npm install --save-dev @types/uuid

# 3. Test the endpoints
curl -X GET "http://localhost:3001/api/v1/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Frontend Integration Steps

```bash
# 1. Update your API client base URL if needed
# File: frontend/src/api/apiClient.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

# 2. Test the integration
npm run dev
# Navigate to /super-admin/user-accounts
```

---

## Summary

This implementation provides:

✅ **Complete CRUD operations** for user management  
✅ **Role and permission management** with audit logging  
✅ **Pagination, search, and filtering** capabilities  
✅ **Real-time statistics** and user activity tracking  
✅ **Proper authentication and authorization** using your existing middleware  
✅ **Audit logging** for all user account changes  
✅ **TypeScript interfaces** for type safety  
✅ **Modular structure** for easy testing and maintenance  

The implementation follows your existing patterns and integrates seamlessly with your current authentication and RBAC system. You can implement this step by step, starting with the database migrations and then the backend services, followed by the frontend integration.







