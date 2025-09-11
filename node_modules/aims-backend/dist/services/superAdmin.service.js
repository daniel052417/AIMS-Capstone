"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminService = void 0;
const supabaseClient_1 = require("../config/supabaseClient");
class SuperAdminService {
    static async getDashboardData() {
        try {
            const [usersResult, staffResult, rolesResult, permissionsResult, auditLogsResult] = await Promise.all([
                supabaseClient_1.supabaseAdmin.from('users').select('id', { count: 'exact' }),
                supabaseClient_1.supabaseAdmin.from('staff').select('id', { count: 'exact' }),
                supabaseClient_1.supabaseAdmin.from('roles').select('id', { count: 'exact' }),
                supabaseClient_1.supabaseAdmin.from('permissions').select('id', { count: 'exact' }),
                supabaseClient_1.supabaseAdmin.from('audit_logs').select('id', { count: 'exact' })
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
        }
        catch (error) {
            throw new Error(`Failed to fetch dashboard data: ${error}`);
        }
    }
    static async getUsers(filters = {}) {
        try {
            let query = supabaseClient_1.supabaseAdmin
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
            if (filters.search) {
                query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
            }
            if (filters.role) {
                query = query.eq('role', filters.role);
            }
            if (filters.is_active !== undefined) {
                query = query.eq('is_active', filters.is_active);
            }
            const page = filters.page || 1;
            const limit = filters.limit || 10;
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to).order('created_at', { ascending: false });
            const { data, error, count } = await query;
            if (error)
                throw error;
            return {
                users: data || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    pages: Math.ceil((count || 0) / limit)
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch users: ${error}`);
        }
    }
    static async getUserById(id) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
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
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch user: ${error}`);
        }
    }
    static async createUser(userData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('users')
                .insert([userData])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to create user: ${error}`);
        }
    }
    static async updateUser(id, userData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('users')
                .update(userData)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to update user: ${error}`);
        }
    }
    static async deleteUser(id) {
        try {
            const { error } = await supabaseClient_1.supabaseAdmin
                .from('users')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return { success: true };
        }
        catch (error) {
            throw new Error(`Failed to delete user: ${error}`);
        }
    }
    static async getRoles() {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('roles')
                .select('*')
                .order('name');
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch roles: ${error}`);
        }
    }
    static async createRole(roleData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('roles')
                .insert([roleData])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to create role: ${error}`);
        }
    }
    static async updateRole(id, roleData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('roles')
                .update(roleData)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to update role: ${error}`);
        }
    }
    static async deleteRole(id) {
        try {
            const { error } = await supabaseClient_1.supabaseAdmin
                .from('roles')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return { success: true };
        }
        catch (error) {
            throw new Error(`Failed to delete role: ${error}`);
        }
    }
    static async getPermissions() {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('permissions')
                .select('*')
                .order('name');
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch permissions: ${error}`);
        }
    }
    static async createPermission(permissionData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('permissions')
                .insert([permissionData])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to create permission: ${error}`);
        }
    }
    static async updatePermission(id, permissionData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('permissions')
                .update(permissionData)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to update permission: ${error}`);
        }
    }
    static async deletePermission(id) {
        try {
            const { error } = await supabaseClient_1.supabaseAdmin
                .from('permissions')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return { success: true };
        }
        catch (error) {
            throw new Error(`Failed to delete permission: ${error}`);
        }
    }
    static async getStaffWithAccounts(filters = {}) {
        try {
            let query = supabaseClient_1.supabaseAdmin
                .from('staff_with_accounts')
                .select('*');
            if (filters.search) {
                query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
            }
            if (filters.department) {
                query = query.eq('department', filters.department);
            }
            if (filters.is_active !== undefined) {
                query = query.eq('is_active', filters.is_active);
            }
            const page = filters.page || 1;
            const limit = filters.limit || 10;
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to).order('created_at', { ascending: false });
            const { data, error, count } = await query;
            if (error)
                throw error;
            return {
                staff: data || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    pages: Math.ceil((count || 0) / limit)
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch staff with accounts: ${error}`);
        }
    }
    static async getAppSettings() {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('app_settings')
                .select('*')
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch app settings: ${error}`);
        }
    }
    static async updateAppSettings(settingsData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('app_settings')
                .update(settingsData)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to update app settings: ${error}`);
        }
    }
    static async getSystemSettings() {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('system_settings')
                .select('*')
                .order('key');
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch system settings: ${error}`);
        }
    }
    static async updateSystemSetting(key, value, updatedBy) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('system_settings')
                .upsert({
                key,
                value,
                updated_by: updatedBy
            })
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to update system setting: ${error}`);
        }
    }
    static async getAuditLogs(filters = {}) {
        try {
            let query = supabaseClient_1.supabaseAdmin
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
            const page = filters.page || 1;
            const limit = filters.limit || 10;
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to).order('created_at', { ascending: false });
            const { data, error, count } = await query;
            if (error)
                throw error;
            return {
                logs: data || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    pages: Math.ceil((count || 0) / limit)
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch audit logs: ${error}`);
        }
    }
    static async getAuditLogById(id) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('audit_logs')
                .select('*')
                .eq('id', id)
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch audit log: ${error}`);
        }
    }
    static async getUserAccessibleComponents(userId) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .rpc('get_user_accessible_components', { user_uuid: userId });
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to get user accessible components: ${error}`);
        }
    }
    static async getUserPermissions(userId) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .rpc('get_user_permissions', { user_uuid: userId });
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to get user permissions: ${error}`);
        }
    }
    static async userHasPermission(userId, permissionName) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .rpc('user_has_permission', {
                user_uuid: userId,
                permission_name: permissionName
            });
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to check user permission: ${error}`);
        }
    }
    static async getSystemHealth() {
        try {
            const { error: dbError } = await supabaseClient_1.supabaseAdmin
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
        }
        catch (error) {
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
            const [usersResult, staffResult, rolesResult, permissionsResult, auditLogsResult] = await Promise.all([
                supabaseClient_1.supabaseAdmin.from('users').select('id', { count: 'exact' }),
                supabaseClient_1.supabaseAdmin.from('staff').select('id', { count: 'exact' }),
                supabaseClient_1.supabaseAdmin.from('roles').select('id', { count: 'exact' }),
                supabaseClient_1.supabaseAdmin.from('permissions').select('id', { count: 'exact' }),
                supabaseClient_1.supabaseAdmin.from('audit_logs').select('id', { count: 'exact' })
            ]);
            return {
                users: usersResult.count || 0,
                staff: staffResult.count || 0,
                roles: rolesResult.count || 0,
                permissions: permissionsResult.count || 0,
                auditLogs: auditLogsResult.count || 0,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch system stats: ${error}`);
        }
    }
}
exports.SuperAdminService = SuperAdminService;
//# sourceMappingURL=superAdmin.service.js.map