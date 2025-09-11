"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingAdminService = void 0;
const supabaseClient_1 = require("../../config/supabaseClient");
class MarketingAdminService {
    static async getDashboard() {
        try {
            const [campaignsResult, templatesResult, notificationsResult, analyticsResult] = await Promise.all([
                supabaseClient_1.supabaseAdmin.from('marketing_campaigns').select('id', { count: 'exact' }),
                supabaseClient_1.supabaseAdmin.from('campaign_templates').select('id', { count: 'exact' }),
                supabaseClient_1.supabaseAdmin.from('client_notifications').select('id', { count: 'exact' }),
                supabaseClient_1.supabaseAdmin.from('campaign_analytics').select('id', { count: 'exact' })
            ]);
            return {
                totalCampaigns: campaignsResult.count || 0,
                totalTemplates: templatesResult.count || 0,
                totalNotifications: notificationsResult.count || 0,
                totalAnalytics: analyticsResult.count || 0,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch marketing dashboard: ${error}`);
        }
    }
    static async getCampaigns(filters = {}) {
        try {
            let query = supabaseClient_1.supabaseAdmin
                .from('marketing_campaigns')
                .select(`
          *,
          campaign_templates:template_id (
            name,
            template_type
          )
        `);
            if (filters.search) {
                query = query.or(`campaign_name.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
            }
            if (filters.template_type) {
                query = query.eq('template_type', filters.template_type);
            }
            if (filters.is_active !== undefined) {
                query = query.eq('is_active', filters.is_active);
            }
            if (filters.is_published !== undefined) {
                query = query.eq('is_published', filters.is_published);
            }
            if (filters.created_by) {
                query = query.eq('created_by', filters.created_by);
            }
            const page = filters.page || 1;
            const limit = filters.limit || 10;
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to).order('created_at', { ascending: false });
            const { data, error, count } = await query;
            if (error)
                throw error;
            return {
                campaigns: data || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    pages: Math.ceil((count || 0) / limit)
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch campaigns: ${error}`);
        }
    }
    static async getCampaignById(id) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('marketing_campaigns')
                .select(`
          *,
          campaign_templates:template_id (
            name,
            template_type,
            content
          )
        `)
                .eq('id', id)
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch campaign: ${error}`);
        }
    }
    static async createCampaign(campaignData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('marketing_campaigns')
                .insert([campaignData])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to create campaign: ${error}`);
        }
    }
    static async updateCampaign(id, campaignData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('marketing_campaigns')
                .update(campaignData)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to update campaign: ${error}`);
        }
    }
    static async deleteCampaign(id) {
        try {
            const { error } = await supabaseClient_1.supabaseAdmin
                .from('marketing_campaigns')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return { success: true };
        }
        catch (error) {
            throw new Error(`Failed to delete campaign: ${error}`);
        }
    }
    static async publishCampaign(id) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('marketing_campaigns')
                .update({
                is_published: true,
                is_active: true,
                publish_date: new Date().toISOString()
            })
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to publish campaign: ${error}`);
        }
    }
    static async unpublishCampaign(id) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('marketing_campaigns')
                .update({
                is_published: false,
                is_active: false,
                unpublish_date: new Date().toISOString()
            })
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to unpublish campaign: ${error}`);
        }
    }
    static async getTemplates(filters = {}) {
        try {
            let query = supabaseClient_1.supabaseAdmin
                .from('campaign_templates')
                .select('*');
            if (filters.template_type) {
                query = query.eq('template_type', filters.template_type);
            }
            if (filters.is_active !== undefined) {
                query = query.eq('is_active', filters.is_active);
            }
            if (filters.created_by) {
                query = query.eq('created_by', filters.created_by);
            }
            const page = filters.page || 1;
            const limit = filters.limit || 10;
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to).order('created_at', { ascending: false });
            const { data, error, count } = await query;
            if (error)
                throw error;
            return {
                templates: data || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    pages: Math.ceil((count || 0) / limit)
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch templates: ${error}`);
        }
    }
    static async getTemplateById(id) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('campaign_templates')
                .select('*')
                .eq('id', id)
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch template: ${error}`);
        }
    }
    static async createTemplate(templateData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('campaign_templates')
                .insert([templateData])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to create template: ${error}`);
        }
    }
    static async updateTemplate(id, templateData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('campaign_templates')
                .update(templateData)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to update template: ${error}`);
        }
    }
    static async deleteTemplate(id) {
        try {
            const { error } = await supabaseClient_1.supabaseAdmin
                .from('campaign_templates')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return { success: true };
        }
        catch (error) {
            throw new Error(`Failed to delete template: ${error}`);
        }
    }
    static async getAnalytics(filters = {}) {
        try {
            let query = supabaseClient_1.supabaseAdmin
                .from('campaign_analytics')
                .select(`
          *,
          marketing_campaigns:campaign_id (
            campaign_name,
            title
          )
        `);
            if (filters.campaign_id) {
                query = query.eq('campaign_id', filters.campaign_id);
            }
            if (filters.metric_name) {
                query = query.eq('metric_name', filters.metric_name);
            }
            if (filters.date_from) {
                query = query.gte('metric_date', filters.date_from);
            }
            if (filters.date_to) {
                query = query.lte('metric_date', filters.date_to);
            }
            const page = filters.page || 1;
            const limit = filters.limit || 10;
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to).order('metric_date', { ascending: false });
            const { data, error, count } = await query;
            if (error)
                throw error;
            return {
                analytics: data || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    pages: Math.ceil((count || 0) / limit)
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch analytics: ${error}`);
        }
    }
    static async getCampaignAnalytics(campaignId) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('campaign_analytics')
                .select('*')
                .eq('campaign_id', campaignId)
                .order('metric_date', { ascending: false });
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch campaign analytics: ${error}`);
        }
    }
    static async createCampaignAnalytics(analyticsData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('campaign_analytics')
                .insert([analyticsData])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to create campaign analytics: ${error}`);
        }
    }
    static async getCampaignSchedules(campaignId) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('campaign_schedules')
                .select('*')
                .eq('campaign_id', campaignId)
                .order('scheduled_date', { ascending: false });
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch campaign schedules: ${error}`);
        }
    }
    static async createCampaignSchedule(scheduleData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('campaign_schedules')
                .insert([scheduleData])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to create campaign schedule: ${error}`);
        }
    }
    static async updateCampaignSchedule(id, scheduleData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('campaign_schedules')
                .update(scheduleData)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to update campaign schedule: ${error}`);
        }
    }
    static async getNotifications(filters = {}) {
        try {
            let query = supabaseClient_1.supabaseAdmin
                .from('client_notifications')
                .select(`
          *,
          marketing_campaigns:campaign_id (
            campaign_name,
            title
          ),
          notification_templates:template_id (
            name,
            type
          )
        `);
            if (filters.customer_id) {
                query = query.eq('customer_id', filters.customer_id);
            }
            if (filters.notification_type) {
                query = query.eq('notification_type', filters.notification_type);
            }
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.campaign_id) {
                query = query.eq('campaign_id', filters.campaign_id);
            }
            const page = filters.page || 1;
            const limit = filters.limit || 10;
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to).order('created_at', { ascending: false });
            const { data, error, count } = await query;
            if (error)
                throw error;
            return {
                notifications: data || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    pages: Math.ceil((count || 0) / limit)
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch notifications: ${error}`);
        }
    }
    static async createNotification(notificationData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('client_notifications')
                .insert([notificationData])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to create notification: ${error}`);
        }
    }
    static async updateNotification(id, notificationData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('client_notifications')
                .update(notificationData)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to update notification: ${error}`);
        }
    }
    static async deleteNotification(id) {
        try {
            const { error } = await supabaseClient_1.supabaseAdmin
                .from('client_notifications')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return { success: true };
        }
        catch (error) {
            throw new Error(`Failed to delete notification: ${error}`);
        }
    }
    static async getNotificationTemplates() {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('notification_templates')
                .select('*')
                .order('name');
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch notification templates: ${error}`);
        }
    }
    static async createNotificationTemplate(templateData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('notification_templates')
                .insert([templateData])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to create notification template: ${error}`);
        }
    }
    static async updateNotificationTemplate(id, templateData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('notification_templates')
                .update(templateData)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to update notification template: ${error}`);
        }
    }
    static async deleteNotificationTemplate(id) {
        try {
            const { error } = await supabaseClient_1.supabaseAdmin
                .from('notification_templates')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return { success: true };
        }
        catch (error) {
            throw new Error(`Failed to delete notification template: ${error}`);
        }
    }
    static async getMarketingAuditLogs(filters = {}) {
        try {
            let query = supabaseClient_1.supabaseAdmin
                .from('marketing_audit_logs')
                .select('*');
            if (filters.user_id) {
                query = query.eq('user_id', filters.user_id);
            }
            if (filters.action) {
                query = query.eq('action', filters.action);
            }
            if (filters.resource) {
                query = query.eq('resource', filters.resource);
            }
            const page = filters.page || 1;
            const limit = filters.limit || 10;
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to).order('created_at', { ascending: false });
            const { data, error, count } = await query;
            if (error)
                throw error;
            return {
                logs: data || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    pages: Math.ceil((count || 0) / limit)
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch marketing audit logs: ${error}`);
        }
    }
    static async createMarketingAuditLog(logData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('marketing_audit_logs')
                .insert([logData])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to create marketing audit log: ${error}`);
        }
    }
    static async getCampaignPerformanceSummary(campaignId) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('marketing_campaigns')
                .select('views_count, clicks_count, conversions_count')
                .eq('id', campaignId)
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch campaign performance summary: ${error}`);
        }
    }
    static async updateCampaignMetrics(campaignId, metrics) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('marketing_campaigns')
                .update(metrics)
                .eq('id', campaignId)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to update campaign metrics: ${error}`);
        }
    }
}
exports.MarketingAdminService = MarketingAdminService;
//# sourceMappingURL=admin.service.js.map