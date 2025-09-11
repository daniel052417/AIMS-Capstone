import type { MarketingCampaign, CampaignTemplate, CampaignAnalytics, CampaignSchedule, ClientNotification, NotificationTemplate, MarketingAuditLog } from '@shared/types/database';
export declare class MarketingAdminService {
    static getDashboard(): Promise<{
        totalCampaigns: number;
        totalTemplates: number;
        totalNotifications: number;
        totalAnalytics: number;
        timestamp: string;
    }>;
    static getCampaigns(filters?: any): Promise<{
        campaigns: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static getCampaignById(id: string): Promise<any>;
    static createCampaign(campaignData: Partial<MarketingCampaign>): Promise<any>;
    static updateCampaign(id: string, campaignData: Partial<MarketingCampaign>): Promise<any>;
    static deleteCampaign(id: string): Promise<{
        success: boolean;
    }>;
    static publishCampaign(id: string): Promise<any>;
    static unpublishCampaign(id: string): Promise<any>;
    static getTemplates(filters?: any): Promise<{
        templates: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static getTemplateById(id: string): Promise<any>;
    static createTemplate(templateData: Partial<CampaignTemplate>): Promise<any>;
    static updateTemplate(id: string, templateData: Partial<CampaignTemplate>): Promise<any>;
    static deleteTemplate(id: string): Promise<{
        success: boolean;
    }>;
    static getAnalytics(filters?: any): Promise<{
        analytics: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static getCampaignAnalytics(campaignId: string): Promise<any[]>;
    static createCampaignAnalytics(analyticsData: Partial<CampaignAnalytics>): Promise<any>;
    static getCampaignSchedules(campaignId: string): Promise<any[]>;
    static createCampaignSchedule(scheduleData: Partial<CampaignSchedule>): Promise<any>;
    static updateCampaignSchedule(id: string, scheduleData: Partial<CampaignSchedule>): Promise<any>;
    static getNotifications(filters?: any): Promise<{
        notifications: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static createNotification(notificationData: Partial<ClientNotification>): Promise<any>;
    static updateNotification(id: string, notificationData: Partial<ClientNotification>): Promise<any>;
    static deleteNotification(id: string): Promise<{
        success: boolean;
    }>;
    static getNotificationTemplates(): Promise<any[]>;
    static createNotificationTemplate(templateData: Partial<NotificationTemplate>): Promise<any>;
    static updateNotificationTemplate(id: string, templateData: Partial<NotificationTemplate>): Promise<any>;
    static deleteNotificationTemplate(id: string): Promise<{
        success: boolean;
    }>;
    static getMarketingAuditLogs(filters?: any): Promise<{
        logs: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static createMarketingAuditLog(logData: Partial<MarketingAuditLog>): Promise<any>;
    static getCampaignPerformanceSummary(campaignId: string): Promise<{
        views_count: any;
        clicks_count: any;
        conversions_count: any;
    }>;
    static updateCampaignMetrics(campaignId: string, metrics: {
        views_count?: number;
        clicks_count?: number;
        conversions_count?: number;
    }): Promise<any>;
}
//# sourceMappingURL=admin.service.d.ts.map