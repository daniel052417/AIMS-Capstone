import { Request, Response } from 'express';
import { UserPermissionsService } from '../services/userPermissions.service';
import { AuthenticatedRequest } from '../middleware/auth';

export class UserPermissionsController {
  // GET /api/v1/users/:id/permissions
  static async getUserPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const filters = {
        include_inherited: req.query.include_inherited === 'true',
        module: req.query.module as string,
        category: req.query.category as string,
        active_only: req.query.active_only !== 'false'
      };

      const permissions = await UserPermissionsService.getUserPermissions(id, filters);

      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch user permissions'
      });
    }
  }

  // PUT /api/v1/users/:id/permissions
  static async updateUserPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      const changedBy = req.user?.userId;

      if (!changedBy) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      await UserPermissionsService.updateUserPermissions(id, permissions, changedBy);

      res.json({
        success: true,
        message: 'User permissions updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update user permissions'
      });
    }
  }

  // GET /api/v1/permissions
  static async getAllPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters = {
        module: req.query.module as string,
        category: req.query.category as string,
        active_only: req.query.active_only !== 'false'
      };

      const permissions = await UserPermissionsService.getAllPermissions(filters);

      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch permissions'
      });
    }
  }

  // GET /api/v1/permissions/categories
  static async getPermissionsByCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const permissions = await UserPermissionsService.getPermissionsByCategories();

      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch permissions by categories'
      });
    }
  }

  // GET /api/v1/permissions/user/:userId
  static async getUserDirectPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const permissions = await UserPermissionsService.getUserPermissions(userId, { 
        include_inherited: false 
      });

      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch user direct permissions'
      });
    }
  }

  // PUT /api/v1/permissions/user/:userId
  static async bulkUpdateUserPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { permissions } = req.body;
      const changedBy = req.user?.userId;

      if (!changedBy) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      await UserPermissionsService.updateUserPermissions(userId, permissions, changedBy);

      res.json({
        success: true,
        message: 'User permissions updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update user permissions'
      });
    }
  }

  // DELETE /api/v1/permissions/user/:userId/:permissionId
  static async removeUserPermission(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, permissionId } = req.params;
      const changedBy = req.user?.userId;

      if (!changedBy) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      await UserPermissionsService.removeUserPermission(userId, permissionId, changedBy);

      res.json({
        success: true,
        message: 'Permission removed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove permission'
      });
    }
  }

  // GET /api/v1/users/:id/permissions/stats
  static async getUserPermissionStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const stats = await UserPermissionsService.getUserPermissionStats(id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch permission statistics'
      });
    }
  }
}