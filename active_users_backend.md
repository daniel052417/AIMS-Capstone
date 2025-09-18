# Active Users Backend Integration Guide

## Overview
This guide provides a complete backend implementation for the ActiveUsers module, including database schema, API endpoints, and frontend integration steps.

## Table of Contents
1. [Database Schema & Migrations](#database-schema--migrations)
2. [API Endpoints & Routes](#api-endpoints--routes)
3. [Controllers & Services](#controllers--services)
4. [Authentication & Authorization](#authentication--authorization)
5. [Frontend Integration](#frontend-integration)
6. [Implementation Steps](#implementation-steps)

---

## Database Schema & Migrations

### New Tables Required

#### 1. User Sessions Table
```sql
-- Track active user sessions
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  location_info JSONB,
  current_page VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'away', 'inactive')),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_status ON user_sessions(status);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
```

#### 2. User Activity Table
```sql
-- Track real-time user activity
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  page_url VARCHAR(500),
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_session_id ON user_activity(session_id);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at);
CREATE INDEX idx_user_activity_type ON user_activity(activity_type);
```

#### 3. Login History Table
```sql
-- Detailed login tracking
CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
  login_type VARCHAR(20) DEFAULT 'password' CHECK (login_type IN ('password', 'oauth', 'sso')),
  ip_address INET NOT NULL,
  user_agent TEXT,
  device_info JSONB,
  location_info JSONB,
  success BOOLEAN DEFAULT true,
  failure_reason VARCHAR(100),
  login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  logout_at TIMESTAMP WITH TIME ZONE,
  session_duration INTEGER -- in seconds
);

-- Indexes for performance
CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_login_at ON login_history(login_at);
CREATE INDEX idx_login_history_success ON login_history(success);
```

#### 4. Device Info Table
```sql
-- Store device and browser information
CREATE TABLE device_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_fingerprint VARCHAR(255) UNIQUE,
  device_type VARCHAR(50), -- mobile, desktop, tablet
  browser_name VARCHAR(100),
  browser_version VARCHAR(50),
  os_name VARCHAR(100),
  os_version VARCHAR(50),
  screen_resolution VARCHAR(20),
  timezone VARCHAR(50),
  language VARCHAR(10),
  is_mobile BOOLEAN DEFAULT false,
  is_tablet BOOLEAN DEFAULT false,
  is_desktop BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_device_info_user_id ON device_info(user_id);
CREATE INDEX idx_device_info_fingerprint ON device_info(device_fingerprint);
```

### Update Existing Tables

#### Update Users Table
```sql
-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
ADD COLUMN IF NOT EXISTS current_session_id UUID REFERENCES user_sessions(id),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10);

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity);
```

---

## API Endpoints & Routes

### Route File: `backend/src/routes/activeUsers.routes.ts`

```typescript
import { Router } from 'express';
import { ActiveUsersController } from '../controllers/activeUsers.controller';
import { authenticateToken, requireRole } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Core user management
router.get('/users', 
  requireRole(['super_admin']),
  requirePermission('users.read'),
  ActiveUsersController.getUsers
);

router.get('/users/:id', 
  requireRole(['super_admin']),
  requirePermission('users.read'),
  ActiveUsersController.getUserById
);

router.patch('/users/:id/deactivate', 
  requireRole(['super_admin']),
  requirePermission('users.update'),
  ActiveUsersController.deactivateUser
);

router.patch('/users/:id/activate', 
  requireRole(['super_admin']),
  requirePermission('users.update'),
  ActiveUsersController.activateUser
);

// Active Users specific
router.get('/active-users', 
  requireRole(['super_admin']),
  requirePermission('users.read'),
  ActiveUsersController.getActiveUsers
);

router.get('/active-users/stats', 
  requireRole(['super_admin']),
  requirePermission('users.read'),
  ActiveUsersController.getActiveUsersStats
);

router.get('/active-users/export', 
  requireRole(['super_admin']),
  requirePermission('users.read'),
  ActiveUsersController.exportActiveUsers
);

// User Activity & Sessions
router.get('/users/:id/sessions', 
  requireRole(['super_admin']),
  requirePermission('users.read'),
  ActiveUsersController.getUserSessions
);

router.get('/users/:id/activity', 
  requireRole(['super_admin']),
  requirePermission('users.read'),
  ActiveUsersController.getUserActivity
);

router.patch('/users/:id/force-logout', 
  requireRole(['super_admin']),
  requirePermission('users.update'),
  ActiveUsersController.forceLogoutUser
);

// Real-time Updates
router.get('/active-users/stream', 
  requireRole(['super_admin']),
  requirePermission('users.read'),
  ActiveUsersController.getActiveUsersStream
);

router.get('/active-users/heartbeat', 
  requireRole(['super_admin']),
  requirePermission('users.read'),
  ActiveUsersController.getHeartbeat
);

export default router;
```

---

## Controllers & Services

### Controller: `backend/src/controllers/activeUsers.controller.ts`

```typescript
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ActiveUsersService } from '../services/activeUsers.service';
import { asyncHandler } from '../middleware/errorHandler';

export class ActiveUsersController {
  // Get all users with filtering
  static getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { status, role, search, page = 1, limit = 10 } = req.query;
    
    const filters = {
      status: status as string,
      role: role as string,
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await ActiveUsersService.getUsers(filters);
    
    res.json({
      success: true,
      data: result
    });
  });

  // Get specific user details
  static getUserById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const user = await ActiveUsersService.getUserById(id);
    
    res.json({
      success: true,
      data: user
    });
  });

  // Deactivate user
  static deactivateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    await ActiveUsersService.deactivateUser(id, reason, req.user!.userId);
    
    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  });

  // Activate user
  static activateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    await ActiveUsersService.activateUser(id, reason, req.user!.userId);
    
    res.json({
      success: true,
      message: 'User activated successfully'
    });
  });

  // Get active users
  static getActiveUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { status = 'online', role, search, page = 1, limit = 20 } = req.query;
    
    const filters = {
      status: status as string,
      role: role as string,
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await ActiveUsersService.getActiveUsers(filters);
    
    res.json({
      success: true,
      data: result
    });
  });

  // Get active users statistics
  static getActiveUsersStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await ActiveUsersService.getActiveUsersStats();
    
    res.json({
      success: true,
      data: stats
    });
  });

  // Export active users data
  static exportActiveUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { format = 'csv', status, role } = req.query;
    
    const filters = {
      status: status as string,
      role: role as string
    };

    const exportData = await ActiveUsersService.exportActiveUsers(filters, format as string);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=active_users.csv');
    res.send(exportData);
  });

  // Get user sessions
  static getUserSessions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const sessions = await ActiveUsersService.getUserSessions(
      id, 
      parseInt(page as string), 
      parseInt(limit as string)
    );
    
    res.json({
      success: true,
      data: sessions
    });
  });

  // Get user activity
  static getUserActivity = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { page = 1, limit = 20, type } = req.query;
    
    const activity = await ActiveUsersService.getUserActivity(
      id, 
      parseInt(page as string), 
      parseInt(limit as string),
      type as string
    );
    
    res.json({
      success: true,
      data: activity
    });
  });

  // Force logout user
  static forceLogoutUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    await ActiveUsersService.forceLogoutUser(id, reason, req.user!.userId);
    
    res.json({
      success: true,
      message: 'User logged out successfully'
    });
  });

  // WebSocket stream for real-time updates
  static getActiveUsersStream = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // This would be implemented with WebSocket or Server-Sent Events
    res.json({
      success: true,
      message: 'WebSocket endpoint - implement with ws library'
    });
  });

  // Heartbeat endpoint for real-time updates
  static getHeartbeat = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await ActiveUsersService.getActiveUsersStats();
    
    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        stats
      }
    });
  });
}
```

### Service: `backend/src/services/activeUsers.service.ts`

```typescript
import { supabaseAdmin } from '../config/supabaseClient';
import { AuditLogService } from './auditLog.service';

export interface UserFilters {
  status?: string;
  role?: string;
  search?: string;
  page: number;
  limit: number;
}

export interface ActiveUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  status: 'online' | 'away' | 'offline';
  last_activity: string;
  current_page?: string;
  session_duration?: number;
  ip_address?: string;
  location?: string;
  device_info?: any;
  roles: string[];
  created_at: string;
}

export class ActiveUsersService {
  // Get users with filtering
  static async getUsers(filters: UserFilters) {
    try {
      let query = supabaseAdmin
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          status,
          last_activity,
          current_session_id,
          created_at,
          user_roles (
            roles (
              role_name
            )
          )
        `);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to).order('last_activity', { ascending: false });

      const { data: users, error, count } = await query;

      if (error) throw error;

      // Transform data
      const transformedUsers = users?.map(user => ({
        ...user,
        roles: user.user_roles?.map((ur: any) => ur.roles?.role_name).filter(Boolean) || []
      })) || [];

      return {
        users: transformedUsers,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / filters.limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error}`);
    }
  }

  // Get specific user by ID
  static async getUserById(id: string) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          user_roles (
            roles (
              role_name
            )
          ),
          user_sessions (
            id,
            status,
            last_activity,
            current_page,
            ip_address,
            device_info,
            created_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...user,
        roles: user.user_roles?.map((ur: any) => ur.roles?.role_name).filter(Boolean) || []
      };
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error}`);
    }
  }

  // Get active users with real-time data
  static async getActiveUsers(filters: UserFilters) {
    try {
      let query = supabaseAdmin
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          status,
          last_activity,
          current_session_id,
          created_at,
          user_roles (
            roles (
              role_name
            )
          ),
          user_sessions!current_session_id (
            id,
            status,
            last_activity,
            current_page,
            ip_address,
            device_info,
            created_at
          )
        `)
        .in('status', ['online', 'away']);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.role) {
        query = query.eq('user_roles.roles.role_name', filters.role);
      }

      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to).order('last_activity', { ascending: false });

      const { data: users, error, count } = await query;

      if (error) throw error;

      // Transform and calculate session duration
      const transformedUsers = users?.map(user => {
        const session = user.user_sessions?.[0];
        const sessionDuration = session ? 
          Math.floor((new Date().getTime() - new Date(session.created_at).getTime()) / 1000) : 0;

        return {
          ...user,
          roles: user.user_roles?.map((ur: any) => ur.roles?.role_name).filter(Boolean) || [],
          session_duration: sessionDuration,
          current_page: session?.current_page,
          ip_address: session?.ip_address,
          device_info: session?.device_info
        };
      }) || [];

      return {
        users: transformedUsers,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / filters.limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch active users: ${error}`);
    }
  }

  // Get active users statistics
  static async getActiveUsersStats() {
    try {
      const [
        totalUsers,
        onlineUsers,
        awayUsers,
        offlineUsers,
        recentLogins
      ] = await Promise.all([
        supabaseAdmin.from('users').select('id', { count: 'exact' }),
        supabaseAdmin.from('users').select('id', { count: 'exact' }).eq('status', 'online'),
        supabaseAdmin.from('users').select('id', { count: 'exact' }).eq('status', 'away'),
        supabaseAdmin.from('users').select('id', { count: 'exact' }).eq('status', 'offline'),
        supabaseAdmin
          .from('login_history')
          .select('id', { count: 'exact' })
          .gte('login_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      return {
        total_users: totalUsers.count || 0,
        online_users: onlineUsers.count || 0,
        away_users: awayUsers.count || 0,
        offline_users: offlineUsers.count || 0,
        recent_logins: recentLogins.count || 0,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to fetch stats: ${error}`);
    }
  }

  // Deactivate user
  static async deactivateUser(userId: string, reason: string, adminId: string) {
    try {
      // Update user status
      const { error: userError } = await supabaseAdmin
        .from('users')
        .update({ 
          is_active: false, 
          status: 'offline',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (userError) throw userError;

      // End all active sessions
      const { error: sessionError } = await supabaseAdmin
        .from('user_sessions')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (sessionError) throw sessionError;

      // Log the action
      await AuditLogService.createLog({
        user_id: adminId,
        action: 'user_deactivated',
        entity_type: 'user',
        entity_id: userId,
        new_values: { reason, deactivated_at: new Date().toISOString() }
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to deactivate user: ${error}`);
    }
  }

  // Activate user
  static async activateUser(userId: string, reason: string, adminId: string) {
    try {
      // Update user status
      const { error: userError } = await supabaseAdmin
        .from('users')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (userError) throw userError;

      // Log the action
      await AuditLogService.createLog({
        user_id: adminId,
        action: 'user_activated',
        entity_type: 'user',
        entity_id: userId,
        new_values: { reason, activated_at: new Date().toISOString() }
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to activate user: ${error}`);
    }
  }

  // Force logout user
  static async forceLogoutUser(userId: string, reason: string, adminId: string) {
    try {
      // End all active sessions
      const { error: sessionError } = await supabaseAdmin
        .from('user_sessions')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (sessionError) throw sessionError;

      // Update user status
      const { error: userError } = await supabaseAdmin
        .from('users')
        .update({ 
          status: 'offline',
          current_session_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (userError) throw userError;

      // Log the action
      await AuditLogService.createLog({
        user_id: adminId,
        action: 'user_force_logout',
        entity_type: 'user',
        entity_id: userId,
        new_values: { reason, force_logout_at: new Date().toISOString() }
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to force logout user: ${error}`);
    }
  }

  // Export active users data
  static async exportActiveUsers(filters: any, format: string) {
    try {
      const { users } = await this.getActiveUsers({ ...filters, page: 1, limit: 1000 });
      
      if (format === 'csv') {
        const csvHeaders = 'ID,Name,Email,Status,Last Activity,Current Page,Session Duration,IP Address\n';
        const csvRows = users.map(user => 
          `${user.id},"${user.first_name} ${user.last_name}",${user.email},${user.status},${user.last_activity},${user.current_page || 'N/A'},${user.session_duration || 0},${user.ip_address || 'N/A'}`
        ).join('\n');
        
        return csvHeaders + csvRows;
      }
      
      return users;
    } catch (error) {
      throw new Error(`Failed to export data: ${error}`);
    }
  }

  // Get user sessions
  static async getUserSessions(userId: string, page: number, limit: number) {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: sessions, error, count } = await supabaseAdmin
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        sessions: sessions || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch user sessions: ${error}`);
    }
  }

  // Get user activity
  static async getUserActivity(userId: string, page: number, limit: number, type?: string) {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabaseAdmin
        .from('user_activity')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (type) {
        query = query.eq('activity_type', type);
      }

      const { data: activities, error, count } = await query;

      if (error) throw error;

      return {
        activities: activities || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch user activity: ${error}`);
    }
  }
}
```

---

## Authentication & Authorization

### Middleware Usage Examples

```typescript
// Example route with multiple middleware layers
router.get('/active-users', 
  authenticateToken,                    // 1. Verify JWT token
  requireRole(['super_admin']),        // 2. Check user has super_admin role
  requirePermission('users.read'),     // 3. Check user has users.read permission
  ActiveUsersController.getActiveUsers // 4. Execute controller
);
```

### Permission Requirements

| Endpoint | Required Role | Required Permission |
|----------|---------------|-------------------|
| GET /users | super_admin | users.read |
| GET /users/:id | super_admin | users.read |
| PATCH /users/:id/deactivate | super_admin | users.update |
| PATCH /users/:id/activate | super_admin | users.update |
| GET /active-users | super_admin | users.read |
| GET /active-users/stats | super_admin | users.read |
| GET /active-users/export | super_admin | users.read |
| PATCH /users/:id/force-logout | super_admin | users.update |

---

## Frontend Integration

### API Service: `frontend/src/services/activeUsersService.ts`

```typescript
import { apiClient } from './apiClient';

