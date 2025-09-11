import type { Notification, NotificationTemplate, ClientNotification } from '@shared/types/database';
export declare class NotificationsService {
    static getNotifications(userId: string, filters?: any): Promise<{
        notifications: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static createNotification(notificationData: Partial<Notification>): Promise<any>;
    static markAsRead(notificationId: string, userId: string): Promise<any>;
    static markAllAsRead(userId: string): Promise<any[]>;
    static deleteNotification(notificationId: string, userId: string): Promise<{
        success: boolean;
    }>;
    static getNotificationTemplates(filters?: any): Promise<any[]>;
    static getNotificationTemplateById(id: string): Promise<any>;
    static createNotificationTemplate(templateData: Partial<NotificationTemplate>): Promise<any>;
    static updateNotificationTemplate(id: string, templateData: Partial<NotificationTemplate>): Promise<any>;
    static deleteNotificationTemplate(id: string): Promise<{
        success: boolean;
    }>;
    static getClientNotifications(filters?: any): Promise<{
        notifications: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static createClientNotification(notificationData: Partial<ClientNotification>): Promise<any>;
    static updateClientNotification(id: string, notificationData: Partial<ClientNotification>): Promise<any>;
    static deleteClientNotification(id: string): Promise<{
        success: boolean;
    }>;
    static sendClientNotification(id: string): Promise<any>;
    static sendBulkNotification(notificationData: {
        title: string;
        message: string;
        type: string;
        user_ids: string[];
        data?: any;
    }): Promise<any[]>;
    static sendSystemNotification(notificationData: {
        title: string;
        message: string;
        type: string;
        target_roles?: string[];
        target_departments?: string[];
        data?: any;
    }): Promise<any[] | {
        message: string;
    }>;
    static getNotificationStats(userId: string): Promise<{
        total: number;
        unread: number;
        byType: Record<string, number>;
    }>;
}
//# sourceMappingURL=notifications.service.d.ts.map