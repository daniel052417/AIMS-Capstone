import { supabaseAdmin } from '../config/supabaseClient';
import type { 
  Notification, 
  NotificationTemplate,
  ClientNotification
} from '@shared/types/database';

export class NotificationsService {
  // User Notifications
  static async getNotifications(userId: string, filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', userId);

      if (filters.is_read !== undefined) {
        query = query.eq('is_read', filters.is_read);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 25;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        notifications: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch notifications: ${error}`);
    }
  }

  static async createNotification(notificationData: Partial<Notification>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert([notificationData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create notification: ${error}`);
    }
  }

  static async markAsRead(notificationId: string, userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error}`);
    }
  }

  static async markAllAsRead(userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to mark all notifications as read: ${error}`);
    }
  }

  static async deleteNotification(notificationId: string, userId: string) {
    try {
      const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete notification: ${error}`);
    }
  }

  // Notification Templates
  static async getNotificationTemplates(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('notification_templates')
        .select('*');

      if (filters.template_type) {
        query = query.eq('template_type', filters.template_type);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.search) {
        query = query.or(`template_name.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('template_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch notification templates: ${error}`);
    }
  }

  static async getNotificationTemplateById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('notification_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch notification template: ${error}`);
    }
  }

  static async createNotificationTemplate(templateData: Partial<NotificationTemplate>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('notification_templates')
        .insert([templateData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create notification template: ${error}`);
    }
  }

  static async updateNotificationTemplate(id: string, templateData: Partial<NotificationTemplate>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('notification_templates')
        .update(templateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update notification template: ${error}`);
    }
  }

  static async deleteNotificationTemplate(id: string) {
    try {
      const { error } = await supabaseAdmin
        .from('notification_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete notification template: ${error}`);
    }
  }

  // Client Notifications (Marketing)
  static async getClientNotifications(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('client_notifications')
        .select(`
          *,
          created_by:created_by_user_id (
            first_name,
            last_name
          )
        `);

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.notification_type) {
        query = query.eq('notification_type', filters.notification_type);
      }
      if (filters.scheduled_at) {
        query = query.lte('scheduled_at', filters.scheduled_at);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,message.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 25;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        notifications: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch client notifications: ${error}`);
    }
  }

  static async createClientNotification(notificationData: Partial<ClientNotification>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('client_notifications')
        .insert([notificationData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create client notification: ${error}`);
    }
  }

  static async updateClientNotification(id: string, notificationData: Partial<ClientNotification>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('client_notifications')
        .update(notificationData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update client notification: ${error}`);
    }
  }

  static async deleteClientNotification(id: string) {
    try {
      const { error } = await supabaseAdmin
        .from('client_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete client notification: ${error}`);
    }
  }

  static async sendClientNotification(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('client_notifications')
        .update({
          sent_at: new Date().toISOString(),
          is_active: false
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to send client notification: ${error}`);
    }
  }

  // Bulk Notifications
  static async sendBulkNotification(notificationData: {
    title: string;
    message: string;
    type: string;
    user_ids: string[];
    data?: any;
  }) {
    try {
      const notifications = notificationData.user_ids.map(userId => ({
        user_id: userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        data: notificationData.data,
        is_read: false,
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to send bulk notification: ${error}`);
    }
  }

  // System Notifications
  static async sendSystemNotification(notificationData: {
    title: string;
    message: string;
    type: string;
    target_roles?: string[];
    target_departments?: string[];
    data?: any;
  }) {
    try {
      // Get users based on target criteria
      let userQuery = supabaseAdmin
        .from('users')
        .select('id')
        .eq('is_active', true);

      if (notificationData.target_roles && notificationData.target_roles.length > 0) {
        userQuery = userQuery.in('role', notificationData.target_roles);
      }

      const { data: users, error: usersError } = await userQuery;

      if (usersError) throw usersError;

      if (!users || users.length === 0) {
        return { message: 'No users found matching criteria' };
      }

      // Create notifications for all matching users
      const notifications = users.map(user => ({
        user_id: user.id,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        data: notificationData.data,
        is_read: false,
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to send system notification: ${error}`);
    }
  }

  // Notification Statistics
  static async getNotificationStats(userId: string) {
    try {
      const [
        totalNotifications,
        unreadNotifications,
        notificationsByType
      ] = await Promise.all([
        supabaseAdmin.from('notifications').select('id', { count: 'exact' }).eq('user_id', userId),
        supabaseAdmin.from('notifications').select('id', { count: 'exact' }).eq('user_id', userId).eq('is_read', false),
        supabaseAdmin.from('notifications').select('type').eq('user_id', userId)
      ]);

      // Count by type
      const typeCounts = notificationsByType.data?.reduce((acc, notification) => {
        acc[notification.type] = (acc[notification.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        total: totalNotifications.count || 0,
        unread: unreadNotifications.count || 0,
        byType: typeCounts
      };
    } catch (error) {
      throw new Error(`Failed to fetch notification stats: ${error}`);
    }
  }
}

