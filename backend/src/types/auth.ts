export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    branch_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    last_login?: string;
    roles?: string[];
    role?: string; // For backward compatibility - will be the first role if only one exists
    permissions?: string[]; // All permissions assigned to user's roles
  }
  
export interface LoginRequest {
    email: string;
    password: string;
  }
  
export interface RegisterRequest {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    branch_id?: string;
  }
  
export interface AuthResponse {
    success: boolean;
    message: string;
    errors?: string[];
    data?: {
      user: User;
      access_token: string;
      refresh_token: string;
    };
  }
  
export interface JWTPayload {
    userId: string;
    email: string;
    role?: string;
    branchId?: string;
    iat?: number;
    exp?: number;
  }
  
export interface RefreshTokenRequest {
    refresh_token: string;
  }