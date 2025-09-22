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
    return response.data as MergedUserPermission[]; // Type assertion
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
  // Get permissions by categories
  static async getPermissionsByCategories(): Promise<Record<string, Permission[]>> {
    const response = await apiClient.get('/v1/permissions/categories');
    return response.data as Record<string, Permission[]>; // Type assertion
  }

  // Get all permissions
  static async getAllPermissions(): Promise<Permission[]> {
    const response = await apiClient.get('/v1/permissions');
    return response.data as Permission[]; // Type assertion
  }

  // Get user permission statistics
  static async getUserPermissionStats(userId: string): Promise<UserPermissionStats> {
    const response = await apiClient.get(`/v1/users/${userId}/permissions/stats`);
    return response.data as UserPermissionStats; // Type assertion
  }

  // Remove a specific permission
  static async removeUserPermission(userId: string, permissionId: string): Promise<void> {
    await apiClient.delete(`/v1/permissions/user/${userId}/${permissionId}`);
  }
}