
export interface Role {
    id: string;
    role_name: string;
    description?: string;
  }
  
  import { apiClient } from '../api/apiClient';

export class RBACService {
    /**
     * Fetch roles for a given user ID
     * @param userId string
     * @returns Promise<Role[]>
     */
    static async getUserRoles(userId: string): Promise<Role[]> {
      try {
        const response = await apiClient.get(`/rbac/users/${userId}/roles`);
        if (response.success && response.data && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      } catch (error) {
        console.error('RBACService.getUserRoles error:', error);
        return [];
      }
    }
  
    /**
     * Fetch all roles
     */
    static async getAllRoles(): Promise<Role[]> {
      try {
        const response = await apiClient.get('/rbac/roles');
        if (response.success && response.data && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      } catch (error) {
        console.error('RBACService.getAllRoles error:', error);
        return [];
      }
    }

    /**
     * Get effective permissions for a user
     * @param userId string
     * @returns Promise<string[]>
     */
    static async getUserEffectivePermissions(userId: string): Promise<string[]> {
      try {
        const response = await apiClient.get(`/rbac/users/${userId}/permissions`);
        if (response.success && response.data && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      } catch (error) {
        console.error('RBACService.getUserEffectivePermissions error:', error);
        return [];
      }
    }
  }
  