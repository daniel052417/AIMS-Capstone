import { supabaseAdmin } from '../config/supabaseClient';
import { 
  Role, 
  Permission, 
  UserRole, 
  RolePermission, 
  UserWithRoles, 
  RBACResponse,
  RolePermissionAudit,
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
          is_system_role: isSystemRole,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Role created successfully',
        data: role,
      };
    } catch (error: any) {
      console.error('Create role error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create role',
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
        data: roles,
      };
    } catch (error: any) {
      console.error('Get roles error:', error);
      return {
        success: false,
        message: error.message || 'Failed to retrieve roles',
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
        data: role,
      };
    } catch (error: any) {
      console.error('Update role error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update role',
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
        message: 'Role deleted successfully',
      };
    } catch (error: any) {
      console.error('Delete role error:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete role',
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
        data: permissions,
      };
    } catch (error: any) {
      console.error('Get permissions error:', error);
      return {
        success: false,
        message: error.message || 'Failed to retrieve permissions',
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
          message: 'User not found or inactive',
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
          message: 'Role not found',
        };
      }

      // Assign role to user
      const { error: assignError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId,
        });

      if (assignError) {
        if (assignError.code === '23505') { // Unique constraint violation
          return {
            success: false,
            message: 'User already has this role',
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
          granted_by: grantedBy,
        });

      return {
        success: true,
        message: 'Role assigned successfully',
      };
    } catch (error: any) {
      console.error('Assign role error:', error);
      return {
        success: false,
        message: error.message || 'Failed to assign role',
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
          revoked_by: revokedBy,
        });

      return {
        success: true,
        message: 'Role removed successfully',
      };
    } catch (error: any) {
      console.error('Remove role error:', error);
      return {
        success: false,
        message: error.message || 'Failed to remove role',
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
  static async assignPermissionToRole(roleId: string, permissionId: string, grantedBy: string): Promise<RBACResponse> {
    try {
      const { error } = await supabaseAdmin
        .from('role_permissions')
        .insert({
          role_id: roleId,
          permission_id: permissionId,
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return {
            success: false,
            message: 'Role already has this permission',
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
          granted_by: grantedBy,
        });

      return {
        success: true,
        message: 'Permission assigned to role successfully',
      };
    } catch (error: any) {
      console.error('Assign permission error:', error);
      return {
        success: false,
        message: error.message || 'Failed to assign permission',
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
          revoked_by: revokedBy,
        });

      return {
        success: true,
        message: 'Permission removed from role successfully',
      };
    } catch (error: any) {
      console.error('Remove permission error:', error);
      return {
        success: false,
        message: error.message || 'Failed to remove permission',
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
}