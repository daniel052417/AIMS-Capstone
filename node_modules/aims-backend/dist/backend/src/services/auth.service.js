"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabaseClient_1 = require("../config/supabaseClient");
const env_1 = require("../config/env");
class AuthService {
    static async login(credentials) {
        try {
            const { email, password } = credentials;
            console.log('🔍 Login attempt for email:', email);
            const { data: user, error } = await supabaseClient_1.supabaseAdmin
                .from('users')
                .select(`
          id,
          email,
          password_hash,
          first_name,
          last_name,
          role,
          is_active,
          created_at,
          updated_at
        `)
                .eq('email', email.toLowerCase())
                .single();
            console.log('📊 Supabase query result:', {
                hasUser: !!user,
                hasError: !!error,
                errorMessage: error?.message,
                userEmail: user?.email,
                hasPasswordHash: !!user?.password_hash,
                isActive: user?.is_active
            });
            if (error) {
                console.error('❌ Supabase query error:', error);
                return {
                    success: false,
                    message: `Database error: ${error.message}`
                };
            }
            if (!user) {
                console.log('❌ User not found for email:', email);
                return {
                    success: false,
                    message: 'User not found'
                };
            }
            if (!user.is_active) {
                console.log('❌ User account is inactive:', user.email);
                return {
                    success: false,
                    message: 'Account is deactivated. Please contact administrator.'
                };
            }
            if (!user.password_hash) {
                console.log('❌ User has no password hash:', user.email);
                return {
                    success: false,
                    message: 'User account not properly set up. Please contact administrator.'
                };
            }
            console.log('🔐 Verifying password for user:', user.email);
            const isPasswordValid = await bcryptjs_1.default.compare(password, user.password_hash);
            console.log('🔐 Password verification result:', isPasswordValid);
            if (!isPasswordValid) {
                console.log('❌ Invalid password for user:', user.email);
                return {
                    success: false,
                    message: 'Invalid password'
                };
            }
            const tokenPayload = {
                userId: user.id,
                email: user.email,
                role: user.role
            };
            const token = jsonwebtoken_1.default.sign(tokenPayload, env_1.config.jwt.secret, {
                expiresIn: env_1.config.jwt.expiresIn
            });
            const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, env_1.config.jwt.secret, { expiresIn: env_1.config.jwt.refreshExpiresIn });
            await supabaseClient_1.supabaseAdmin
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', user.id);
            console.log('✅ Login successful for user:', user.email);
            return {
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        role: user.role,
                        is_active: user.is_active
                    },
                    token,
                    refreshToken
                }
            };
        }
        catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Internal server error during login'
            };
        }
    }
    static async register(userData) {
        try {
            const { email, password, first_name, last_name, role = 'user', department } = userData;
            const { data: existingUser } = await supabaseClient_1.supabaseAdmin
                .from('users')
                .select('id')
                .eq('email', email.toLowerCase())
                .single();
            if (existingUser) {
                return {
                    success: false,
                    message: 'User with this email already exists'
                };
            }
            const saltRounds = 12;
            const password_hash = await bcryptjs_1.default.hash(password, saltRounds);
            const { data: newUser, error } = await supabaseClient_1.supabaseAdmin
                .from('users')
                .insert({
                email: email.toLowerCase(),
                password_hash,
                first_name,
                last_name,
                role,
                department,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
                .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          department,
          is_active,
          created_at
        `)
                .single();
            if (error || !newUser) {
                console.error('Registration error:', error);
                return {
                    success: false,
                    message: 'Failed to create user account'
                };
            }
            const tokenPayload = {
                userId: newUser.id,
                email: newUser.email,
                role: newUser.role,
                department: newUser.department
            };
            const token = jsonwebtoken_1.default.sign(tokenPayload, env_1.config.jwt.secret, {
                expiresIn: env_1.config.jwt.expiresIn
            });
            return {
                success: true,
                message: 'Registration successful',
                data: {
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        first_name: newUser.first_name,
                        last_name: newUser.last_name,
                        role: newUser.role,
                        department: newUser.department,
                        is_active: newUser.is_active
                    },
                    token
                }
            };
        }
        catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: 'Internal server error during registration'
            };
        }
    }
    static async getCurrentUser(userId) {
        try {
            const { data: user, error } = await supabaseClient_1.supabaseAdmin
                .from('users')
                .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          department,
          is_active,
          created_at,
          updated_at,
          last_login
        `)
                .eq('id', userId)
                .single();
            if (error || !user) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }
            if (!user.is_active) {
                return {
                    success: false,
                    message: 'Account is deactivated'
                };
            }
            return {
                success: true,
                message: 'User information retrieved successfully',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        role: user.role,
                        department: user.department,
                        is_active: user.is_active
                    },
                    token: ''
                }
            };
        }
        catch (error) {
            console.error('Get current user error:', error);
            return {
                success: false,
                message: 'Internal server error'
            };
        }
    }
    static async refreshToken(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.config.jwt.secret);
            const userId = decoded.userId;
            const { data: user, error } = await supabaseClient_1.supabaseAdmin
                .from('users')
                .select('id, email, role, department, is_active')
                .eq('id', userId)
                .single();
            if (error || !user || !user.is_active) {
                return {
                    success: false,
                    message: 'Invalid refresh token'
                };
            }
            const tokenPayload = {
                userId: user.id,
                email: user.email,
                role: user.role,
                department: user.department
            };
            const newToken = jsonwebtoken_1.default.sign(tokenPayload, env_1.config.jwt.secret, {
                expiresIn: env_1.config.jwt.expiresIn
            });
            return {
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        first_name: '',
                        last_name: '',
                        role: user.role,
                        department: user.department,
                        is_active: user.is_active
                    },
                    token: newToken
                }
            };
        }
        catch (error) {
            console.error('Refresh token error:', error);
            return {
                success: false,
                message: 'Invalid refresh token'
            };
        }
    }
    static async logout(userId) {
        try {
            await supabaseClient_1.supabaseAdmin
                .from('users')
                .update({ last_logout: new Date().toISOString() })
                .eq('id', userId);
            return {
                success: true,
                message: 'Logout successful'
            };
        }
        catch (error) {
            console.error('Logout error:', error);
            return {
                success: false,
                message: 'Internal server error during logout'
            };
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map