export interface LoginRequest {
    email: string;
    password: string;
}
export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        user: {
            id: string;
            email: string;
            first_name: string;
            last_name: string;
            role: string;
            department?: string;
            permissions: string[];
        };
        tokens: {
            access_token: string;
            refresh_token: string;
            expires_in: number;
        };
    };
}
export interface RegisterRequest {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
    department?: string;
}
export interface RefreshTokenRequest {
    refresh_token: string;
}
export interface RefreshTokenResponse {
    success: boolean;
    data: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
    };
}
export interface ForgotPasswordRequest {
    email: string;
}
export interface ResetPasswordRequest {
    token: string;
    password: string;
}
export interface ChangePasswordRequest {
    current_password: string;
    new_password: string;
}
export interface AuthUser {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    department?: string;
    permissions: string[];
    is_active: boolean;
}
export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
}
//# sourceMappingURL=auth.d.ts.map