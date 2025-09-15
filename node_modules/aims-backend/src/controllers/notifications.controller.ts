import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { NotificationsService } from '../services/notifications.service';

// User Notifications
export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const filters = {
      is_read: req.query.is_read ? req.query.is_read === 'true' : undefined,
      type: req.query.type as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 25,
    };

    const result = await NotificationsService.getNotifications(userId, filters);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    });
  }
};

export const createNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const notificationData = {
      ...req.body,
      created_at: new Date().toISOString(),
    };

    const notification = await NotificationsService.createNotification(notificationData);
    
    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created successfully',
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
    });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const notification = await NotificationsService.markAsRead(id, userId);
    
    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
    });
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const notifications = await NotificationsService.markAllAsRead(userId);
    
    res.json({
      success: true,
      data: notifications,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
    });
  }
};

export const deleteNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    await NotificationsService.deleteNotification(id, userId);
    
    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
    });
  }
};

// Notification Templates
export const getNotificationTemplates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      template_type: req.query.template_type as string,
      is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
      search: req.query.search as string,
    };

    const templates = await NotificationsService.getNotificationTemplates(filters);
    
    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error fetching notification templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification templates',
    });
  }
};

export const getNotificationTemplateById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const template = await NotificationsService.getNotificationTemplateById(id);
    
    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error fetching notification template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification template',
    });
  }
};

export const createNotificationTemplate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const templateData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const template = await NotificationsService.createNotificationTemplate(templateData);
    
    res.status(201).json({
      success: true,
      data: template,
      message: 'Notification template created successfully',
    });
  } catch (error) {
    console.error('Error creating notification template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification template',
    });
  }
};

export const updateNotificationTemplate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const templateData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    const template = await NotificationsService.updateNotificationTemplate(id, templateData);
    
    res.json({
      success: true,
      data: template,
      message: 'Notification template updated successfully',
    });
  } catch (error) {
    console.error('Error updating notification template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification template',
    });
  }
};

export const deleteNotificationTemplate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await NotificationsService.deleteNotificationTemplate(id);
    
    res.json({
      success: true,
      message: 'Notification template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notification template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification template',
    });
  }
};

// Client Notifications (Marketing)
export const getClientNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
      notification_type: req.query.notification_type as string,
      scheduled_at: req.query.scheduled_at as string,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 25,
    };

    const result = await NotificationsService.getClientNotifications(filters);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching client notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client notifications',
    });
  }
};

export const createClientNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const notificationData = {
      ...req.body,
      created_by: req.user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const notification = await NotificationsService.createClientNotification(notificationData);
    
    res.status(201).json({
      success: true,
      data: notification,
      message: 'Client notification created successfully',
    });
  } catch (error) {
    console.error('Error creating client notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create client notification',
    });
  }
};

export const updateClientNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const notificationData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    const notification = await NotificationsService.updateClientNotification(id, notificationData);
    
    res.json({
      success: true,
      data: notification,
      message: 'Client notification updated successfully',
    });
  } catch (error) {
    console.error('Error updating client notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update client notification',
    });
  }
};

export const deleteClientNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await NotificationsService.deleteClientNotification(id);
    
    res.json({
      success: true,
      message: 'Client notification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting client notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete client notification',
    });
  }
};

export const sendClientNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const notification = await NotificationsService.sendClientNotification(id);
    
    res.json({
      success: true,
      data: notification,
      message: 'Client notification sent successfully',
    });
  } catch (error) {
    console.error('Error sending client notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send client notification',
    });
  }
};

// Bulk Notifications
export const sendBulkNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const notifications = await NotificationsService.sendBulkNotification(req.body);
    
    res.json({
      success: true,
      data: notifications,
      message: 'Bulk notification sent successfully',
    });
  } catch (error) {
    console.error('Error sending bulk notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk notification',
    });
  }
};

export const sendSystemNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const notifications = await NotificationsService.sendSystemNotification(req.body);
    
    res.json({
      success: true,
      data: notifications,
      message: 'System notification sent successfully',
    });
  } catch (error) {
    console.error('Error sending system notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send system notification',
    });
  }
};

// Statistics
export const getNotificationStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const stats = await NotificationsService.getNotificationStats(userId);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification stats',
    });
  }
};

