# Campaign Analytics Backend Integration Guide

## Overview
This guide provides a complete backend implementation for the CampaignAnalytics module, focusing on marketing campaign performance analytics, data aggregation, and real-time tracking. This module differs from others by requiring server-side analytics aggregation and chart-ready data formatting.

## Table of Contents
1. [Database Schema & Migrations](#database-schema--migrations)
2. [API Endpoints & Routes](#api-endpoints--routes)
3. [Controllers & Services](#controllers--services)
4. [Analytics Aggregation](#analytics-aggregation)
5. [Export & Data Processing](#export--data-processing)
6. [Real-time Updates](#real-time-updates)
7. [Frontend Integration](#frontend-integration)
8. [Implementation Steps](#implementation-steps)

---

## Database Schema & Migrations

### Enhanced Campaign Analytics Table

```sql
-- Add segmentation fields to campaign_analytics table
ALTER TABLE campaign_analytics 
ADD COLUMN IF NOT EXISTS audience_segment VARCHAR(100),
ADD COLUMN IF NOT EXISTS channel VARCHAR(50),
ADD COLUMN IF NOT EXISTS device_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS referrer_url TEXT,
ADD COLUMN IF NOT EXISTS session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_date ON campaign_analytics(campaign_id, created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_event_type ON campaign_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_audience ON campaign_analytics(audience_segment);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_channel ON campaign_analytics(channel);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_device ON campaign_analytics(device_type);
```

### Campaign Analytics Aggregation Views

```sql
-- Create daily campaign analytics view
CREATE OR REPLACE VIEW campaign_analytics_daily AS
SELECT 
    campaign_id,
    DATE(created_at) as analytics_date,
    COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views,
    COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks,
    COUNT(CASE WHEN event_type = 'conversion' THEN 1 END) as conversions,
    COUNT(CASE WHEN event_type = 'impression' THEN 1 END) as impressions,
    ROUND(
        (COUNT(CASE WHEN event_type = 'click' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(CASE WHEN event_type = 'view' THEN 1 END), 0)) * 100, 
        2
    ) as click_through_rate,
    ROUND(
        (COUNT(CASE WHEN event_type = 'conversion' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(CASE WHEN event_type = 'click' THEN 1 END), 0)) * 100, 
        2
    ) as conversion_rate
FROM campaign_analytics
GROUP BY campaign_id, DATE(created_at);

-- Create campaign summary view
CREATE OR REPLACE VIEW campaign_analytics_summary AS
SELECT 
    campaign_id,
    COUNT(CASE WHEN event_type = 'view' THEN 1 END) as total_views,
    COUNT(CASE WHEN event_type = 'click' THEN 1 END) as total_clicks,
    COUNT(CASE WHEN event_type = 'conversion' THEN 1 END) as total_conversions,
    COUNT(CASE WHEN event_type = 'impression' THEN 1 END) as total_impressions,
    ROUND(
        (COUNT(CASE WHEN event_type = 'click' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(CASE WHEN event_type = 'view' THEN 1 END), 0)) * 100, 
        2
    ) as click_through_rate,
    ROUND(
        (COUNT(CASE WHEN event_type = 'conversion' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(CASE WHEN event_type = 'click' THEN 1 END), 0)) * 100, 
        2
    ) as conversion_rate,
    MIN(created_at) as first_event,
    MAX(created_at) as last_event
FROM campaign_analytics
GROUP BY campaign_id;

-- Create campaign analytics with segmentation
CREATE OR REPLACE VIEW campaign_analytics_segmented AS
SELECT 
    campaign_id,
    DATE(created_at) as analytics_date,
    audience_segment,
    channel,
    device_type,
    COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views,
    COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks,
    COUNT(CASE WHEN event_type = 'conversion' THEN 1 END) as conversions,
    ROUND(
        (COUNT(CASE WHEN event_type = 'click' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(CASE WHEN event_type = 'view' THEN 1 END), 0)) * 100, 
        2
    ) as click_through_rate,
    ROUND(
        (COUNT(CASE WHEN event_type = 'conversion' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(CASE WHEN event_type = 'click' THEN 1 END), 0)) * 100, 
        2
    ) as conversion_rate
FROM campaign_analytics
GROUP BY campaign_id, DATE(created_at), audience_segment, channel, device_type;
```

### Analytics Aggregation Functions

```sql
-- Function to get campaign analytics with date range
CREATE OR REPLACE FUNCTION get_campaign_analytics(
    p_campaign_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    p_end_date DATE DEFAULT CURRENT_DATE,
    p_group_by VARCHAR(20) DEFAULT 'day'
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_daily_stats JSONB;
    v_summary JSONB;
    v_period_change JSONB;
    v_previous_period_start DATE;
    v_previous_period_end DATE;
BEGIN
    -- Calculate previous period dates for comparison
    v_previous_period_start := p_start_date - (p_end_date - p_start_date + 1);
    v_previous_period_end := p_start_date - 1;
    
    -- Get daily stats
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', analytics_date,
            'views', views,
            'clicks', clicks,
            'conversions', conversions,
            'impressions', impressions,
            'click_through_rate', click_through_rate,
            'conversion_rate', conversion_rate
        ) ORDER BY analytics_date
    ) INTO v_daily_stats
    FROM campaign_analytics_daily
    WHERE campaign_id = p_campaign_id
    AND analytics_date BETWEEN p_start_date AND p_end_date;
    
    -- Get summary stats
    SELECT jsonb_build_object(
        'total_views', COALESCE(SUM(views), 0),
        'total_clicks', COALESCE(SUM(clicks), 0),
        'total_conversions', COALESCE(SUM(conversions), 0),
        'total_impressions', COALESCE(SUM(impressions), 0),
        'click_through_rate', ROUND(
            (COALESCE(SUM(clicks), 0)::DECIMAL / 
             NULLIF(COALESCE(SUM(views), 0), 0)) * 100, 
            2
        ),
        'conversion_rate', ROUND(
            (COALESCE(SUM(conversions), 0)::DECIMAL / 
             NULLIF(COALESCE(SUM(clicks), 0), 0)) * 100, 
            2
        )
    ) INTO v_summary
    FROM campaign_analytics_daily
    WHERE campaign_id = p_campaign_id
    AND analytics_date BETWEEN p_start_date AND p_end_date;
    
    -- Get previous period stats for comparison
    SELECT jsonb_build_object(
        'views', COALESCE(SUM(views), 0),
        'clicks', COALESCE(SUM(clicks), 0),
        'conversions', COALESCE(SUM(conversions), 0),
        'impressions', COALESCE(SUM(impressions), 0)
    ) INTO v_period_change
    FROM campaign_analytics_daily
    WHERE campaign_id = p_campaign_id
    AND analytics_date BETWEEN v_previous_period_start AND v_previous_period_end;
    
    -- Calculate period-over-period changes
    v_period_change := jsonb_build_object(
        'views', CASE 
            WHEN (v_period_change->>'views')::DECIMAL > 0 THEN
                ROUND(((v_summary->>'total_views')::DECIMAL - (v_period_change->>'views')::DECIMAL) / 
                      (v_period_change->>'views')::DECIMAL * 100, 2)
            ELSE 0
        END,
        'clicks', CASE 
            WHEN (v_period_change->>'clicks')::DECIMAL > 0 THEN
                ROUND(((v_summary->>'total_clicks')::DECIMAL - (v_period_change->>'clicks')::DECIMAL) / 
                      (v_period_change->>'clicks')::DECIMAL * 100, 2)
            ELSE 0
        END,
        'conversions', CASE 
            WHEN (v_period_change->>'conversions')::DECIMAL > 0 THEN
                ROUND(((v_summary->>'total_conversions')::DECIMAL - (v_period_change->>'conversions')::DECIMAL) / 
                      (v_period_change->>'conversions')::DECIMAL * 100, 2)
            ELSE 0
        END,
        'ctr', CASE 
            WHEN (v_period_change->>'clicks')::DECIMAL > 0 AND (v_period_change->>'views')::DECIMAL > 0 THEN
                ROUND(
                    ((v_summary->>'click_through_rate')::DECIMAL - 
                     ROUND((v_period_change->>'clicks')::DECIMAL / (v_period_change->>'views')::DECIMAL * 100, 2)) / 
                    ROUND((v_period_change->>'clicks')::DECIMAL / (v_period_change->>'views')::DECIMAL * 100, 2) * 100, 
                    2
                )
            ELSE 0
        END
    );
    
    -- Build final result
    v_result := jsonb_build_object(
        'summary', v_summary,
        'daily_stats', COALESCE(v_daily_stats, '[]'::jsonb),
        'period_change', v_period_change
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to get multi-campaign comparison
CREATE OR REPLACE FUNCTION get_campaign_comparison(
    p_campaign_ids UUID[],
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'campaign_id', campaign_id,
            'campaign_name', mc.campaign_name,
            'total_views', total_views,
            'total_clicks', total_clicks,
            'total_conversions', total_conversions,
            'click_through_rate', click_through_rate,
            'conversion_rate', conversion_rate
        )
    ) INTO v_result
    FROM campaign_analytics_summary cas
    JOIN marketing_campaigns mc ON cas.campaign_id = mc.id
    WHERE cas.campaign_id = ANY(p_campaign_ids);
    
    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;
```

### Event Tracking Function

```sql
-- Function to track campaign events
CREATE OR REPLACE FUNCTION track_campaign_event(
    p_campaign_id UUID,
    p_event_type VARCHAR(50),
    p_event_data JSONB DEFAULT '{}',
    p_audience_segment VARCHAR(100) DEFAULT NULL,
    p_channel VARCHAR(50) DEFAULT NULL,
    p_device_type VARCHAR(50) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_referrer_url TEXT DEFAULT NULL,
    p_session_id VARCHAR(255) DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_event_id UUID;
BEGIN
    -- Insert the event
    INSERT INTO campaign_analytics (
        campaign_id,
        event_type,
        event_data,
        audience_segment,
        channel,
        device_type,
        user_agent,
        ip_address,
        referrer_url,
        session_id,
        user_id,
        created_at
    ) VALUES (
        p_campaign_id,
        p_event_type,
        p_event_data,
        p_audience_segment,
        p_channel,
        p_device_type,
        p_user_agent,
        p_ip_address,
        p_referrer_url,
        p_session_id,
        p_user_id,
        NOW()
    ) RETURNING id INTO v_event_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'event_id', v_event_id,
        'message', 'Event tracked successfully'
    );
END;
$$ LANGUAGE plpgsql;
```

---

## API Endpoints & Routes

### Enhanced Route File: `backend/src/routes/marketing.routes.ts`

```typescript
import { Router } from 'express';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as campaignController from '../controllers/marketing/campaign.controller';
import * as analyticsController from '../controllers/marketing/analytics.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Campaign Management Routes
router.get('/admin/campaigns', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('campaigns.read'),
  asyncHandler(campaignController.getCampaigns)
);

router.get('/admin/campaigns/:id', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('campaigns.read'),
  asyncHandler(campaignController.getCampaignById)
);

router.post('/admin/campaigns', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('campaigns.create'),
  asyncHandler(campaignController.createCampaign)
);

router.put('/admin/campaigns/:id', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('campaigns.update'),
  asyncHandler(campaignController.updateCampaign)
);

// Campaign Analytics Routes
router.get('/admin/analytics/campaigns/:id', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('analytics.read'),
  asyncHandler(analyticsController.getCampaignAnalytics)
);

router.get('/admin/analytics/campaigns/:id/summary', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('analytics.read'),
  asyncHandler(analyticsController.getCampaignSummary)
);

router.get('/admin/analytics/campaigns/:id/daily', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('analytics.read'),
  asyncHandler(analyticsController.getCampaignDailyStats)
);

router.get('/admin/analytics/campaigns/:id/segmented', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('analytics.read'),
  asyncHandler(analyticsController.getCampaignSegmentedStats)
);

router.get('/admin/analytics/compare', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('analytics.read'),
  asyncHandler(analyticsController.getCampaignComparison)
);

// Analytics Export
router.get('/admin/analytics/export', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('analytics.export'),
  asyncHandler(analyticsController.exportAnalytics)
);

// Event Tracking (Public endpoint for frontend tracking)
router.post('/track-event', 
  asyncHandler(analyticsController.trackEvent)
);

// Real-time Analytics
router.get('/admin/analytics/stream', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('analytics.read'),
  asyncHandler(analyticsController.getAnalyticsStream)
);

export default router;
```

---

## Controllers & Services

### Analytics Controller: `backend/src/controllers/marketing/analytics.controller.ts`

```typescript
import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AnalyticsService } from '../../services/marketing/analytics.service';
import { asyncHandler } from '../../middleware/errorHandler';

export class AnalyticsController {
  // Get campaign analytics with date range
  static getCampaignAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const {
      date_range = '7d',
      start_date,
      end_date,
      group_by = 'day',
      metrics = 'views,clicks,conversions',
      audience_segment,
      channel,
      device_type
    } = req.query;

    // Calculate date range
    const dateRange = AnalyticsService.calculateDateRange(
      date_range as string,
      start_date as string,
      end_date as string
    );

    const result = await AnalyticsService.getCampaignAnalytics(id, {
      start_date: dateRange.start,
      end_date: dateRange.end,
      group_by: group_by as string,
      metrics: (metrics as string).split(','),
      audience_segment: audience_segment as string,
      channel: channel as string,
      device_type: device_type as string
    });
    
    res.json({
      success: true,
      data: result
    });
  });

  // Get campaign summary
  static getCampaignSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { date_range = '7d', start_date, end_date } = req.query;

    const dateRange = AnalyticsService.calculateDateRange(
      date_range as string,
      start_date as string,
      end_date as string
    );

    const result = await AnalyticsService.getCampaignSummary(id, {
      start_date: dateRange.start,
      end_date: dateRange.end
    });
    
    res.json({
      success: true,
      data: result
    });
  });

  // Get daily stats
  static getCampaignDailyStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { date_range = '7d', start_date, end_date } = req.query;

    const dateRange = AnalyticsService.calculateDateRange(
      date_range as string,
      start_date as string,
      end_date as string
    );

    const result = await AnalyticsService.getCampaignDailyStats(id, {
      start_date: dateRange.start,
      end_date: dateRange.end
    });
    
    res.json({
      success: true,
      data: result
    });
  });

  // Get segmented stats
  static getCampaignSegmentedStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { 
      date_range = '7d', 
      start_date, 
      end_date,
      segment_by = 'audience_segment'
    } = req.query;

    const dateRange = AnalyticsService.calculateDateRange(
      date_range as string,
      start_date as string,
      end_date as string
    );

    const result = await AnalyticsService.getCampaignSegmentedStats(id, {
      start_date: dateRange.start,
      end_date: dateRange.end,
      segment_by: segment_by as string
    });
    
    res.json({
      success: true,
      data: result
    });
  });

  // Get campaign comparison
  static getCampaignComparison = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { 
      campaign_ids,
      date_range = '7d',
      start_date,
      end_date
    } = req.query;

    if (!campaign_ids) {
      return res.status(400).json({
        success: false,
        message: 'campaign_ids is required'
      });
    }

    const dateRange = AnalyticsService.calculateDateRange(
      date_range as string,
      start_date as string,
      end_date as string
    );

    const result = await AnalyticsService.getCampaignComparison(
      (campaign_ids as string).split(','),
      {
        start_date: dateRange.start,
        end_date: dateRange.end
      }
    );
    
    res.json({
      success: true,
      data: result
    });
  });

  // Export analytics
  static exportAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      campaign_id,
      format = 'csv',
      date_range = '7d',
      start_date,
      end_date,
      metrics = 'views,clicks,conversions',
      group_by = 'day'
    } = req.query;

    if (!campaign_id) {
      return res.status(400).json({
        success: false,
        message: 'campaign_id is required'
      });
    }

    const dateRange = AnalyticsService.calculateDateRange(
      date_range as string,
      start_date as string,
      end_date as string
    );

    const result = await AnalyticsService.exportAnalytics({
      campaign_id: campaign_id as string,
      format: format as string,
      start_date: dateRange.start,
      end_date: dateRange.end,
      metrics: (metrics as string).split(','),
      group_by: group_by as string
    });
    
    res.setHeader('Content-Type', format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="campaign_analytics_${campaign_id}_${dateRange.start}.${format === 'excel' ? 'xlsx' : 'csv'}"`);
    
    res.send(result);
  });

  // Track event
  static trackEvent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      campaign_id,
      event_type,
      event_data = {},
      audience_segment,
      channel,
      device_type,
      user_agent,
      ip_address,
      referrer_url,
      session_id,
      user_id
    } = req.body;

    if (!campaign_id || !event_type) {
      return res.status(400).json({
        success: false,
        message: 'campaign_id and event_type are required'
      });
    }

    const result = await AnalyticsService.trackEvent({
      campaign_id,
      event_type,
      event_data,
      audience_segment,
      channel,
      device_type,
      user_agent,
      ip_address,
      referrer_url,
      session_id,
      user_id
    });
    
    res.json({
      success: true,
      data: result
    });
  });

  // Get analytics stream
  static getAnalyticsStream = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { 
      campaign_id,
      last_updated,
      limit = 50
    } = req.query;
    
    const result = await AnalyticsService.getAnalyticsStream({
      campaign_id: campaign_id as string,
      last_updated: last_updated as string,
      limit: parseInt(limit as string)
    });
    
    res.json({
      success: true,
      data: result
    });
  });
}
```

### Analytics Service: `backend/src/services/marketing/analytics.service.ts`

```typescript
import { supabaseAdmin } from '../../config/supabaseClient';
import { ExportService } from '../export.service';

