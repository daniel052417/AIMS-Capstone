import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { supabaseAdmin } from '../config/supabaseClient';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    // Get user details from Supabase
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        updated_at
      `)
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
      return;
    }

    if (!user.is_active) {
      res.status(401).json({
        success: false,
        message: 'User account is inactive'
      });
      return;
    }

    // Get user permissions based on role
    const { data: permissions } = await supabaseAdmin
      .from('role_permissions')
      .select('permission')
      .eq('role', user.role);

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: permissions?.map(p => p.permission) || []
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    // If token exists, try to authenticate
    await authenticateToken(req, res, next);
  } catch (error) {
    // If authentication fails, continue without user context
    next();
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

export const requirePermission = (requiredPermission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!req.user.permissions.includes(requiredPermission)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};
