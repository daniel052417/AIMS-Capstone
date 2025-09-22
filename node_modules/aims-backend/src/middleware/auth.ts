import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/jwt';
import { supabaseAdmin } from '../config/supabaseClient';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    roles: string[];
    branchId?: string;
  };
}
export function requirePermission(permissions: string[]) {
  return (req: any, res: Response, next: NextFunction) => {
    // adjust to your req.user structure
    const userPermissions: string[] = req.user?.permissions || [];

    const hasAll = permissions.every(p => userPermissions.includes(p));
    if (!hasAll) {
      return res.status(403).json({ success: false, message: 'Forbidden: missing permission(s)' });
    }

    next();
  };
}
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if user has any of the allowed roles
    const hasRequiredRole = allowedRoles.some(role => req.user!.roles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required one of these roles: ${allowedRoles.join(', ')}`, 
      });
    }

    next();
  };
};

// Helper function to check if user has specific role
export const hasRole = (req: AuthenticatedRequest, role: string): boolean => {
  return req.user?.roles.includes(role) || false;
};

// Helper function to check if user has any of the specified roles
export const hasAnyRole = (req: AuthenticatedRequest, roles: string[]): boolean => {
  return req.user?.roles ? roles.some(role => req.user!.roles.includes(role)) : false;
};

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);
    
    // Verify token
    const payload = JWTUtils.verifyToken(token);
    
    // Get user from database to ensure they're still active
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, is_active, branch_id')
      .eq('id', payload.userId)
      .single();

    if (error || !user || !user.is_active) {
      res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
      return;
    }

    // Fetch user roles from user_roles and roles tables
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select(`
        roles (
          name
        )
      `)
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user roles',
      });
      return;
    }

    // Extract role names from the joined data
    type UserRoleRecord = {
      roles: { name: string } | { name: string }[] | null;
    };
    
    const typedUserRoles = userRoles as UserRoleRecord[];
    
    const roles =
      typedUserRoles?.flatMap(ur =>
        Array.isArray(ur.roles) ? ur.roles.map(r => r.name) : [ur.roles?.name]
      ).filter((name): name is string => Boolean(name)) ?? [];
    

    // Attach user info with roles to request
    req.user = {
      userId: user.id,
      email: user.email,
      roles,
      branchId: user.branch_id,
    };

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid token',
    });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      next();
      return;
    }

    const token = JWTUtils.extractTokenFromHeader(authHeader);
    const payload = JWTUtils.verifyToken(token);
    
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, is_active, branch_id')
      .eq('id', payload.userId)
      .single();

    if (user && user.is_active) {
      // Fetch user roles
      const { data: userRoles } = await supabaseAdmin
        .from('user_roles')
        .select(`
          roles (
            name
          )
        `)
        .eq('user_id', user.id);

        type UserRoleRecord = {
          roles: { name: string } | { name: string }[] | null;
        };
        
        const typedUserRoles = userRoles as UserRoleRecord[];
        
        const roles =
          typedUserRoles?.flatMap(ur =>
            Array.isArray(ur.roles) ? ur.roles.map(r => r.name) : [ur.roles?.name]
          ).filter((name): name is string => Boolean(name)) ?? [];
        
      req.user = {
        userId: user.id,
        email: user.email,
        roles,
        branchId: user.branch_id,
      };
    }

    next();
  } catch (error) {
    // If token is invalid, continue without user info
    next();
  }
};