import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabaseClient';
import { AuthenticatedRequest } from '../middleware/auth';
import { SuperAdminService } from '../services/superAdmin.service';

export const getDashboardData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const dashboardData = await SuperAdminService.getDashboardData();
    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
    });
  }
};

export const getAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // TODO: Implement analytics data fetching
    res.json({
      success: true,
      data: {
        message: 'Analytics endpoint - implementation pending',
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
    });
  }
};

export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
      search: req.query.search as string,
      role: req.query.role as string,
      is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
    };

    const result = await SuperAdminService.getUsers(filters);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
};

export const getUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await SuperAdminService.getUserById(id);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
    });
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userData = req.body;
    const user = await SuperAdminService.createUser(userData);
    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
    });
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userData = req.body;
    const user = await SuperAdminService.updateUser(id, userData);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
    });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await SuperAdminService.deleteUser(id);
    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
};

// Role management methods
export const getRoles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const roles = await SuperAdminService.getRoles();
    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roles',
    });
  }
};

export const createRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const roleData = req.body;
    const role = await SuperAdminService.createRole(roleData);
    res.status(201).json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create role',
    });
  }
};

export const updateRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const roleData = req.body;
    const role = await SuperAdminService.updateRole(id, roleData);
    res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role',
    });
  }
};

export const deleteRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await SuperAdminService.deleteRole(id);
    res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete role',
    });
  }
};

// Permission management methods
export const getPermissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const permissions = await SuperAdminService.getPermissions();
    res.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions',
    });
  }
};

export const createPermission = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const permissionData = req.body;
    const permission = await SuperAdminService.createPermission(permissionData);
    res.status(201).json({
      success: true,
      data: permission,
    });
  } catch (error) {
    console.error('Error creating permission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create permission',
    });
  }
};

export const updatePermission = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const permissionData = req.body;
    const permission = await SuperAdminService.updatePermission(id, permissionData);
    res.json({
      success: true,
      data: permission,
    });
  } catch (error) {
    console.error('Error updating permission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update permission',
    });
  }
};

export const deletePermission = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await SuperAdminService.deletePermission(id);
    res.json({
      success: true,
      message: 'Permission deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting permission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete permission',
    });
  }
};

// Settings management
export const getAppSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const settings = await SuperAdminService.getAppSettings();
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching app settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch app settings',
    });
  }
};

export const updateAppSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const settingsData = req.body;
    const settings = await SuperAdminService.updateAppSettings(settingsData);
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error updating app settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update app settings',
    });
  }
};

export const getSystemSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const settings = await SuperAdminService.getSystemSettings();
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings',
    });
  }
};

export const updateSystemSetting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const setting = await SuperAdminService.updateSystemSetting(key, value, req.user!.id);
    res.json({
      success: true,
      data: setting,
    });
  } catch (error) {
    console.error('Error updating system setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system setting',
    });
  }
};

// Staff Management
export const getStaffWithAccounts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
      search: req.query.search as string,
      department: req.query.department as string,
      is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
    };

    const result = await SuperAdminService.getStaffWithAccounts(filters);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching staff with accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff with accounts',
    });
  }
};

// Audit logs
export const getAuditLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
      action: req.query.action as string,
      user_id: req.query.user_id as string,
      resource: req.query.resource as string,
    };

    const result = await SuperAdminService.getAuditLogs(filters);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
    });
  }
};

export const getAuditLogById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const log = await SuperAdminService.getAuditLogById(id);
    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
    });
  }
};

// Database Functions
export const getUserAccessibleComponents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const components = await SuperAdminService.getUserAccessibleComponents(userId);
    res.json({
      success: true,
      data: components,
    });
  } catch (error) {
    console.error('Error fetching user accessible components:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user accessible components',
    });
  }
};

export const getUserPermissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const permissions = await SuperAdminService.getUserPermissions(userId);
    res.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user permissions',
    });
  }
};

export const checkUserPermission = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { permissionName } = req.query;
    const hasPermission = await SuperAdminService.userHasPermission(userId, permissionName as string);
    res.json({
      success: true,
      data: { hasPermission },
    });
  } catch (error) {
    console.error('Error checking user permission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check user permission',
    });
  }
};

// System health and stats
export const getSystemHealth = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const health = await SuperAdminService.getSystemHealth();
    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system health',
    });
  }
};

export const getSystemStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stats = await SuperAdminService.getSystemStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system stats',
    });
  }
};
