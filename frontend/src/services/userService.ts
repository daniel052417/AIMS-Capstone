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

// Response types for better typing
interface GetUsersResponse {
    users: User[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ---- Service ----
export const UserService = {
    async getUsers(params: {
        search?: string;
        role?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<GetUsersResponse> {
        const query = new URLSearchParams({
            search: params.search || '',
            role: params.role || '',
            status: params.status || '',
            page: String(params.page ?? 1),
            limit: String(params.limit ?? 10),
        });

        // Use apiClient (recommended approach)
        try {
            const response = await apiClient.get<{success: boolean, data: User[], pagination: any}>(`users?${query.toString()}`);
            
            // Transform backend response to frontend expected format
            return {
                users: response.data?.data || [],
                pagination: response.data?.pagination || {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 0
                }
            };
        } catch (error) {
            console.error('Failed to fetch users:', error);
            throw new Error('Failed to fetch users');
        }
    },

    async getUserStats(): Promise<UserStats> {
        try {
            const response = await apiClient.get<UserStats>('users/stats');
            return response.data as UserStats;
        } catch (error) {
            console.error('Failed to fetch user stats:', error);
            throw new Error('Failed to fetch user stats');
        }
    },

    async activateUser(id: string): Promise<void> {
        try {
            await apiClient.patch(`users/${id}/activate`);
        } catch (error) {
            console.error('Failed to activate user:', error);
            throw new Error('Failed to activate user');
        }
    },

    async deactivateUser(id: string): Promise<void> {
        try {
            await apiClient.patch(`users/${id}/deactivate`);
        } catch (error) {
            console.error('Failed to deactivate user:', error);
            throw new Error('Failed to deactivate user');
        }
    },

    async getUserById(id: string): Promise<User> {
        try {
            const response = await apiClient.get<User>(`users/${id}`);
            return response.data as User;
        } catch (error) {
            console.error('Failed to fetch user:', error);
            throw new Error('Failed to fetch user');
        }
    },

    async createUser(userData: Partial<User>): Promise<User> {
        try {
            const response = await apiClient.post<User>('users', userData);
            return response.data as User;
        } catch (error) {
            console.error('Failed to create user:', error);
            throw new Error('Failed to create user');
        }
    },

    async updateUser(id: string, userData: Partial<User>): Promise<User> {
        try {
            const response = await apiClient.put<User>(`users/${id}`, userData);
            return response.data as User;
        } catch (error) {
            console.error('Failed to update user:', error);
            throw new Error('Failed to update user');
        }
    },
};