export interface DateRange {
  start: string;
  end: string;
}

export interface AnalyticsFilters {
  start_date: string;
  end_date: string;
  group_by?: string;
  metrics?: string[];
  audience_segment?: string;
  channel?: string;
  device_type?: string;
}

export interface EventTrackingData {
  campaign_id: string;
  event_type: string;
  event_data?: any;
  audience_segment?: string;
  channel?: string;
  device_type?: string;
  user_agent?: string;
  ip_address?: string;
  referrer_url?: string;
  session_id?: string;
  user_id?: string;
}

export class AnalyticsService {
  // Calculate date range from period string
  static calculateDateRange(
    dateRange: string,
    startDate?: string,
    endDate?: string
  ): DateRange {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (startDate && endDate) {
      return {
        start: startDate,
        end: endDate
      };
    }

    switch (dateRange) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }

  // Get campaign analytics with aggregation
  static async getCampaignAnalytics(campaignId: string, filters: AnalyticsFilters) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_campaign_analytics', {
          p_campaign_id: campaignId,
          p_start_date: filters.start_date,
          p_end_date: filters.end_date,
          p_group_by: filters.group_by || 'day'
        });

      if (error) throw error;

      // Get campaign details
      const { data: campaign, error: campaignError } = await supabaseAdmin
        .from('marketing_campaigns')
        .select('id, campaign_name, template_type, is_active, created_at')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      return {
        campaign,
        ...data
      };
    } catch (error) {
      throw new Error(`Failed to fetch campaign analytics: ${error}`);
    }
  }

  // Get campaign summary
  static async getCampaignSummary(campaignId: string, filters: AnalyticsFilters) {
    try {
      const { data, error } = await supabaseAdmin
        .from('campaign_analytics_summary')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();

      if (error) throw error;

      // Get campaign details
      const { data: campaign, error: campaignError } = await supabaseAdmin
        .from('marketing_campaigns')
        .select('id, campaign_name, template_type, is_active')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      return {
        campaign,
        summary: data
      };
    } catch (error) {
      throw new Error(`Failed to fetch campaign summary: ${error}`);
    }
  }

  // Get daily stats
  static async getCampaignDailyStats(campaignId: string, filters: AnalyticsFilters) {
    try {
      const { data, error } = await supabaseAdmin
        .from('campaign_analytics_daily')
        .select('*')
        .eq('campaign_id', campaignId)
        .gte('analytics_date', filters.start_date)
        .lte('analytics_date', filters.end_date)
        .order('analytics_date', { ascending: true });

      if (error) throw error;

      return {
        daily_stats: data || []
      };
    } catch (error) {
      throw new Error(`Failed to fetch daily stats: ${error}`);
    }
  }

  // Get segmented stats
  static async getCampaignSegmentedStats(campaignId: string, filters: AnalyticsFilters & { segment_by?: string }) {
    try {
      let query = supabaseAdmin
        .from('campaign_analytics_segmented')
        .select('*')
        .eq('campaign_id', campaignId)
        .gte('analytics_date', filters.start_date)
        .lte('analytics_date', filters.end_date);

      // Apply additional filters
      if (filters.audience_segment) {
        query = query.eq('audience_segment', filters.audience_segment);
      }
      if (filters.channel) {
        query = query.eq('channel', filters.channel);
      }
      if (filters.device_type) {
        query = query.eq('device_type', filters.device_type);
      }

      const { data, error } = await query.order('analytics_date', { ascending: true });

      if (error) throw error;

      // Group by segment
      const groupedData = data?.reduce((acc: any, record: any) => {
        const segmentKey = record[filters.segment_by || 'audience_segment'] || 'unknown';
        if (!acc[segmentKey]) {
          acc[segmentKey] = [];
        }
        acc[segmentKey].push(record);
        return acc;
      }, {}) || {};

      return {
        segmented_stats: groupedData
      };
    } catch (error) {
      throw new Error(`Failed to fetch segmented stats: ${error}`);
    }
  }

  // Get campaign comparison
  static async getCampaignComparison(campaignIds: string[], filters: AnalyticsFilters) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_campaign_comparison', {
          p_campaign_ids: campaignIds,
          p_start_date: filters.start_date,
          p_end_date: filters.end_date
        });

      if (error) throw error;

      return {
        comparison: data || []
      };
    } catch (error) {
      throw new Error(`Failed to fetch campaign comparison: ${error}`);
    }
  }

  // Track event
  static async trackEvent(eventData: EventTrackingData) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('track_campaign_event', {
          p_campaign_id: eventData.campaign_id,
          p_event_type: eventData.event_type,
          p_event_data: eventData.event_data || {},
          p_audience_segment: eventData.audience_segment,
          p_channel: eventData.channel,
          p_device_type: eventData.device_type,
          p_user_agent: eventData.user_agent,
          p_ip_address: eventData.ip_address,
          p_referrer_url: eventData.referrer_url,
          p_session_id: eventData.session_id,
          p_user_id: eventData.user_id
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to track event: ${error}`);
    }
  }

  // Export analytics
  static async exportAnalytics(filters: any) {
    try {
      // Get analytics data
      const { data: analytics, error } = await supabaseAdmin
        .from('campaign_analytics_daily')
        .select('*')
        .eq('campaign_id', filters.campaign_id)
        .gte('analytics_date', filters.start_date)
        .lte('analytics_date', filters.end_date)
        .order('analytics_date', { ascending: true });

      if (error) throw error;

      // Get campaign details
      const { data: campaign, error: campaignError } = await supabaseAdmin
        .from('marketing_campaigns')
        .select('campaign_name, template_type')
        .eq('id', filters.campaign_id)
        .single();

      if (campaignError) throw campaignError;

      // Transform data for export
      const exportData = analytics?.map(record => ({
        'Date': record.analytics_date,
        'Campaign Name': campaign.campaign_name,
        'Template Type': campaign.template_type,
        'Views': record.views,
        'Clicks': record.clicks,
        'Conversions': record.conversions,
        'Impressions': record.impressions,
        'Click Through Rate (%)': record.click_through_rate,
        'Conversion Rate (%)': record.conversion_rate
      })) || [];

      // Generate export file
      if (filters.format === 'excel') {
        return await ExportService.generateExcel(exportData, 'campaign_analytics');
      } else {
        return await ExportService.generateCSV(exportData, 'campaign_analytics');
      }
    } catch (error) {
      throw new Error(`Failed to export analytics: ${error}`);
    }
  }

  // Get analytics stream
  static async getAnalyticsStream(filters: any) {
    try {
      let query = supabaseAdmin
        .from('campaign_analytics')
        .select(`
          id,
          campaign_id,
          event_type,
          event_data,
          audience_segment,
          channel,
          device_type,
          created_at,
          marketing_campaigns (
            campaign_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(filters.limit || 50);

      if (filters.campaign_id) {
        query = query.eq('campaign_id', filters.campaign_id);
      }
      if (filters.last_updated) {
        query = query.gt('created_at', filters.last_updated);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        events: data || [],
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to fetch analytics stream: ${error}`);
    }
  }
}
```

---

## Frontend Integration

### API Service: `frontend/src/services/analyticsService.ts`

```typescript
import { apiClient } from './apiClient';

export interface AnalyticsFilters {
  date_range?: '7d' | '30d' | '90d' | '1y';
  start_date?: string;
  end_date?: string;
  group_by?: 'day' | 'week' | 'month';
  metrics?: string[];
  audience_segment?: string;
  channel?: string;
  device_type?: string;
}

export class AnalyticsService {
  // Get campaign analytics
  static async getCampaignAnalytics(campaignId: string, filters: AnalyticsFilters = {}) {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof AnalyticsFilters] !== undefined) {
        const value = filters[key as keyof AnalyticsFilters];
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value as string);
        }
      }
    });

    const response = await apiClient.get(`/v1/marketing/admin/analytics/campaigns/${campaignId}?${params.toString()}`);
    return response.data;
  }

  // Get campaign summary
  static async getCampaignSummary(campaignId: string, filters: AnalyticsFilters = {}) {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof AnalyticsFilters] !== undefined) {
        params.append(key, filters[key as keyof AnalyticsFilters] as string);
      }
    });

    const response = await apiClient.get(`/v1/marketing/admin/analytics/campaigns/${campaignId}/summary?${params.toString()}`);
    return response.data;
  }

  // Get daily stats
  static async getCampaignDailyStats(campaignId: string, filters: AnalyticsFilters = {}) {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof AnalyticsFilters] !== undefined) {
        params.append(key, filters[key as keyof AnalyticsFilters] as string);
      }
    });

    const response = await apiClient.get(`/v1/marketing/admin/analytics/campaigns/${campaignId}/daily?${params.toString()}`);
    return response.data;
  }

  // Get segmented stats
  static async getCampaignSegmentedStats(campaignId: string, filters: AnalyticsFilters & { segment_by?: string } = {}) {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof AnalyticsFilters] !== undefined) {
        params.append(key, filters[key as keyof AnalyticsFilters] as string);
      }
    });

    const response = await apiClient.get(`/v1/marketing/admin/analytics/campaigns/${campaignId}/segmented?${params.toString()}`);
    return response.data;
  }

  // Get campaign comparison
  static async getCampaignComparison(campaignIds: string[], filters: AnalyticsFilters = {}) {
    const params = new URLSearchParams();
    params.append('campaign_ids', campaignIds.join(','));
    
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof AnalyticsFilters] !== undefined) {
        params.append(key, filters[key as keyof AnalyticsFilters] as string);
      }
    });

    const response = await apiClient.get(`/v1/marketing/admin/analytics/compare?${params.toString()}`);
    return response.data;
  }

  // Export analytics
  static async exportAnalytics(filters: any, format: 'csv' | 'excel' = 'csv') {
    const params = new URLSearchParams();
    params.append('format', format);
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });

    const response = await apiClient.get(`/v1/marketing/admin/analytics/export?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  // Track event
  static async trackEvent(eventData: any) {
    const response = await apiClient.post('/v1/marketing/track-event', eventData);
    return response.data;
  }

  // Get analytics stream
  static async getAnalyticsStream(filters: any = {}) {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });

    const response = await apiClient.get(`/v1/marketing/admin/analytics/stream?${params.toString()}`);
    return response.data;
  }
}
```

### React Hook: `frontend/src/hooks/useCampaignAnalytics.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { AnalyticsService, AnalyticsFilters } from '../services/analyticsService';

export const useCampaignAnalytics = (campaignId: string, filters: AnalyticsFilters = {}) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!campaignId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await AnalyticsService.getCampaignAnalytics(campaignId, filters);
      setAnalytics(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [campaignId, filters]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const exportAnalytics = async (format: 'csv' | 'excel' = 'csv') => {
    try {
      const blob = await AnalyticsService.exportAnalytics({
        campaign_id: campaignId,
        ...filters
      }, format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `campaign_analytics_${campaignId}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export analytics');
      throw err;
    }
  };

  const trackEvent = async (eventType: string, eventData: any = {}) => {
    try {
      await AnalyticsService.trackEvent({
        campaign_id: campaignId,
        event_type: eventType,
        event_data: eventData,
        // Add additional tracking data as needed
        user_agent: navigator.userAgent,
        referrer_url: document.referrer,
        session_id: sessionStorage.getItem('session_id') || Date.now().toString()
      });
    } catch (err) {
      console.error('Failed to track event:', err);
    }
  };

  return {
    analytics,
    loading,
    error,
    fetchAnalytics,
    exportAnalytics,
    trackEvent
  };
};
```

---

## Implementation Steps

### Step 1: Database Setup
1. Run the SQL migrations to add segmentation fields
2. Create the analytics aggregation views
3. Create the analytics functions
4. Test the database functions

### Step 2: Backend Implementation
1. Create the `AnalyticsService` class
2. Create the `AnalyticsController` class
3. Update the `marketing.routes.ts` file
4. Add export functionality
5. Test all endpoints

### Step 3: Frontend Integration
1. Create the `analyticsService.ts` API service
2. Create the `useCampaignAnalytics.ts` React hook
3. Update your `CampaignAnalytics.tsx` component
4. Add event tracking functionality
5. Add export functionality
6. Add real-time updates

### Step 4: Testing
1. Test analytics data aggregation
2. Test chart data formatting
3. Test export functionality
4. Test event tracking
5. Test real-time updates
6. Test campaign comparison

This implementation provides a complete campaign analytics system with data aggregation, chart-ready formatting, real-time tracking, and comprehensive export capabilities.
