import { Request, Response } from 'express';
import { UsersService } from '../services/users.service';
import { AuthenticatedRequest } from '../middleware/auth';

export class UsersController {
  // GET /api/v1/users
  static async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters = {
        search: req.query.search as string,
        role: req.query.role as string,
        status: req.query.status as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sort_by: req.query.sort_by as string || 'created_at',
        sort_order: (req.query.sort_order as 'asc' | 'desc') || 'desc'
      };

      const result = await UsersService.getUsers(filters);

      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch users'
      });
    }
  }

  // GET /api/v1/users/:id
  static async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UsersService.getUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch user'
      });
    }
  }

  // POST /api/v1/users
  static async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userData = req.body;
      const createdBy = req.user?.userId;

      if (!createdBy) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const user = await UsersService.createUser(userData, createdBy);

      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create user'
      });
    }
  }

  // PUT /api/v1/users/:id
  static async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedBy = req.user?.userId;

      if (!updatedBy) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const user = await UsersService.updateUser(id, updates, updatedBy);

      res.json({
        success: true,
        data: user,
        message: 'User updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update user'
      });
    }
  }

  // PATCH /api/v1/users/:id/activate
  static async activateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const changedBy = req.user?.userId;

      if (!changedBy) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const user = await UsersService.toggleUserStatus(id, true, changedBy);

      res.json({
        success: true,
        data: user,
        message: 'User activated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to activate user'
      });
    }
  }

  // PATCH /api/v1/users/:id/deactivate
  static async deactivateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const changedBy = req.user?.userId;

      if (!changedBy) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const user = await UsersService.toggleUserStatus(id, false, changedBy);

      res.json({
        success: true,
        data: user,
        message: 'User deactivated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to deactivate user'
      });
    }
  }

  // GET /api/v1/users/stats
  static async getUserStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await UsersService.getUserStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch user statistics'
      });
    }
  }
}