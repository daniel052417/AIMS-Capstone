import { supabaseAdmin } from '../config/supabaseClient';
import { AuditService } from './audit.service';
import { RBACResponse } from '../types/rbac';
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

  static async getRoles(includeStats: boolean = false): Promise<Role[]> {
    interface RoleWithCounts extends Role {
      user_count?: number;
      permission_count?: number;
    }
    const { data: roles, error } = await supabaseAdmin
  .from('roles') // no generics here
  .select('*, user_count:user_roles(count), permission_count:role_permissions(count)')
  .order('display_name');

    if (error) {
    throw new Error(`Failed to fetch roles: ${error.message}`);
    }

    return (roles as RoleWithCounts[]) ?? [];
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
  static async createPermission(name: string, resource: string, action: string, description?: string): Promise<RBACResponse> {
    try {
      const { data: permission, error } = await supabaseAdmin
        .from('permissions')
        .insert({
          name,
          resource,
          action,
          description,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Permission created successfully',
        data: permission,
      };
    } catch (error: any) {
      console.error('Create permission error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create permission',
      };
    }
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
  // User Role Management
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
        data: userRoles,
      };
    } catch (error: any) {
      console.error('Get user roles error:', error);
      return {
        success: false,
        message: error.message || 'Failed to retrieve user roles',
      };
    }
  }

  // Role Permission Management
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
      permissions?.forEach((userRole: any) => {
        userRole.roles?.role_permissions?.forEach((rolePermission: any) => {
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
    const mappedUsersPerRole = (usersPerRole || []).map((row: any) => ({
      role_id: row.id,                              // rename id → role_id
      role_name: row.role_name,
      user_count: Array.isArray(row.user_count) && row.user_count.length > 0
        ? row.user_count[0].count                  // extract number from array
        : 0
    }));
    
    return {
      total_roles: totalRoles || 0,
      system_roles: systemRoles || 0,
      custom_roles: customRoles || 0,
      total_permissions: totalPermissions || 0,
      active_permissions: activePermissions || 0,
      users_per_role: mappedUsersPerRole
    };
    
  }
}