export interface ActiveUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  status: 'online' | 'away' | 'offline';
  last_activity: string;
  current_page?: string;
  session_duration?: number;
  ip_address?: string;
  location?: string;
  device_info?: any;
  roles: string[];
  created_at: string;
}

export interface UserFilters {
  status?: string;
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class ActiveUsersService {
  // Get active users
  static async getActiveUsers(filters: UserFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.role) params.append('role', filters.role);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/v1/super-admin/active-users?${params.toString()}`);
    return response.data;
  }

  // Get user details
  static async getUserById(id: string) {
    const response = await apiClient.get(`/v1/super-admin/users/${id}`);
    return response.data;
  }

  // Deactivate user
  static async deactivateUser(id: string, reason: string) {
    const response = await apiClient.patch(`/v1/super-admin/users/${id}/deactivate`, { reason });
    return response.data;
  }

  // Activate user
  static async activateUser(id: string, reason: string) {
    const response = await apiClient.patch(`/v1/super-admin/users/${id}/activate`, { reason });
    return response.data;
  }

  // Force logout user
  static async forceLogoutUser(id: string, reason: string) {
    const response = await apiClient.patch(`/v1/super-admin/users/${id}/force-logout`, { reason });
    return response.data;
  }

  // Get active users stats
  static async getActiveUsersStats() {
    const response = await apiClient.get('/v1/super-admin/active-users/stats');
    return response.data;
  }

  // Export active users
  static async exportActiveUsers(filters: UserFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.role) params.append('role', filters.role);
    if (filters.format) params.append('format', filters.format);

    const response = await apiClient.get(`/v1/super-admin/active-users/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Get user sessions
  static async getUserSessions(id: string, page: number = 1, limit: number = 10) {
    const response = await apiClient.get(`/v1/super-admin/users/${id}/sessions?page=${page}&limit=${limit}`);
    return response.data;
  }

  // Get user activity
  static async getUserActivity(id: string, page: number = 1, limit: number = 20, type?: string) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (type) params.append('type', type);

    const response = await apiClient.get(`/v1/super-admin/users/${id}/activity?${params.toString()}`);
    return response.data;
  }

