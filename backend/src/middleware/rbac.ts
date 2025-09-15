import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { RBACService } from '../services/rbac.service';

export const requirePermission = (requiredPermission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const hasPermission = await RBACService.hasPermission(req.user.userId, requiredPermission.split('.')[0], requiredPermission.split('.')[1]);
      
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${requiredPermission}`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
      });
    }
  };
};

export const requireRole = (roleName: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const hasRole = await RBACService.hasRole(req.user.userId, roleName);
      
      if (!hasRole) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roleName}`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Role check failed',
      });
    }
  };
};

export const requireAnyRole = (roleNames: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const hasAnyRole = await Promise.all(
        roleNames.map(roleName => RBACService.hasRole(req.user!.userId, roleName)),
      );

      if (!hasAnyRole.some(hasRole => hasRole)) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required one of these roles: ${roleNames.join(', ')}`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Role check failed',
      });
    }
  };
};

export const requireBranchAccess = (branchIdParam = 'branchId') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Super admins can access all branches
      const isSuperAdmin = await RBACService.hasRole(req.user.userId, 'super_admin');
      if (isSuperAdmin) {
        next();
        return;
      }

      const requestedBranchId = req.params[branchIdParam] || req.body.branch_id;
      const userBranchId = req.user.branchId;

      if (requestedBranchId && userBranchId && requestedBranchId !== userBranchId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your assigned branch',
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Branch access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Branch access check failed',
      });
    }
  };
};