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