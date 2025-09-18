import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ActiveUsersService } from '../services/activeUsers.service';
import { asyncHandler } from '../middleware/errorHandler';

export class ActiveUsersController {
  // Get all users with filtering
  static getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { status, role, search, page = 1, limit = 10 } = req.query;
    
    const filters = {
      status: status as string,
      role: role as string,
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await ActiveUsersService.getUsers(filters);
    
    res.json({
      success: true,
      data: result
    });
  });

  // Get specific user details
  static getUserById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const user = await ActiveUsersService.getUserById(id);
    
    res.json({
      success: true,
      data: user
    });
  });

  // Deactivate user
  static deactivateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    await ActiveUsersService.deactivateUser(id, reason, req.user!.userId);
    
    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  });

  // Activate user
  static activateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    await ActiveUsersService.activateUser(id, reason, req.user!.userId);
    
    res.json({
      success: true,
      message: 'User activated successfully'
    });
  });

  // Get active users
  static getActiveUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { status = 'online', role, search, page = 1, limit = 20 } = req.query;
    
    const filters = {
      status: status as string,
      role: role as string,
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await ActiveUsersService.getActiveUsers(filters);
    
    res.json({
      success: true,
      data: result
    });
  });

  // Get active users statistics
  static getActiveUsersStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await ActiveUsersService.getActiveUsersStats();
    
    res.json({
      success: true,
      data: stats
    });
  });

  // Export active users data
  static exportActiveUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { format = 'csv', status, role } = req.query;
    
    const filters = {
      status: status as string,
      role: role as string
    };

    const exportData = await ActiveUsersService.exportActiveUsers(filters, format as string);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=active_users.csv');
    res.send(exportData);
  });

  // Get user sessions
  static getUserSessions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const sessions = await ActiveUsersService.getUserSessions(
      id, 
      parseInt(page as string), 
      parseInt(limit as string)
    );
    
    res.json({
      success: true,
      data: sessions
    });
  });

  // Get user activity
  static getUserActivity = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { page = 1, limit = 20, type } = req.query;
    
    const activity = await ActiveUsersService.getUserActivity(
      id, 
      parseInt(page as string), 
      parseInt(limit as string),
      type as string
    );
    
    res.json({
      success: true,
      data: activity
    });
  });

  // Force logout user
  static forceLogoutUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    await ActiveUsersService.forceLogoutUser(id, reason, req.user!.userId);
    
    res.json({
      success: true,
      message: 'User logged out successfully'
    });
  });

  // WebSocket stream for real-time updates
  static getActiveUsersStream = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // This would be implemented with WebSocket or Server-Sent Events
    res.json({
      success: true,
      message: 'WebSocket endpoint - implement with ws library'
    });
  });

  // Heartbeat endpoint for real-time updates
  static getHeartbeat = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await ActiveUsersService.getActiveUsersStats();
    
    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        stats
      }
    });
  });
}