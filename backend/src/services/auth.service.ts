import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabaseClient';
import { config } from '../config/env';
import { User } from '@shared/types/database';

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

export class AuthService {
  /**
   * Authenticate user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { email, password } = credentials;

      console.log('🔍 Login attempt for email:', email);

      // Get user from database
      const { data: user, error } = await supabaseAdmin
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

      // Check if user is active
      if (!user.is_active) {
        console.log('❌ User account is inactive:', user.email);
        return {
          success: false,
          message: 'Account is deactivated. Please contact administrator.'
        };
      }

      // Check if password hash exists
      if (!user.password_hash) {
        console.log('❌ User has no password hash:', user.email);
        return {
          success: false,
          message: 'User account not properly set up. Please contact administrator.'
        };
      }

      // Verify password
      console.log('🔐 Verifying password for user:', user.email);
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      console.log('🔐 Password verification result:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('❌ Invalid password for user:', user.email);
        return {
          success: false,
          message: 'Invalid password'
        };
      }

      // Generate JWT token
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role
      };

      const token = jwt.sign(tokenPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      } as jwt.SignOptions);

      // Generate refresh token
      const refreshToken = jwt.sign(
        { userId: user.id },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
      );

      // Update last login
      await supabaseAdmin
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
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Internal server error during login'
      };
    }
  }

  /**
   * Register a new user
   */
  static async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const { email, password, first_name, last_name, role = 'user', department } = userData;

      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
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

      // Hash password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Create user
      const { data: newUser, error } = await supabaseAdmin
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

      // Generate JWT token
      const tokenPayload = {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department
      };

      const token = jwt.sign(tokenPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      } as jwt.SignOptions);

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
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Internal server error during registration'
      };
    }
  }

  /**
   * Get current user information from JWT token
   */
  static async getCurrentUser(userId: string): Promise<AuthResponse> {
    try {
      const { data: user, error } = await supabaseAdmin
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
          token: '' // No token needed for getCurrentUser
        }
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        message: 'Internal server error'
      };
    }
  }

  /**
   * Refresh JWT token
   */
  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as any;
      const userId = decoded.userId;

      // Get user to ensure they still exist and are active
      const { data: user, error } = await supabaseAdmin
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

      // Generate new access token
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        department: user.department
      };

      const newToken = jwt.sign(tokenPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      } as jwt.SignOptions);

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
    } catch (error) {
      console.error('Refresh token error:', error);
      return {
        success: false,
        message: 'Invalid refresh token'
      };
    }
  }

  /**
   * Logout user (invalidate token on client side)
   */
  static async logout(userId: string): Promise<AuthResponse> {
    try {
      // Update last logout time
      await supabaseAdmin
        .from('users')
        .update({ last_logout: new Date().toISOString() })
        .eq('id', userId);

      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Internal server error during logout'
      };
    }
  }
}
