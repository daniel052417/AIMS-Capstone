import { supabaseAdmin } from '../config/supabaseClient';
import type { 
  User, 
  Role, 
  Permission, 
  AuditLog, 
  AppSettings, 
  SystemSetting,
  StaffWithAccounts,
  GetUserAccessibleComponentsResult,
  GetUserPermissionsResult
} from '@shared/types/database';

export class SuperAdminService {
  // Dashboard Data
  static async getDashboardData() {
    try {
      const [
        usersResult,
        staffResult,
        rolesResult,
        permissionsResult,
        auditLogsResult
      ] = await Promise.all([
        supabaseAdmin.from('users').select('id', { count: 'exact' }),
        supabaseAdmin.from('staff').select('id', { count: 'exact' }),
        supabaseAdmin.from('roles').select('id', { count: 'exact' }),
        supabaseAdmin.from('permissions').select('id', { count: 'exact' }),
        supabaseAdmin.from('audit_logs').select('id', { count: 'exact' })
      ]);

      return {
        users: { total: usersResult.count || 0 },
        staff: { total: staffResult.count || 0 },
        roles: { total: rolesResult.count || 0 },
        permissions: { total: permissionsResult.count || 0 },
        auditLogs: { total: auditLogsResult.count || 0 },
        systemHealth: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch dashboard data: ${error}`);
    }
  }

  // Users Management
  static async getUsers(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          is_active,
          last_login,
          created_at,
          updated_at
        `);

      // Apply filters
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        users: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error}`);
    }
  }

  static async getUserById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          avatar_url,
          role,
          is_active,
          last_login,
          staff_id,
          username,
          created_at,
          updated_at
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error}`);
    }
  }

  static async createUser(userData: Partial<User>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create user: ${error}`);
    }
  }

  static async updateUser(id: string, userData: Partial<User>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update(userData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update user: ${error}`);
    }
  }

  static async deleteUser(id: string) {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete user: ${error}`);
    }
  }

  // Roles Management
  static async getRoles() {
    try {
      const { data, error } = await supabaseAdmin
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch roles: ${error}`);
    }
  }

  static async createRole(roleData: Partial<Role>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('roles')
        .insert([roleData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create role: ${error}`);
    }
  }

  static async updateRole(id: string, roleData: Partial<Role>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('roles')
        .update(roleData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update role: ${error}`);
    }
  }

  static async deleteRole(id: string) {
    try {
      const { error } = await supabaseAdmin
        .from('roles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete role: ${error}`);
    }
  }

  // Permissions Management
  static async getPermissions() {
    try {
      const { data, error } = await supabaseAdmin
        .from('permissions')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch permissions: ${error}`);
    }
  }

  static async createPermission(permissionData: Partial<Permission>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('permissions')
        .insert([permissionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create permission: ${error}`);
    }
  }

  static async updatePermission(id: string, permissionData: Partial<Permission>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('permissions')
        .update(permissionData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update permission: ${error}`);
    }
  }

  static async deletePermission(id: string) {
    try {
      const { error } = await supabaseAdmin
        .from('permissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete permission: ${error}`);
    }
  }

  // Staff Management
  static async getStaffWithAccounts(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('staff_with_accounts')
        .select('*');

      // Apply filters
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      if (filters.department) {
        query = query.eq('department', filters.department);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        staff: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch staff with accounts: ${error}`);
    }
  }

  // Settings Management
  static async getAppSettings() {
    try {
      const { data, error } = await supabaseAdmin
        .from('app_settings')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch app settings: ${error}`);
    }
  }

  static async updateAppSettings(settingsData: Partial<AppSettings>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('app_settings')
        .update(settingsData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update app settings: ${error}`);
    }
  }

  static async getSystemSettings() {
    try {
      const { data, error } = await supabaseAdmin
        .from('system_settings')
        .select('*')
        .order('key');

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch system settings: ${error}`);
    }
  }

  static async updateSystemSetting(key: string, value: any, updatedBy: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('system_settings')
        .upsert({
          key,
          value,
          updated_by: updatedBy
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update system setting: ${error}`);
    }
  }

  // Audit Logs
  static async getAuditLogs(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('audit_logs')
        .select('*');

      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.resource) {
        query = query.eq('resource', filters.resource);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        logs: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch audit logs: ${error}`);
    }
  }

  static async getAuditLogById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch audit log: ${error}`);
    }
  }

  // Database Functions
  static async getUserAccessibleComponents(userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_user_accessible_components', { user_uuid: userId });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to get user accessible components: ${error}`);
    }
  }

  static async getUserPermissions(userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_user_permissions', { user_uuid: userId });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to get user permissions: ${error}`);
    }
  }

  static async userHasPermission(userId: string, permissionName: string) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('user_has_permission', { 
          user_uuid: userId, 
          permission_name: permissionName 
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to check user permission: ${error}`);
    }
  }

  // System Health
  static async getSystemHealth() {
    try {
      // Check database connection
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1);

      return {
        status: dbError ? 'unhealthy' : 'healthy',
        database: dbError ? 'disconnected' : 'connected',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'error',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
        error: error
      };
    }
  }

  static async getSystemStats() {
    try {
      const [
        usersResult,
        staffResult,
        rolesResult,
        permissionsResult,
        auditLogsResult
      ] = await Promise.all([
        supabaseAdmin.from('users').select('id', { count: 'exact' }),
        supabaseAdmin.from('staff').select('id', { count: 'exact' }),
        supabaseAdmin.from('roles').select('id', { count: 'exact' }),
        supabaseAdmin.from('permissions').select('id', { count: 'exact' }),
        supabaseAdmin.from('audit_logs').select('id', { count: 'exact' })
      ]);

      return {
        users: usersResult.count || 0,
        staff: staffResult.count || 0,
        roles: rolesResult.count || 0,
        permissions: permissionsResult.count || 0,
        auditLogs: auditLogsResult.count || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to fetch system stats: ${error}`);
    }
  }
}