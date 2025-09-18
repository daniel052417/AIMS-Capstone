# Marketing Dashboard Backend Integration Guide

## Overview
Complete backend implementation for MarketingDashboard.tsx supporting marketing analytics, campaign performance tracking, and real-time metrics with role-based access control.

## Table of Contents
1. [Database Schema](#database-schema)
2. [Express Routes](#express-routes)
3. [Controllers](#controllers)
4. [Services](#services)
5. [Frontend Integration](#frontend-integration)
6. [Implementation Plan](#implementation-plan)

---

## Database Schema

### Migration SQL

```sql
-- Channel Performance Table
CREATE TABLE channel_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel VARCHAR(50) NOT NULL,
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reach BIGINT DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  conversions BIGINT DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Activity Feed Table
CREATE TABLE campaign_activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  activity_data JSONB,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROI Metrics Table
CREATE TABLE roi_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  roi DECIMAL(5,2) NOT NULL,
  ctr DECIMAL(5,2) NOT NULL,
  conversion_rate DECIMAL(5,2) NOT NULL,
  cost_per_lead DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_channel_performance_channel ON channel_performance(channel);
CREATE INDEX idx_channel_performance_date ON channel_performance(date);
CREATE INDEX idx_campaign_activity_feed_campaign ON campaign_activity_feed(campaign_id);
CREATE INDEX idx_roi_metrics_date ON roi_metrics(date);

-- Views for Dashboard Metrics
CREATE OR REPLACE VIEW marketing_dashboard_metrics AS
SELECT
  COUNT(DISTINCT mc.id) as total_campaigns,
  COUNT(DISTINCT CASE WHEN mc.is_active THEN mc.id END) as active_campaigns,
  COALESCE(SUM(ca.reach), 0) as total_reach,
  COALESCE(SUM(ca.clicks), 0) as total_clicks,
  COALESCE(SUM(ca.conversions), 0) as total_conversions,
  COALESCE(SUM(ca.budget), 0) as total_budget,
  COALESCE(SUM(ca.spent), 0) as total_spent,
  CASE 
    WHEN SUM(ca.impressions) > 0 
    THEN ROUND((SUM(ca.clicks)::DECIMAL / SUM(ca.impressions)) * 100, 2)
    ELSE 0 
  END as avg_ctr,
  CASE 
    WHEN SUM(ca.clicks) > 0 
    THEN ROUND((SUM(ca.conversions)::DECIMAL / SUM(ca.clicks)) * 100, 2)
    ELSE 0 
  END as avg_conversion_rate
FROM marketing_campaigns mc
LEFT JOIN campaign_analytics ca ON mc.id = ca.campaign_id;

-- Function to calculate ROI
CREATE OR REPLACE FUNCTION calculate_campaign_roi(campaign_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_spent DECIMAL(10,2);
  total_conversions INTEGER;
  conversion_value DECIMAL(10,2);
  roi DECIMAL(5,2);
BEGIN
  SELECT COALESCE(SUM(spent), 0) INTO total_spent
  FROM campaign_analytics
  WHERE campaign_id = campaign_id;
  
  SELECT COALESCE(SUM(conversions), 0) INTO total_conversions
  FROM campaign_analytics
  WHERE campaign_id = campaign_id;
  
  -- Assuming average conversion value of 50 (adjust based on your business)
  conversion_value := total_conversions * 50;
  
  IF total_spent > 0 THEN
    roi := ((conversion_value - total_spent) / total_spent) * 100;
  ELSE
    roi := 0;
  END IF;
  
  RETURN roi;
END;
$$ LANGUAGE plpgsql;
```

---

## Express Routes

### Route File: `backend/src/routes/marketing.routes.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles, hasPermission } from '../middleware/rbac';
import { asyncHandler } from '../middleware/errorHandler';
import * as marketingController from '../controllers/marketing.controller';

const router = Router();
router.use(requireAuth);

// Dashboard & Analytics
router.get('/marketing/dashboard', 
  requireRoles(['super_admin', 'marketing_admin', 'marketing_manager']),
  hasPermission('marketing.dashboard.read'),
  asyncHandler(marketingController.getMarketingDashboard)
);

router.get('/marketing/analytics', 
  requireRoles(['super_admin', 'marketing_admin', 'marketing_manager']),
  hasPermission('marketing.analytics.read'),
  asyncHandler(marketingController.getMarketingAnalytics)
);

router.get('/marketing/analytics/:campaignId', 
  requireRoles(['super_admin', 'marketing_admin', 'marketing_manager']),
  hasPermission('marketing.analytics.read'),
  asyncHandler(marketingController.getCampaignAnalytics)
);

router.get('/marketing/metrics', 
  requireRoles(['super_admin', 'marketing_admin', 'marketing_manager']),
  hasPermission('marketing.analytics.read'),
  asyncHandler(marketingController.getMetricsByPeriod)
);

// Campaign Management
router.get('/marketing/campaigns', 
  requireRoles(['super_admin', 'marketing_admin', 'marketing_manager']),
  hasPermission('marketing.campaigns.read'),
  asyncHandler(marketingController.getCampaigns)
);

router.get('/marketing/campaigns/:id', 
  requireRoles(['super_admin', 'marketing_admin', 'marketing_manager']),
  hasPermission('marketing.campaigns.read'),
  asyncHandler(marketingController.getCampaign)
);

router.post('/marketing/campaigns', 
  requireRoles(['super_admin', 'marketing_admin']),
  hasPermission('marketing.campaigns.create'),
  asyncHandler(marketingController.createCampaign)
);

router.put('/marketing/campaigns/:id', 
  requireRoles(['super_admin', 'marketing_admin']),
  hasPermission('marketing.campaigns.update'),
  asyncHandler(marketingController.updateCampaign)
);

router.delete('/marketing/campaigns/:id', 
  requireRoles(['super_admin', 'marketing_admin']),
  hasPermission('marketing.campaigns.delete'),
  asyncHandler(marketingController.deleteCampaign)
);

router.patch('/marketing/campaigns/:id/status', 
  requireRoles(['super_admin', 'marketing_admin']),
  hasPermission('marketing.campaigns.update'),
  asyncHandler(marketingController.updateCampaignStatus)
);

// Channel Performance
router.get('/marketing/channels/performance', 
  requireRoles(['super_admin', 'marketing_admin', 'marketing_manager']),
  hasPermission('marketing.analytics.read'),
  asyncHandler(marketingController.getChannelPerformance)
);

router.get('/marketing/channels/:channel/analytics', 
  requireRoles(['super_admin', 'marketing_admin', 'marketing_manager']),
  hasPermission('marketing.analytics.read'),
  asyncHandler(marketingController.getChannelAnalytics)
);

// Recent Activity
router.get('/marketing/activity', 
  requireRoles(['super_admin', 'marketing_admin', 'marketing_manager']),
  hasPermission('marketing.activity.read'),
  asyncHandler(marketingController.getMarketingActivity)
);

router.get('/marketing/activity/feed', 
  requireRoles(['super_admin', 'marketing_admin', 'marketing_manager']),
  hasPermission('marketing.activity.read'),
  asyncHandler(marketingController.getActivityFeed)
);

// Performance Summary
router.get('/marketing/performance/summary', 
  requireRoles(['super_admin', 'marketing_admin', 'marketing_manager']),
  hasPermission('marketing.analytics.read'),
  asyncHandler(marketingController.getPerformanceSummary)
);

router.get('/marketing/performance/roi', 
  requireRoles(['super_admin', 'marketing_admin', 'marketing_manager']),
  hasPermission('marketing.analytics.read'),
  asyncHandler(marketingController.getROIMetrics)
);

router.get('/marketing/performance/ctr', 
  requireRoles(['super_admin', 'marketing_admin', 'marketing_manager']),
  hasPermission('marketing.analytics.read'),
  asyncHandler(marketingController.getCTRMetrics)
);

router.get('/marketing/performance/cost-per-lead', 
  requireRoles(['super_admin', 'marketing_admin', 'marketing_manager']),
  hasPermission('marketing.analytics.read'),
  asyncHandler(marketingController.getCostPerLeadMetrics)
);

// Export & Reporting
router.get('/marketing/export/campaigns', 
  requireRoles(['super_admin', 'marketing_admin']),
  hasPermission('marketing.export'),
  asyncHandler(marketingController.exportCampaigns)
);

router.get('/marketing/export/analytics', 
  requireRoles(['super_admin', 'marketing_admin']),
  hasPermission('marketing.export'),
  asyncHandler(marketingController.exportAnalytics)
);

router.get('/marketing/reports/performance', 
  requireRoles(['super_admin', 'marketing_admin']),
  hasPermission('marketing.export'),
  asyncHandler(marketingController.generatePerformanceReport)
);

export default router;
```

---

## Controllers

### Controller: `backend/src/controllers/marketing.controller.ts`

```typescript
import { Request, Response } from 'express';
import { MarketingService } from '../services/marketing.service';

export const getMarketingDashboard = async (req: Request, res: Response) => {
  const { startDate, endDate, granularity = 'monthly' } = req.query;
  
  const dashboard = await MarketingService.getDashboardMetrics({
    startDate: startDate as string,
    endDate: endDate as string,
    granularity: granularity as string
  });
  
  res.json({
    success: true,
    data: dashboard
  });
};

export const getMarketingAnalytics = async (req: Request, res: Response) => {
  const { 
    campaign_id, 
    channel, 
    startDate, 
    endDate, 
    groupBy = 'date',
    page = 1,
    limit = 20
  } = req.query;
  
  const analytics = await MarketingService.getCampaignAnalytics({
    campaign_id: campaign_id as string,
    channel: channel as string,
    startDate: startDate as string,
    endDate: endDate as string,
    groupBy: groupBy as string,
    page: parseInt(page as string),
    limit: parseInt(limit as string)
  });
  
  res.json({
    success: true,
    data: analytics.data,
    pagination: analytics.pagination
  });
};

export const getCampaignAnalytics = async (req: Request, res: Response) => {
  const { campaignId } = req.params;
  const { startDate, endDate } = req.query;
  
  const analytics = await MarketingService.getCampaignByIdAnalytics(campaignId, {
    startDate: startDate as string,
    endDate: endDate as string
  });
  
  res.json({
    success: true,
    data: analytics
  });
};

export const getMetricsByPeriod = async (req: Request, res: Response) => {
  const { period = 'monthly', startDate, endDate } = req.query;
  
  const metrics = await MarketingService.getMetricsByPeriod({
    period: period as string,
    startDate: startDate as string,
    endDate: endDate as string
  });
  
  res.json({
    success: true,
    data: metrics
  });
};

export const getCampaigns = async (req: Request, res: Response) => {
  const { 
    status, 
    channel, 
    date_from, 
    date_to, 
    search,
    page = 1,
    limit = 20,
    sort_by = 'created_at',
    sort_order = 'desc'
  } = req.query;
  
  const campaigns = await MarketingService.getCampaigns({
    status: status as string,
    channel: channel as string,
    date_from: date_from as string,
    date_to: date_to as string,
    search: search as string,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    sort_by: sort_by as string,
    sort_order: sort_order as string
  });
  
  res.json({
    success: true,
    data: campaigns.data,
    pagination: campaigns.pagination
  });
};

export const getChannelPerformance = async (req: Request, res: Response) => {
  const { startDate, endDate, groupBy = 'channel' } = req.query;
  
  const performance = await MarketingService.getChannelPerformance({
    startDate: startDate as string,
    endDate: endDate as string,
    groupBy: groupBy as string
  });
  
  res.json({
    success: true,
    data: performance
  });
};

export const getMarketingActivity = async (req: Request, res: Response) => {
  const { page = 1, limit = 20, activity_type } = req.query;
  
  const activity = await MarketingService.getMarketingActivity({
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    activity_type: activity_type as string
  });
  
  res.json({
    success: true,
    data: activity.data,
    pagination: activity.pagination
  });
};

export const getPerformanceSummary = async (req: Request, res: Response) => {
  const { startDate, endDate, period = 'monthly' } = req.query;
  
  const summary = await MarketingService.getPerformanceSummary({
    startDate: startDate as string,
    endDate: endDate as string,
    period: period as string
  });
  
  res.json({
    success: true,
    data: summary
  });
};

export const exportCampaigns = async (req: Request, res: Response) => {
  const { format = 'csv', status, date_from, date_to } = req.query;
  const userId = req.user?.id;
  
  const exportData = await MarketingService.exportCampaigns({
    format: format as string,
    status: status as string,
    date_from: date_from as string,
    date_to: date_to as string,
    userId
  });
  
  res.json({
    success: true,
    data: exportData
  });
};
```

---

## Services

### Service: `backend/src/services/marketing.service.ts`

```typescript
import { supabase } from '../config/supabase';

export class MarketingService {
  static async getDashboardMetrics(filters: any) {
    // Get current period metrics
    const { data: metrics, error } = await supabase
      .from('marketing_dashboard_metrics')
      .select('*')
      .single();

    if (error) throw error;

    // Get previous period for comparison
    const prevPeriod = await this.calculatePreviousPeriod(filters);
    
    // Calculate growth rates
    const ctrGrowth = prevPeriod.ctr > 0 ? 
      ((metrics.avg_ctr - prevPeriod.ctr) / prevPeriod.ctr) * 100 : 0;
    
    const conversionGrowth = prevPeriod.conversion_rate > 0 ?
      ((metrics.avg_conversion_rate - prevPeriod.conversion_rate) / prevPeriod.conversion_rate) * 100 : 0;

    // Get channel breakdown
    const { data: channelData } = await supabase
      .from('channel_performance')
      .select('channel, reach, clicks, conversions, spend')
      .gte('date', filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .lte('date', filters.endDate || new Date().toISOString().split('T')[0])
      .order('date', { ascending: false });

    const channelBreakdown = channelData?.reduce((acc, item) => {
      if (!acc[item.channel]) {
        acc[item.channel] = {
          reach: 0,
          clicks: 0,
          conversions: 0,
          spend: 0
        };
      }
      acc[item.channel].reach += item.reach;
      acc[item.channel].clicks += item.clicks;
      acc[item.channel].conversions += item.conversions;
      acc[item.channel].spend += parseFloat(item.spend);
      return acc;
    }, {}) || {};

    return {
      ...metrics,
      ctr_growth: ctrGrowth,
      conversion_growth: conversionGrowth,
      channel_breakdown: channelBreakdown,
      last_updated: new Date().toISOString()
    };
  }

  static async getCampaignAnalytics(filters: any) {
    let query = supabase
      .from('campaign_analytics')
      .select(`
        *,
        marketing_campaigns!inner (
          id,
          campaign_name,
          channel,
          is_active
        )
      `);

    if (filters.campaign_id) {
      query = query.eq('campaign_id', filters.campaign_id);
    }

    if (filters.channel) {
      query = query.eq('marketing_campaigns.channel', filters.channel);
    }

    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('date', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Group by specified field if needed
    let groupedData = data || [];
    if (filters.groupBy && filters.groupBy !== 'date') {
      groupedData = this.groupAnalyticsByField(data || [], filters.groupBy);
    }

    return {
      data: groupedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };
  }

  static async getChannelPerformance(filters: any) {
    let query = supabase
      .from('channel_performance')
      .select('*');

    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;

    // Aggregate by channel
    const aggregated = data?.reduce((acc, item) => {
      if (!acc[item.channel]) {
        acc[item.channel] = {
          channel: item.channel,
          reach: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0
        };
      }
      
      acc[item.channel].reach += item.reach;
      acc[item.channel].impressions += item.impressions;
      acc[item.channel].clicks += item.clicks;
      acc[item.channel].conversions += item.conversions;
      acc[item.channel].spend += parseFloat(item.spend);
      
      return acc;
    }, {}) || {};

    // Calculate metrics
    const channels = Object.values(aggregated).map(channel => ({
      ...channel,
      ctr: channel.impressions > 0 ? (channel.clicks / channel.impressions) * 100 : 0,
      conversion_rate: channel.clicks > 0 ? (channel.conversions / channel.clicks) * 100 : 0,
      roi: channel.spend > 0 ? ((channel.conversions * 50 - channel.spend) / channel.spend) * 100 : 0
    }));

    return channels.sort((a, b) => b.spend - a.spend);
  }

  static async getMarketingActivity(filters: any) {
    let query = supabase
      .from('campaign_activity_feed')
      .select(`
        *,
        marketing_campaigns!inner (
          id,
          campaign_name
        ),
        users!inner (
          first_name,
          last_name
        )
      `);

    if (filters.activity_type) {
      query = query.eq('activity_type', filters.activity_type);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };
  }

  static async getPerformanceSummary(filters: any) {
    // Get ROI metrics for the period
    const { data: roiData, error: roiError } = await supabase
      .from('roi_metrics')
      .select(`
        *,
        marketing_campaigns!inner (
          id,
          campaign_name,
          channel
        )
      `)
      .gte('date', filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .lte('date', filters.endDate || new Date().toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (roiError) throw roiError;

    const summary = {
      total_campaigns: roiData?.length || 0,
      avg_roi: 0,
      avg_ctr: 0,
      avg_conversion_rate: 0,
      avg_cost_per_lead: 0,
      top_performing_channel: '',
      roi_trend: []
    };

    if (roiData && roiData.length > 0) {
      // Calculate averages
      summary.avg_roi = roiData.reduce((sum, item) => sum + item.roi, 0) / roiData.length;
      summary.avg_ctr = roiData.reduce((sum, item) => sum + item.ctr, 0) / roiData.length;
      summary.avg_conversion_rate = roiData.reduce((sum, item) => sum + item.conversion_rate, 0) / roiData.length;
      summary.avg_cost_per_lead = roiData.reduce((sum, item) => sum + item.cost_per_lead, 0) / roiData.length;

      // Find top performing channel
      const channelPerformance = roiData.reduce((acc, item) => {
        if (!acc[item.marketing_campaigns.channel]) {
          acc[item.marketing_campaigns.channel] = { total_roi: 0, count: 0 };
        }
        acc[item.marketing_campaigns.channel].total_roi += item.roi;
        acc[item.marketing_campaigns.channel].count += 1;
        return acc;
      }, {});

      summary.top_performing_channel = Object.entries(channelPerformance)
        .sort(([,a], [,b]) => b.total_roi - a.total_roi)[0][0];

      // Format trend data
      summary.roi_trend = roiData.map(item => ({
        date: item.date,
        roi: item.roi,
        campaign_name: item.marketing_campaigns.campaign_name
      }));
    }

    return summary;
  }

  static async exportCampaigns(options: any) {
    // This would typically queue a background job for large exports
    const { data: campaigns, error } = await supabase
      .from('marketing_campaigns')
      .select(`
        *,
        campaign_analytics (
          reach,
          clicks,
          conversions,
          budget,
          spent
        )
      `);

    if (error) throw error;

    return {
      export_id: `export_${Date.now()}`,
      status: 'completed',
      download_url: `/api/v1/marketing/exports/${options.userId}/campaigns_${Date.now()}.${options.format}`,
      record_count: campaigns?.length || 0
    };
  }

  private static async calculatePreviousPeriod(filters: any) {
    const startDate = new Date(filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const endDate = new Date(filters.endDate || new Date());
    const periodLength = endDate.getTime() - startDate.getTime();
    
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = new Date(startDate);

    const { data } = await supabase
      .from('campaign_analytics')
      .select('clicks, impressions, conversions')
      .gte('date', prevStartDate.toISOString().split('T')[0])
      .lte('date', prevEndDate.toISOString().split('T')[0]);

    const prevPeriod = data?.reduce((acc, item) => ({
      clicks: acc.clicks + item.clicks,
      impressions: acc.impressions + item.impressions,
      conversions: acc.conversions + item.conversions
    }), { clicks: 0, impressions: 0, conversions: 0 }) || { clicks: 0, impressions: 0, conversions: 0 };

    return {
      ctr: prevPeriod.impressions > 0 ? (prevPeriod.clicks / prevPeriod.impressions) * 100 : 0,
      conversion_rate: prevPeriod.clicks > 0 ? (prevPeriod.conversions / prevPeriod.clicks) * 100 : 0
    };
  }

  private static groupAnalyticsByField(data: any[], field: string) {
    return data.reduce((acc, item) => {
      const key = item[field] || 'Unknown';
      if (!acc[key]) {
        acc[key] = {
          [field]: key,
          reach: 0,
          clicks: 0,
          conversions: 0,
          impressions: 0
        };
      }
      
      acc[key].reach += item.reach || 0;
      acc[key].clicks += item.clicks || 0;
      acc[key].conversions += item.conversions || 0;
      acc[key].impressions += item.impressions || 0;
      
      return acc;
    }, {});
  }
}
```

---

## Frontend Integration

### API Service: `frontend/src/services/marketingService.ts`

```typescript
import { apiClient } from './apiClient';

export class MarketingService {
  static async getDashboardMetrics(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const response = await apiClient.get(`/api/v1/marketing/dashboard?${params.toString()}`);
    return response.data;
  }

  static async getCampaignAnalytics(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const response = await apiClient.get(`/api/v1/marketing/analytics?${params.toString()}`);
    return response.data;
  }

  static async getCampaignById(campaignId: string) {
    const response = await apiClient.get(`/api/v1/marketing/campaigns/${campaignId}`);
    return response.data;
  }

  static async getChannelPerformance(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const response = await apiClient.get(`/api/v1/marketing/channels/performance?${params.toString()}`);
    return response.data;
  }

  static async getMarketingActivity(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const response = await apiClient.get(`/api/v1/marketing/activity?${params.toString()}`);
    return response.data;
  }

  static async getPerformanceSummary(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const response = await apiClient.get(`/api/v1/marketing/performance/summary?${params.toString()}`);
    return response.data;
  }

  static async exportCampaigns(format = 'csv', filters: any = {}) {
    const params = new URLSearchParams();
    params.append('format', format);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    const response = await apiClient.get(`/api/v1/marketing/export/campaigns?${params.toString()}`);
    return response.data;
  }
}
```

---

## Implementation Plan

### Step 1: Database Setup
**Files to create:**
- `backend/supabase/migrations/002_marketing_dashboard_tables.sql`

**Tasks:**
1. Create channel_performance, campaign_activity_feed, roi_metrics tables
2. Add performance indexes
3. Create marketing_dashboard_metrics view
4. Create calculate_campaign_roi function

### Step 2: Backend Services
**Files to create:**
- `backend/src/services/marketing.service.ts`
- `backend/src/controllers/marketing.controller.ts`
- `backend/src/routes/marketing.routes.ts`

**Tasks:**
1. Implement MarketingService with all analytics functions
2. Add dashboard metrics calculation
3. Create export functionality
4. Add real-time updates capability

### Step 3: Frontend Integration
**Files to create:**
- `frontend/src/services/marketingService.ts`
- `frontend/src/hooks/useMarketingDashboard.ts`

**Tasks:**
1. Create API service layer
2. Implement React hooks for state management
3. Add real-time polling for metrics updates
4. Test all marketing endpoints

### Step 4: Role-Based Access Control
**Files to update:**
- `backend/src/middleware/rbac.ts`

**Tasks:**
1. Add marketing-specific permissions
2. Configure role-based route access
3. Test permission enforcement

### Step 5: Real-time Updates
**Files to create:**
- `backend/src/services/websocket.service.ts`

**Tasks:**
1. Implement WebSocket for real-time metrics
2. Add event broadcasting for campaign updates
3. Create frontend WebSocket client

### Acceptance Criteria
- Dashboard displays accurate marketing metrics
- Campaign analytics load with proper filtering
- Channel performance shows aggregated data
- Real-time updates work correctly
- Export functionality generates proper reports
- RBAC prevents unauthorized access

This implementation provides a comprehensive marketing dashboard with real-time analytics, campaign management, and detailed performance tracking for enterprise marketing teams.
