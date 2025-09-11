"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemStats = exports.getSystemHealth = exports.checkUserPermission = exports.getUserPermissions = exports.getUserAccessibleComponents = exports.getAuditLogById = exports.getAuditLogs = exports.getStaffWithAccounts = exports.updateSystemSetting = exports.getSystemSettings = exports.updateAppSettings = exports.getAppSettings = exports.deletePermission = exports.updatePermission = exports.createPermission = exports.getPermissions = exports.deleteRole = exports.updateRole = exports.createRole = exports.getRoles = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getUsers = exports.getAnalytics = exports.getDashboardData = void 0;
const superAdmin_service_1 = require("../services/superAdmin.service");
const getDashboardData = async (req, res) => {
    try {
        const dashboardData = await superAdmin_service_1.SuperAdminService.getDashboardData();
        res.json({
            success: true,
            data: dashboardData
        });
    }
    catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data'
        });
    }
};
exports.getDashboardData = getDashboardData;
const getAnalytics = async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                message: 'Analytics endpoint - implementation pending'
            }
        });
    }
    catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics data'
        });
    }
};
exports.getAnalytics = getAnalytics;
const getUsers = async (req, res) => {
    try {
        const filters = {
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10,
            search: req.query.search,
            role: req.query.role,
            is_active: req.query.is_active ? req.query.is_active === 'true' : undefined
        };
        const result = await superAdmin_service_1.SuperAdminService.getUsers(filters);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
};
exports.getUsers = getUsers;
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await superAdmin_service_1.SuperAdminService.getUserById(id);
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user'
        });
    }
};
exports.getUserById = getUserById;
const createUser = async (req, res) => {
    try {
        const userData = req.body;
        const user = await superAdmin_service_1.SuperAdminService.createUser(userData);
        res.status(201).json({
            success: true,
            data: user
        });
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user'
        });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userData = req.body;
        const user = await superAdmin_service_1.SuperAdminService.updateUser(id, userData);
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user'
        });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await superAdmin_service_1.SuperAdminService.deleteUser(id);
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
};
exports.deleteUser = deleteUser;
const getRoles = async (req, res) => {
    try {
        const roles = await superAdmin_service_1.SuperAdminService.getRoles();
        res.json({
            success: true,
            data: roles
        });
    }
    catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch roles'
        });
    }
};
exports.getRoles = getRoles;
const createRole = async (req, res) => {
    try {
        const roleData = req.body;
        const role = await superAdmin_service_1.SuperAdminService.createRole(roleData);
        res.status(201).json({
            success: true,
            data: role
        });
    }
    catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create role'
        });
    }
};
exports.createRole = createRole;
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const roleData = req.body;
        const role = await superAdmin_service_1.SuperAdminService.updateRole(id, roleData);
        res.json({
            success: true,
            data: role
        });
    }
    catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update role'
        });
    }
};
exports.updateRole = updateRole;
const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        await superAdmin_service_1.SuperAdminService.deleteRole(id);
        res.json({
            success: true,
            message: 'Role deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete role'
        });
    }
};
exports.deleteRole = deleteRole;
const getPermissions = async (req, res) => {
    try {
        const permissions = await superAdmin_service_1.SuperAdminService.getPermissions();
        res.json({
            success: true,
            data: permissions
        });
    }
    catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch permissions'
        });
    }
};
exports.getPermissions = getPermissions;
const createPermission = async (req, res) => {
    try {
        const permissionData = req.body;
        const permission = await superAdmin_service_1.SuperAdminService.createPermission(permissionData);
        res.status(201).json({
            success: true,
            data: permission
        });
    }
    catch (error) {
        console.error('Error creating permission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create permission'
        });
    }
};
exports.createPermission = createPermission;
const updatePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const permissionData = req.body;
        const permission = await superAdmin_service_1.SuperAdminService.updatePermission(id, permissionData);
        res.json({
            success: true,
            data: permission
        });
    }
    catch (error) {
        console.error('Error updating permission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update permission'
        });
    }
};
exports.updatePermission = updatePermission;
const deletePermission = async (req, res) => {
    try {
        const { id } = req.params;
        await superAdmin_service_1.SuperAdminService.deletePermission(id);
        res.json({
            success: true,
            message: 'Permission deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting permission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete permission'
        });
    }
};
exports.deletePermission = deletePermission;
const getAppSettings = async (req, res) => {
    try {
        const settings = await superAdmin_service_1.SuperAdminService.getAppSettings();
        res.json({
            success: true,
            data: settings
        });
    }
    catch (error) {
        console.error('Error fetching app settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch app settings'
        });
    }
};
exports.getAppSettings = getAppSettings;
const updateAppSettings = async (req, res) => {
    try {
        const settingsData = req.body;
        const settings = await superAdmin_service_1.SuperAdminService.updateAppSettings(settingsData);
        res.json({
            success: true,
            data: settings
        });
    }
    catch (error) {
        console.error('Error updating app settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update app settings'
        });
    }
};
exports.updateAppSettings = updateAppSettings;
const getSystemSettings = async (req, res) => {
    try {
        const settings = await superAdmin_service_1.SuperAdminService.getSystemSettings();
        res.json({
            success: true,
            data: settings
        });
    }
    catch (error) {
        console.error('Error fetching system settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system settings'
        });
    }
};
exports.getSystemSettings = getSystemSettings;
const updateSystemSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        const setting = await superAdmin_service_1.SuperAdminService.updateSystemSetting(key, value, req.user.id);
        res.json({
            success: true,
            data: setting
        });
    }
    catch (error) {
        console.error('Error updating system setting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update system setting'
        });
    }
};
exports.updateSystemSetting = updateSystemSetting;
const getStaffWithAccounts = async (req, res) => {
    try {
        const filters = {
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10,
            search: req.query.search,
            department: req.query.department,
            is_active: req.query.is_active ? req.query.is_active === 'true' : undefined
        };
        const result = await superAdmin_service_1.SuperAdminService.getStaffWithAccounts(filters);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching staff with accounts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch staff with accounts'
        });
    }
};
exports.getStaffWithAccounts = getStaffWithAccounts;
const getAuditLogs = async (req, res) => {
    try {
        const filters = {
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10,
            action: req.query.action,
            user_id: req.query.user_id,
            resource: req.query.resource
        };
        const result = await superAdmin_service_1.SuperAdminService.getAuditLogs(filters);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs'
        });
    }
};
exports.getAuditLogs = getAuditLogs;
const getAuditLogById = async (req, res) => {
    try {
        const { id } = req.params;
        const log = await superAdmin_service_1.SuperAdminService.getAuditLogById(id);
        res.json({
            success: true,
            data: log
        });
    }
    catch (error) {
        console.error('Error fetching audit log:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit log'
        });
    }
};
exports.getAuditLogById = getAuditLogById;
const getUserAccessibleComponents = async (req, res) => {
    try {
        const { userId } = req.params;
        const components = await superAdmin_service_1.SuperAdminService.getUserAccessibleComponents(userId);
        res.json({
            success: true,
            data: components
        });
    }
    catch (error) {
        console.error('Error fetching user accessible components:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user accessible components'
        });
    }
};
exports.getUserAccessibleComponents = getUserAccessibleComponents;
const getUserPermissions = async (req, res) => {
    try {
        const { userId } = req.params;
        const permissions = await superAdmin_service_1.SuperAdminService.getUserPermissions(userId);
        res.json({
            success: true,
            data: permissions
        });
    }
    catch (error) {
        console.error('Error fetching user permissions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user permissions'
        });
    }
};
exports.getUserPermissions = getUserPermissions;
const checkUserPermission = async (req, res) => {
    try {
        const { userId } = req.params;
        const { permissionName } = req.query;
        const hasPermission = await superAdmin_service_1.SuperAdminService.userHasPermission(userId, permissionName);
        res.json({
            success: true,
            data: { hasPermission }
        });
    }
    catch (error) {
        console.error('Error checking user permission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check user permission'
        });
    }
};
exports.checkUserPermission = checkUserPermission;
const getSystemHealth = async (req, res) => {
    try {
        const health = await superAdmin_service_1.SuperAdminService.getSystemHealth();
        res.json({
            success: true,
            data: health
        });
    }
    catch (error) {
        console.error('Error fetching system health:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system health'
        });
    }
};
exports.getSystemHealth = getSystemHealth;
const getSystemStats = async (req, res) => {
    try {
        const stats = await superAdmin_service_1.SuperAdminService.getSystemStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error fetching system stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system stats'
        });
    }
};
exports.getSystemStats = getSystemStats;
//# sourceMappingURL=superAdmin.controller.js.map