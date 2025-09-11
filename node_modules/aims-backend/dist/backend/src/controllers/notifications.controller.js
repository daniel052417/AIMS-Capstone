"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationStats = exports.sendSystemNotification = exports.sendBulkNotification = exports.sendClientNotification = exports.deleteClientNotification = exports.updateClientNotification = exports.createClientNotification = exports.getClientNotifications = exports.deleteNotificationTemplate = exports.updateNotificationTemplate = exports.createNotificationTemplate = exports.getNotificationTemplateById = exports.getNotificationTemplates = exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.createNotification = exports.getNotifications = void 0;
const notifications_service_1 = require("../services/notifications.service");
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const filters = {
            is_read: req.query.is_read ? req.query.is_read === 'true' : undefined,
            type: req.query.type,
            date_from: req.query.date_from,
            date_to: req.query.date_to,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 25
        };
        const result = await notifications_service_1.NotificationsService.getNotifications(userId, filters);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
};
exports.getNotifications = getNotifications;
const createNotification = async (req, res) => {
    try {
        const notificationData = {
            ...req.body,
            created_at: new Date().toISOString()
        };
        const notification = await notifications_service_1.NotificationsService.createNotification(notificationData);
        res.status(201).json({
            success: true,
            data: notification,
            message: 'Notification created successfully'
        });
    }
    catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification'
        });
    }
};
exports.createNotification = createNotification;
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const notification = await notifications_service_1.NotificationsService.markAsRead(id, userId);
        res.json({
            success: true,
            data: notification,
            message: 'Notification marked as read'
        });
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read'
        });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const notifications = await notifications_service_1.NotificationsService.markAllAsRead(userId);
        res.json({
            success: true,
            data: notifications,
            message: 'All notifications marked as read'
        });
    }
    catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read'
        });
    }
};
exports.markAllAsRead = markAllAsRead;
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        await notifications_service_1.NotificationsService.deleteNotification(id, userId);
        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification'
        });
    }
};
exports.deleteNotification = deleteNotification;
const getNotificationTemplates = async (req, res) => {
    try {
        const filters = {
            template_type: req.query.template_type,
            is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
            search: req.query.search
        };
        const templates = await notifications_service_1.NotificationsService.getNotificationTemplates(filters);
        res.json({
            success: true,
            data: templates
        });
    }
    catch (error) {
        console.error('Error fetching notification templates:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification templates'
        });
    }
};
exports.getNotificationTemplates = getNotificationTemplates;
const getNotificationTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await notifications_service_1.NotificationsService.getNotificationTemplateById(id);
        res.json({
            success: true,
            data: template
        });
    }
    catch (error) {
        console.error('Error fetching notification template:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification template'
        });
    }
};
exports.getNotificationTemplateById = getNotificationTemplateById;
const createNotificationTemplate = async (req, res) => {
    try {
        const templateData = {
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const template = await notifications_service_1.NotificationsService.createNotificationTemplate(templateData);
        res.status(201).json({
            success: true,
            data: template,
            message: 'Notification template created successfully'
        });
    }
    catch (error) {
        console.error('Error creating notification template:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification template'
        });
    }
};
exports.createNotificationTemplate = createNotificationTemplate;
const updateNotificationTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const templateData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };
        const template = await notifications_service_1.NotificationsService.updateNotificationTemplate(id, templateData);
        res.json({
            success: true,
            data: template,
            message: 'Notification template updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating notification template:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification template'
        });
    }
};
exports.updateNotificationTemplate = updateNotificationTemplate;
const deleteNotificationTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        await notifications_service_1.NotificationsService.deleteNotificationTemplate(id);
        res.json({
            success: true,
            message: 'Notification template deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting notification template:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification template'
        });
    }
};
exports.deleteNotificationTemplate = deleteNotificationTemplate;
const getClientNotifications = async (req, res) => {
    try {
        const filters = {
            is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
            notification_type: req.query.notification_type,
            scheduled_at: req.query.scheduled_at,
            search: req.query.search,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 25
        };
        const result = await notifications_service_1.NotificationsService.getClientNotifications(filters);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching client notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch client notifications'
        });
    }
};
exports.getClientNotifications = getClientNotifications;
const createClientNotification = async (req, res) => {
    try {
        const notificationData = {
            ...req.body,
            created_by: req.user?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const notification = await notifications_service_1.NotificationsService.createClientNotification(notificationData);
        res.status(201).json({
            success: true,
            data: notification,
            message: 'Client notification created successfully'
        });
    }
    catch (error) {
        console.error('Error creating client notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create client notification'
        });
    }
};
exports.createClientNotification = createClientNotification;
const updateClientNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const notificationData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };
        const notification = await notifications_service_1.NotificationsService.updateClientNotification(id, notificationData);
        res.json({
            success: true,
            data: notification,
            message: 'Client notification updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating client notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update client notification'
        });
    }
};
exports.updateClientNotification = updateClientNotification;
const deleteClientNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await notifications_service_1.NotificationsService.deleteClientNotification(id);
        res.json({
            success: true,
            message: 'Client notification deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting client notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete client notification'
        });
    }
};
exports.deleteClientNotification = deleteClientNotification;
const sendClientNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await notifications_service_1.NotificationsService.sendClientNotification(id);
        res.json({
            success: true,
            data: notification,
            message: 'Client notification sent successfully'
        });
    }
    catch (error) {
        console.error('Error sending client notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send client notification'
        });
    }
};
exports.sendClientNotification = sendClientNotification;
const sendBulkNotification = async (req, res) => {
    try {
        const notifications = await notifications_service_1.NotificationsService.sendBulkNotification(req.body);
        res.json({
            success: true,
            data: notifications,
            message: 'Bulk notification sent successfully'
        });
    }
    catch (error) {
        console.error('Error sending bulk notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send bulk notification'
        });
    }
};
exports.sendBulkNotification = sendBulkNotification;
const sendSystemNotification = async (req, res) => {
    try {
        const notifications = await notifications_service_1.NotificationsService.sendSystemNotification(req.body);
        res.json({
            success: true,
            data: notifications,
            message: 'System notification sent successfully'
        });
    }
    catch (error) {
        console.error('Error sending system notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send system notification'
        });
    }
};
exports.sendSystemNotification = sendSystemNotification;
const getNotificationStats = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const stats = await notifications_service_1.NotificationsService.getNotificationStats(userId);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error fetching notification stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification stats'
        });
    }
};
exports.getNotificationStats = getNotificationStats;
//# sourceMappingURL=notifications.controller.js.map