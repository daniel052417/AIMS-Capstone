import { apiClient } from '../api/apiClient';

// ---- Types ----
export interface UserRole {
    id: string;
    name: string;        // role name
    role_name?: string;  // optional alt name if your DB returns role_name
  }
  
  export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    status?: string;      // 'active' | 'inactive'
    last_login?: string;
    roles: UserRole[];
  }
  
  // Stats for dashboard
  export interface UserStats {
    total: number;
    active: number;
    inactive: number;
    admins: number;
    staff: number;
  }
// ---- Service ----
export const UserService = {
    async getUsers(params: {
      search?: string;
      role?: string;
      status?: string;
      page?: number;
      limit?: number;
    }): Promise<{ users: User[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
      const query = new URLSearchParams({
        search: params.search || '',
        role: params.role || '',
        status: params.status || '',
        page: String(params.page ?? 1),
        limit: String(params.limit ?? 10),
      });
  
      const res = await fetch(`/api/users?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
  
    async getUserStats(): Promise<UserStats> {
      const res = await fetch('/api/users/stats');
      if (!res.ok) throw new Error('Failed to fetch user stats');
      return res.json();
    },
  
    async activateUser(id: string): Promise<void> {
      const res = await fetch(`/api/users/${id}/activate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to activate user');
    },
  
    async deactivateUser(id: string): Promise<void> {
      const res = await fetch(`/api/users/${id}/deactivate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to deactivate user');
    },
  };