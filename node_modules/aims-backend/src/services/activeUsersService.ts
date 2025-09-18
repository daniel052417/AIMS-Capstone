import { apiClient } from '../../../frontend/src/api/apiClient';

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
  format?: string; 
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