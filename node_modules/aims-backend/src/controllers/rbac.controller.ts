import { Request, Response } from 'express';
import { RBACService } from '../services/rbac.service';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class RBACController {
  // Role Management
  static createRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, description, is_system_role } = req.body;
    const result = await RBACService.createRole(name, description, is_system_role);
    
    res.status(result.success ? 201 : 400).json(result);
  });

  static getRoles = asyncHandler(async (req: Request, res: Response) => {
    const result = await RBACService.getRoles();
    res.status(result.success ? 200 : 400).json(result);
  });

  static updateRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { roleId } = req.params;
    const updates = req.body;
    const result = await RBACService.updateRole(roleId, updates);
    
    res.status(result.success ? 200 : 400).json(result);
  });

  static deleteRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { roleId } = req.params;
    const result = await RBACService.deleteRole(roleId);
    
    res.status(result.success ? 200 : 400).json(result);
  });

  // Permission Management
  static createPermission = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, resource, action, description } = req.body;
    const result = await RBACService.createPermission(name, resource, action, description);
    
    res.status(result.success ? 201 : 400).json(result);
  });

  static getPermissions = asyncHandler(async (req: Request, res: Response) => {
    const result = await RBACService.getPermissions();
    res.status(result.success ? 200 : 400).json(result);
  });

  // User Role Management
  static assignRoleToUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId, roleId } = req.body;
    const grantedBy = req.user!.userId;
    const result = await RBACService.assignRoleToUser(userId, roleId, grantedBy);
    
    res.status(result.success ? 200 : 400).json(result);
  });

  static removeRoleFromUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId, roleId } = req.body;
    const revokedBy = req.user!.userId;
    const result = await RBACService.removeRoleFromUser(userId, roleId, revokedBy);
    
    res.status(result.success ? 200 : 400).json(result);
  });

  static getUserRoles = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const result = await RBACService.getUserRoles(userId);
    
    res.status(result.success ? 200 : 400).json(result);
  });

  // Role Permission Management
  static assignPermissionToRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { roleId, permissionId } = req.body;
    const grantedBy = req.user!.userId;
    const result = await RBACService.assignPermissionToRole(roleId, permissionId, grantedBy);
    
    res.status(result.success ? 200 : 400).json(result);
  });

  static removePermissionFromRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { roleId, permissionId } = req.body;
    const revokedBy = req.user!.userId;
    const result = await RBACService.removePermissionFromRole(roleId, permissionId, revokedBy);
    
    res.status(result.success ? 200 : 400).json(result);
  });

  // User Info
  static getUserPermissions = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const permissions = await RBACService.getUserPermissions(userId);
    
    res.status(200).json({
      success: true,
      message: 'User permissions retrieved successfully',
      data: permissions,
    });
  });

  static checkPermission = asyncHandler(async (req: Request, res: Response) => {
    const { userId, resource, action } = req.query;
    
    if (!userId || !resource || !action) {
      res.status(400).json({
        success: false,
        message: 'userId, resource, and action are required',
      });
      return;
    }

    const hasPermission = await RBACService.hasPermission(
      userId as string, 
      resource as string, 
      action as string,
    );
    
    res.status(200).json({
      success: true,
      message: 'Permission check completed',
      data: { hasPermission },
    });
  });
}