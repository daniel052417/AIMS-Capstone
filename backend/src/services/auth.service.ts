import { supabaseAdmin, supabase } from '../config/supabaseClient';
import { JWTUtils } from '../utils/jwt';
import { PasswordUtils } from '../utils/password';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

export class AuthService {
  // Helper function to fetch permissions for given role IDs
  private static async fetchPermissionsForRoles(roleIds: string[]): Promise<string[]> {
    if (roleIds.length === 0) {
      return [];
    }

    const { data: rolePermissions, error: permissionsError } = await supabaseAdmin
      .from('role_permissions')
      .select(`
        permissions (
          name
        )
      `)
      .in('role_id', roleIds);

    if (permissionsError) {
      console.error('Error fetching role permissions:', permissionsError);
      return [];
    }

    // Extract permission names from the joined data
    type RolePermissionRecord = {
      permissions: { name: string } | { name: string }[] | null;
    };
    
    const typedRolePermissions = rolePermissions as RolePermissionRecord[];
    
    const permissions =
      typedRolePermissions?.flatMap(rp =>
        Array.isArray(rp.permissions) ? rp.permissions.map(p => p.name) : [rp.permissions?.name]
      ).filter((name): name is string => Boolean(name)) ?? [];

    // Remove duplicates
    return [...new Set(permissions)];
  }

