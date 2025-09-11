export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  password: string;
}

export interface UpdateUserRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  department?: string;
  is_active?: boolean;
}

export interface UserFilters {
  search?: string;
  role?: string;
  department?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

