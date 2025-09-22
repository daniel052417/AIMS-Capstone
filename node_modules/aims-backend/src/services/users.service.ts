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