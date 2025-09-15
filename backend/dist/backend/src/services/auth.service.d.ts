export interface LoginCredentials {
    email: string;
    password: string;
}
export interface RegisterData {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
}
export interface AuthResponse {
    success: boolean;
    message: string;
    data?: {
        user: {
            id: string;
            email: string;
            first_name: string;
            last_name: string;
            role: string;
            is_active: boolean;
        };
        token: string;
        refreshToken?: string;
    };
}
export declare class AuthService {
    static login(credentials: LoginCredentials): Promise<AuthResponse>;
    static register(userData: RegisterData): Promise<AuthResponse>;
    static getCurrentUser(userId: string): Promise<AuthResponse>;
    static refreshToken(refreshToken: string): Promise<AuthResponse>;
    static logout(userId: string): Promise<AuthResponse>;
}
//# sourceMappingURL=auth.service.d.ts.map