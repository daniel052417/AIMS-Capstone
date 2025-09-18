import { supabaseAdmin } from '../config/supabaseClient';
import { AuditLogService } from '../services/auditLog.service';
import { createAuditLog } from '../services/auditLog.service';
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
              name
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
        console.error('Failed to fetch users', error);
        throw new Error('Failed to fetch users');  // keep message generic        
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
              name
            )
          ),
          user_sessions:user_sessions!user_sessions_user_id_fkey (
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
        console.error('Failed to fetch users', error);
        throw new Error('Failed to fetch users');  // keep message generic  
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
              name
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
        query = query.eq('user_roles.roles.name', filters.role);
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
        console.error('Failed to fetch users', error);
        throw new Error('Failed to fetch users');  // keep message generic  
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
        console.error('Failed to fetch Active user stats', error);
        throw new Error('Failed to fetch Active user stats');  // keep message generic  
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
      await createAuditLog({
        userId: adminId,
        action: 'user_deactivated',
        details: `User ${userId} deactivated with reason: ${reason}`,
        timestamp: new Date()
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
      await createAuditLog({
        userId: adminId,
        action: 'user_deactivated',
        details: `User ${userId} deactivated with reason: ${reason}`,
        timestamp: new Date()
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
      await createAuditLog({
        userId: adminId,
        action: 'user_force_logout',
        details: `User ${userId} Force logged out with reason: ${reason}`,
        timestamp: new Date()
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