  static async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists in public.users table
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', data.email)
        .single();

      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists',
        };
      }

      // Validate password strength
      const passwordValidation = PasswordUtils.validatePasswordStrength(data.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors,
        };
      }

      // Step 1: Create user in Supabase Auth first
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        user_metadata: {
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          branch_id: data.branch_id,
        },
      });

      if (authError) {
        return {
          success: false,
          message: authError.message || 'Failed to create user in authentication system',
        };
      }

      if (!authData.user) {
        return {
          success: false,
          message: 'Failed to create user in authentication system',
        };
      }

      // Step 2: Create user in public.users table with the same ID from auth.users
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id, // Use the same ID from auth.users
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          branch_id: data.branch_id,
          is_active: true,
        })
        .select()
        .single();

      if (userError) {
        // Rollback: Delete the auth user if public.users creation fails
        try {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        } catch (deleteError) {
          console.error('Failed to rollback auth user:', deleteError);
        }
        
        return {
          success: false,
          message: userError.message || 'Failed to create user profile',
        };
      }

      // Step 3: Fetch user roles (new users typically have no roles initially)
      const { data: userRoles, error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .select(`
          role_id,
          roles (
            id,
            name
          )
        `)
        .eq('user_id', user.id);

      // Extract role names and IDs from the joined data
      type UserRoleRecord = {
        role_id: string;
        roles: { id: string; name: string } | { id: string; name: string }[] | null;
      };
      
      const typedUserRoles = userRoles as UserRoleRecord[];
      
      const roles =
        typedUserRoles?.flatMap(ur =>
          Array.isArray(ur.roles) ? ur.roles.map(r => r.name) : [ur.roles?.name]
        ).filter((name): name is string => Boolean(name)) ?? [];

      const roleIds =
        typedUserRoles?.flatMap(ur =>
          Array.isArray(ur.roles) ? ur.roles.map(r => r.id) : [ur.roles?.id]
        ).filter((id): id is string => Boolean(id)) ?? [];

      // Fetch permissions for the user's roles
      const permissions = await this.fetchPermissionsForRoles(roleIds);

      // Add roles and permissions to user object
      const userWithRoles = {
        ...user,
        roles,
        role: roles.length === 1 ? roles[0] : undefined, // For backward compatibility
        permissions,
      };

      // Step 4: Generate JWT tokens
      const accessToken = JWTUtils.generateAccessToken({
        userId: user.id,
        email: user.email,
        branchId: user.branch_id,
      });

      const refreshToken = JWTUtils.generateRefreshToken({
        userId: user.id,
        email: user.email,
        branchId: user.branch_id,
      });

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          user: userWithRoles,
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed',
      };
    }
  }

  static async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Authenticate with Supabase Auth using anon client
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        return {
          success: false,
          message: authError.message || 'Invalid email or password',
        };
      }

      if (!authData.user) {
        return {
          success: false,
          message: 'Authentication failed',
        };
      }

      // Get user from database
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .eq('is_active', true)
        .single();

      if (userError || !user) {
        return {
          success: false,
          message: 'User not found or inactive',
        };
      }

      // Fetch user roles from user_roles and roles tables
      const { data: userRoles, error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .select(`
          role_id,
          roles (
            id,
            name
          )
        `)
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        return {
          success: false,
          message: 'Failed to fetch user roles',
        };
      }

      // Extract role names and IDs from the joined data
      type UserRoleRecord = {
        role_id: string;
        roles: { id: string; name: string } | { id: string; name: string }[] | null;
      };
      
      const typedUserRoles = userRoles as UserRoleRecord[];
      
      const roles =
        typedUserRoles?.flatMap(ur =>
          Array.isArray(ur.roles) ? ur.roles.map(r => r.name) : [ur.roles?.name]
        ).filter((name): name is string => Boolean(name)) ?? [];

      const roleIds =
        typedUserRoles?.flatMap(ur =>
          Array.isArray(ur.roles) ? ur.roles.map(r => r.id) : [ur.roles?.id]
        ).filter((id): id is string => Boolean(id)) ?? [];

      // Fetch permissions for the user's roles
      const permissions = await this.fetchPermissionsForRoles(roleIds);

      // Add roles and permissions to user object
      const userWithRoles = {
        ...user,
        roles,
        role: roles.length === 1 ? roles[0] : undefined, // For backward compatibility
        permissions,
      };

      // Update last login
      await supabaseAdmin
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // Generate tokens
      const accessToken = JWTUtils.generateAccessToken({
        userId: user.id,
        email: user.email,
        branchId: user.branch_id,
      });

      const refreshToken = JWTUtils.generateRefreshToken({
        userId: user.id,
        email: user.email,
        branchId: user.branch_id,
      });

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: userWithRoles,
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed',
      };
    }
  }

  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const payload = JWTUtils.verifyToken(refreshToken);

      // Get user from database
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', payload.userId)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        return {
          success: false,
          message: 'User not found or inactive',
        };
      }

      // Fetch user roles from user_roles and roles tables
      const { data: userRoles, error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .select(`
          role_id,
          roles (
            id,
            name
          )
        `)
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        return {
          success: false,
          message: 'Failed to fetch user roles',
        };
      }

      // Extract role names and IDs from the joined data
      type UserRoleRecord = {
        role_id: string;
        roles: { id: string; name: string } | { id: string; name: string }[] | null;
      };
      
      const typedUserRoles = userRoles as UserRoleRecord[];
      
      const roles =
        typedUserRoles?.flatMap(ur =>
          Array.isArray(ur.roles) ? ur.roles.map(r => r.name) : [ur.roles?.name]
        ).filter((name): name is string => Boolean(name)) ?? [];

      const roleIds =
        typedUserRoles?.flatMap(ur =>
          Array.isArray(ur.roles) ? ur.roles.map(r => r.id) : [ur.roles?.id]
        ).filter((id): id is string => Boolean(id)) ?? [];

      // Fetch permissions for the user's roles
      const permissions = await this.fetchPermissionsForRoles(roleIds);

      // Add roles and permissions to user object
      const userWithRoles = {
        ...user,
        roles,
        role: roles.length === 1 ? roles[0] : undefined, // For backward compatibility
        permissions,
      };

      // Generate new tokens
      const newAccessToken = JWTUtils.generateAccessToken({
        userId: user.id,
        email: user.email,
        branchId: user.branch_id,
      });

      const newRefreshToken = JWTUtils.generateRefreshToken({
        userId: user.id,
        email: user.email,
        branchId: user.branch_id,
      });

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: userWithRoles,
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
        },
      };
    } catch (error: any) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        message: 'Invalid or expired refresh token',
      };
    }
  }

  static async logout(userId: string): Promise<AuthResponse> {
    try {
      // In a real implementation, you might want to blacklist the token
      // For now, we'll just return success
      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error: any) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout failed',
      };
    }
  }
}