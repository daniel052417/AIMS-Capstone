import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

// Role-based access control middleware
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
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
      return;
    }

    next();
  };
};

// Permission-based access control middleware
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
        message: 'Insufficient permissions',
        required: requiredPermission,
        current: req.user.permissions
      });
      return;
    }

    next();
  };
};

// Multiple permissions (user must have ALL permissions)
export const requireAllPermissions = (requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const hasAllPermissions = requiredPermissions.every(permission =>
      req.user!.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: requiredPermissions,
        current: req.user.permissions
      });
      return;
    }

    next();
  };
};

// Multiple permissions (user must have ANY permission)
export const requireAnyPermission = (requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const hasAnyPermission = requiredPermissions.some(permission =>
      req.user!.permissions.includes(permission)
    );

    if (!hasAnyPermission) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: requiredPermissions,
        current: req.user.permissions
      });
      return;
    }

    next();
  };
};

//Department-based access control
export const requireDepartment = (allowedDepartments: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!req.user.department || !allowedDepartments.includes(req.user.department)) {
      res.status(403).json({
        success: false,
        message: 'Access denied for your department',
        required: allowedDepartments,
        current: req.user.department
      });
      return;
    }

    next();
  };
};