  // Get heartbeat for real-time updates
  static async getHeartbeat() {
    const response = await apiClient.get('/v1/super-admin/active-users/heartbeat');
    return response.data;
  }
}
```

### React Hook: `frontend/src/hooks/useActiveUsers.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { ActiveUsersService, ActiveUser, UserFilters } from '../services/activeUsersService';

export const useActiveUsers = (filters: UserFilters = {}) => {
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ActiveUsersService.getActiveUsers(filters);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const deactivateUser = async (id: string, reason: string) => {
    try {
      await ActiveUsersService.deactivateUser(id, reason);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate user');
    }
  };

  const activateUser = async (id: string, reason: string) => {
    try {
      await ActiveUsersService.activateUser(id, reason);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate user');
    }
  };

  const forceLogoutUser = async (id: string, reason: string) => {
    try {
      await ActiveUsersService.forceLogoutUser(id, reason);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to force logout user');
    }
  };

  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    deactivateUser,
    activateUser,
    forceLogoutUser
  };
};
```

---

## Implementation Steps

### Step 1: Database Setup
1. Run the SQL migrations to create new tables
2. Update the existing `users` table with new columns
3. Test the database schema with sample data

### Step 2: Backend Implementation
1. Create the `ActiveUsersService` class
2. Create the `ActiveUsersController` class
3. Create the `activeUsers.routes.ts` file
4. Add the routes to your main router
5. Test all endpoints with Postman or similar

### Step 3: Frontend Integration
1. Create the `activeUsersService.ts` API service
2. Create the `useActiveUsers.ts` React hook
3. Update your `ActiveUsers.tsx` component to use the new service
4. Add real-time updates using polling or WebSocket

### Step 4: Testing
1. Test user filtering and search functionality
2. Test user activation/deactivation
3. Test force logout functionality
4. Test export functionality
5. Test real-time updates

### Step 5: Security & Performance
1. Add rate limiting to prevent abuse
2. Add caching for frequently accessed data
3. Implement proper error handling
4. Add audit logging for all actions
5. Test with different user roles and permissions

---

## Additional Considerations

### Real-time Updates
For real-time updates, consider implementing:
- **WebSocket connection** for live data streaming
- **Server-Sent Events (SSE)** for simpler implementation
- **Polling** with configurable intervals (e.g., every 30 seconds)

### Performance Optimization
- Add database indexes for frequently queried columns
- Implement Redis caching for active user data
- Use database views for complex queries
- Consider pagination for large datasets

### Security Enhancements
- Add IP whitelisting for admin functions
- Implement session timeout policies
- Add two-factor authentication for sensitive operations
- Log all administrative actions for audit trails

### Monitoring & Analytics
- Track user activity patterns
- Monitor system performance
- Set up alerts for suspicious activities
- Generate usage reports

This implementation provides a solid foundation for the ActiveUsers module with proper authentication, authorization, and real-time capabilities.
