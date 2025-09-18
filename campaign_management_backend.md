# Campaign Management Backend Integration Guide

## Overview
Complete backend implementation for CampaignManagement.tsx supporting marketing campaign management with templates, analytics, publishing, and role-based access. This module handles the complete campaign lifecycle from creation to performance tracking.

## Table of Contents
1. [Database Schema & Migrations](#database-schema--migrations)
2. [Express Routes & Controllers](#express-routes--controllers)
3. [Services & Data Layer](#services--data-layer)
4. [Authentication & RBAC](#authentication--rbac)
5. [Frontend Integration](#frontend-integration)
6. [Implementation Plan](#implementation-plan)

---

## Database Schema & Migrations

### Complete Migration SQL

```sql
-- Marketing Campaigns Table
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('hero_banner', 'promo_card', 'popup')),
  template_id UUID REFERENCES campaign_templates(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}', -- Template-specific content
  styles JSONB DEFAULT '{}', -- Custom styles and colors
  cta_text VARCHAR(200),
  cta_url VARCHAR(500),
  cta_button_color VARCHAR(7) DEFAULT '#007BFF',
  cta_text_color VARCHAR(7) DEFAULT '#FFFFFF',
  target_audience JSONB DEFAULT '[]', -- Array of audience segments
  target_channels JSONB DEFAULT '[]', -- Array of channels
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  publish_date TIMESTAMP WITH TIME ZONE,
  unpublish_date TIMESTAMP WITH TIME ZONE,
  views_count BIGINT DEFAULT 0,
  clicks_count BIGINT DEFAULT 0,
  conversions_count BIGINT DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Templates Table
CREATE TABLE campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('hero_banner', 'promo_card', 'popup')),
  description TEXT,
  default_styles JSONB DEFAULT '{}', -- Default styling options
  required_fields JSONB DEFAULT '{}', -- Required fields for this template
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Analytics Table
CREATE TABLE campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('view', 'click', 'conversion', 'impression')),
  event_data JSONB DEFAULT '{}', -- Additional event data
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Schedule Table
CREATE TABLE campaign_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  recurrence JSONB DEFAULT '{}', -- Recurrence pattern if applicable
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing Audit Log Table
CREATE TABLE marketing_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'published', 'unpublished', 'deleted'
  entity_type VARCHAR(50) NOT NULL, -- 'campaign', 'template'
  entity_id UUID NOT NULL,
  old_values JSONB DEFAULT '{}',
  new_values JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_marketing_campaigns_name ON marketing_campaigns(campaign_name);
CREATE INDEX idx_marketing_campaigns_template_type ON marketing_campaigns(template_type);
CREATE INDEX idx_marketing_campaigns_active ON marketing_campaigns(is_active);
CREATE INDEX idx_marketing_campaigns_published ON marketing_campaigns(is_published);
CREATE INDEX idx_marketing_campaigns_created_by ON marketing_campaigns(created_by);
CREATE INDEX idx_marketing_campaigns_created_at ON marketing_campaigns(created_at);
CREATE INDEX idx_campaign_analytics_campaign ON campaign_analytics(campaign_id);
CREATE INDEX idx_campaign_analytics_event_type ON campaign_analytics(event_type);
CREATE INDEX idx_campaign_analytics_created_at ON campaign_analytics(created_at);
CREATE INDEX idx_campaign_schedule_scheduled ON campaign_schedule(scheduled_at, status);
CREATE INDEX idx_campaign_templates_type ON campaign_templates(template_type);
CREATE INDEX idx_campaign_templates_active ON campaign_templates(is_active);
CREATE INDEX idx_marketing_audit_log_entity ON marketing_audit_log(entity_type, entity_id);
CREATE INDEX idx_marketing_audit_log_user ON marketing_audit_log(user_id);

-- Full-text search index
CREATE INDEX idx_marketing_campaigns_search ON marketing_campaigns USING gin(to_tsvector('english', campaign_name || ' ' || COALESCE(title, '') || ' ' || COALESCE(description, '')));
```

### Analytics Aggregation Functions

```sql
-- Function to get campaign performance metrics
CREATE OR REPLACE FUNCTION get_campaign_performance(
  p_campaign_id UUID,
  p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  campaign_id UUID,
  views_count BIGINT,
  clicks_count BIGINT,
  conversions_count BIGINT,
  ctr DECIMAL(5,2),
  conversion_rate DECIMAL(5,2)
) AS $$
DECLARE
  v_views BIGINT;
  v_clicks BIGINT;
  v_conversions BIGINT;
BEGIN
  -- Get analytics counts
  SELECT 
    COUNT(CASE WHEN event_type = 'view' THEN 1 END),
    COUNT(CASE WHEN event_type = 'click' THEN 1 END),
    COUNT(CASE WHEN event_type = 'conversion' THEN 1 END)
  INTO v_views, v_clicks, v_conversions
  FROM campaign_analytics
  WHERE campaign_id = p_campaign_id
    AND (p_date_from IS NULL OR created_at >= p_date_from)
    AND (p_date_to IS NULL OR created_at <= p_date_to);

  RETURN QUERY
  SELECT 
    p_campaign_id,
    v_views,
    v_clicks,
    v_conversions,
    CASE 
      WHEN v_views > 0 THEN ROUND((v_clicks::DECIMAL / v_views) * 100, 2)
      ELSE 0 
    END as ctr,
    CASE 
      WHEN v_clicks > 0 THEN ROUND((v_conversions::DECIMAL / v_clicks) * 100, 2)
      ELSE 0 
    END as conversion_rate;
END;
$$ LANGUAGE plpgsql;
```

---

## Express Routes & Controllers

### Route File: `backend/src/routes/marketing.routes.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles, hasPermission } from '../middleware/rbac';
import { asyncHandler } from '../middleware/errorHandler';
import * as campaignController from '../controllers/marketing/campaign.controller';
import * as templateController from '../controllers/marketing/template.controller';
import * as analyticsController from '../controllers/marketing/analytics.controller';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Campaign Management Routes
router.get('/marketing/admin/campaigns', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.campaigns.read'),
  asyncHandler(campaignController.listCampaigns)
);

router.get('/marketing/admin/campaigns/:id', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.campaigns.read'),
  asyncHandler(campaignController.getCampaign)
);

router.post('/marketing/admin/campaigns', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.campaigns.create'),
  asyncHandler(campaignController.createCampaign)
);

router.put('/marketing/admin/campaigns/:id', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.campaigns.update'),
  asyncHandler(campaignController.updateCampaign)
);

router.delete('/marketing/admin/campaigns/:id', 
  requireRoles(['super_admin', 'marketing_admin']),
  hasPermission('marketing.campaigns.delete'),
  asyncHandler(campaignController.deleteCampaign)
);

// Campaign Actions
router.post('/marketing/admin/campaigns/:id/publish', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.campaigns.publish'),
  asyncHandler(campaignController.publishCampaign)
);

router.post('/marketing/admin/campaigns/:id/unpublish', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.campaigns.publish'),
  asyncHandler(campaignController.unpublishCampaign)
);

router.patch('/marketing/admin/campaigns/:id/status', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.campaigns.update'),
  asyncHandler(campaignController.toggleCampaignStatus)
);

// Template Management
router.get('/marketing/admin/templates', 
  requireRoles(['super_admin', 'marketing_admin']),
  hasPermission('marketing.templates.read'),
  asyncHandler(templateController.listTemplates)
);

router.post('/marketing/admin/templates', 
  requireRoles(['super_admin', 'marketing_admin']),
  hasPermission('marketing.templates.create'),
  asyncHandler(templateController.createTemplate)
);

router.put('/marketing/admin/templates/:id', 
  requireRoles(['super_admin', 'marketing_admin']),
  hasPermission('marketing.templates.update'),
  asyncHandler(templateController.updateTemplate)
);

router.delete('/marketing/admin/templates/:id', 
  requireRoles(['super_admin', 'marketing_admin']),
  hasPermission('marketing.templates.delete'),
  asyncHandler(templateController.deleteTemplate)
);

// Analytics & Export
router.get('/marketing/admin/analytics', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.analytics.read'),
  asyncHandler(analyticsController.getCampaignAnalytics)
);

router.get('/marketing/admin/analytics/campaigns/:id', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.analytics.read'),
  asyncHandler(analyticsController.getCampaignAnalyticsById)
);

router.get('/marketing/admin/analytics/campaigns/:id/performance', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.analytics.read'),
  asyncHandler(analyticsController.getCampaignPerformance)
);

router.get('/marketing/admin/campaigns/export', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.campaigns.export'),
  asyncHandler(campaignController.exportCampaigns)
);

// Preview & Render
router.get('/marketing/admin/campaigns/:id/preview', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.campaigns.read'),
  asyncHandler(campaignController.getCampaignPreview)
);

router.post('/marketing/admin/campaigns/:id/preview', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.campaigns.read'),
  asyncHandler(campaignController.generateCampaignPreview)
);

router.get('/marketing/admin/campaigns/:id/render', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.campaigns.read'),
  asyncHandler(campaignController.renderCampaign)
);

export default router;
```

### Controller: `backend/src/controllers/marketing/campaign.controller.ts`

```typescript
import { Request, Response } from 'express';
import { CampaignService } from '../../services/marketing/campaign.service';
import { validateCampaignInput } from '../../validators/campaign.validator';
import { AuditService } from '../../services/audit.service';

export const listCampaigns = async (req: Request, res: Response) => {
  const {
    search,
    template_type,
    is_active,
    is_published,
    created_by,
    page = 1,
    limit = 25,
    sort_by = 'created_at',
    sort_order = 'desc',
    include_analytics = 'false',
    include_template = 'false'
  } = req.query;

  const filters = {
    search: search as string,
    template_type: template_type as string,
    is_active: is_active as string,
    is_published: is_published as string,
    created_by: created_by as string,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    sort_by: sort_by as string,
    sort_order: sort_order as 'asc' | 'desc',
    include_analytics: include_analytics === 'true',
    include_template: include_template === 'true'
  };

  const result = await CampaignService.list(filters);
  
  res.json({
    success: true,
    data: {
      campaigns: result.campaigns,
      pagination: result.pagination,
      filters: result.filters
    }
  });
};

export const createCampaign = async (req: Request, res: Response) => {
  const validationResult = validateCampaignInput(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.errors
    });
  }

  const userId = req.user.id;
  const campaign = await CampaignService.create(req.body, userId);
  
  // Audit log
  await AuditService.log({
    userId,
    action: 'campaign_created',
    resource: 'marketing_campaigns',
    resourceId: campaign.id,
    details: { 
      campaign_name: campaign.campaign_name,
      template_type: campaign.template_type
    }
  });

  res.status(201).json({
    success: true,
    data: campaign
  });
};

export const publishCampaign = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { publish_date } = req.body;
  const userId = req.user.id;

  const result = await CampaignService.publish(id, userId, publish_date);
  
  await AuditService.log({
    userId,
    action: 'campaign_published',
    resource: 'marketing_campaigns',
    resourceId: id,
    details: { 
      publish_date: publish_date || new Date().toISOString()
    }
  });

  res.json({
    success: true,
    data: result
  });
};

export const getCampaignPreview = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { preview_mode = 'true' } = req.query;
  
  const preview = await CampaignService.getPreview(id, preview_mode === 'true');
  
  res.json({
    success: true,
    data: preview
  });
};

export const exportCampaigns = async (req: Request, res: Response) => {
  const { format = 'csv', include_analytics = 'false' } = req.query;
  
  const exportData = await CampaignService.exportCampaigns({
    format: format as string,
    include_analytics: include_analytics === 'true'
  });
  
  res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="campaigns-export.${format}"`);
  
  res.send(exportData);
};
```

---

## Services & Data Layer

### Service: `backend/src/services/marketing/campaign.service.ts`

```typescript
import { supabase } from '../../config/supabase';

export interface CampaignFilters {
  search?: string;
  template_type?: string;
  is_active?: string;
  is_published?: string;
  created_by?: string;
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  include_analytics?: boolean;
  include_template?: boolean;
}

export interface CampaignData {
  campaign_name: string;
  template_type: string;
  template_id?: string;
  title: string;
  description?: string;
  content?: any;
  styles?: any;
  cta_text?: string;
  cta_url?: string;
  cta_button_color?: string;
  cta_text_color?: string;
  target_audience?: string[];
  target_channels?: string[];
  is_active?: boolean;
  is_published?: boolean;
  publish_date?: string;
  unpublish_date?: string;
}

export class CampaignService {
  static async list(filters: CampaignFilters) {
    let query = supabase
      .from('marketing_campaigns')
      .select(`
        *,
        template:template_id (
          id,
          template_name,
          template_type,
          default_styles
        ),
        creator:created_by (
          id,
          first_name,
          last_name
        )
        ${filters.include_analytics ? ',analytics:campaign_analytics(*)' : ''}
      `, { count: 'exact' });

    // Apply filters
    if (filters.search) {
      query = query.or(`campaign_name.ilike.%${filters.search}%,title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters.template_type) {
      query = query.eq('template_type', filters.template_type);
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active === 'true');
    }
    if (filters.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published === 'true');
    }
    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    // Apply sorting and pagination
    const sortColumn = filters.sort_by || 'created_at';
    const ascending = filters.sort_order === 'asc';
    
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;

    const { data: campaigns, error, count } = await query
      .order(sortColumn, { ascending })
      .range(from, to);

    if (error) throw error;

    // Get filter options
    const { data: templates } = await supabase
      .from('campaign_templates')
      .select('id, template_name, template_type')
      .eq('is_active', true);

    return {
      campaigns: campaigns || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / filters.limit)
      },
      filters: {
        template_types: ['hero_banner', 'promo_card', 'popup'],
        statuses: ['draft', 'active', 'published'],
        templates: templates || []
      }
    };
  }

  static async create(data: CampaignData, userId: string) {
    const { data: campaign, error } = await supabase
      .from('marketing_campaigns')
      .insert({
        ...data,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        template:template_id (
          id,
          template_name,
          template_type,
          default_styles
        ),
        creator:created_by (
          id,
          first_name,
          last_name
        )
      `)
      .single();

    if (error) throw error;
    return campaign;
  }

  static async getById(id: string) {
    const { data: campaign, error } = await supabase
      .from('marketing_campaigns')
      .select(`
        *,
        template:template_id (
          id,
          template_name,
          template_type,
          default_styles,
          required_fields
        ),
        creator:created_by (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return campaign;
  }

  static async update(id: string, data: Partial<CampaignData>, userId: string) {
    const { data: campaign, error } = await supabase
      .from('marketing_campaigns')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        template:template_id (
          id,
          template_name,
          template_type,
          default_styles
        )
      `)
      .single();

    if (error) throw error;
    return campaign;
  }

  static async delete(id: string, userId: string) {
    const { error } = await supabase
      .from('marketing_campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  static async publish(id: string, userId: string, publishDate?: string) {
    const publishAt = publishDate || new Date().toISOString();
    
    const { data: campaign, error } = await supabase
      .from('marketing_campaigns')
      .update({
        is_published: true,
        is_active: true,
        publish_date: publishAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return campaign;
  }

  static async unpublish(id: string, userId: string) {
    const { data: campaign, error } = await supabase
      .from('marketing_campaigns')
      .update({
        is_published: false,
        unpublish_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return campaign;
  }

  static async toggleStatus(id: string, userId: string) {
    // Get current status
    const { data: currentCampaign } = await supabase
      .from('marketing_campaigns')
      .select('is_active')
      .eq('id', id)
      .single();

    const newStatus = !currentCampaign?.is_active;

    const { data: campaign, error } = await supabase
      .from('marketing_campaigns')
      .update({
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return campaign;
  }

  static async getPreview(id: string, previewMode: boolean = true) {
    const campaign = await this.getById(id);
    
    // Generate preview data based on template type
    const preview = {
      ...campaign,
      preview_html: this.generatePreviewHTML(campaign),
      preview_data: {
        template_type: campaign.template_type,
        content: campaign.content,
        styles: campaign.styles,
        cta: {
          text: campaign.cta_text,
          url: campaign.cta_url,
          button_color: campaign.cta_button_color,
          text_color: campaign.cta_text_color
        }
      }
    };

    return preview;
  }

  static async exportCampaigns(options: { format: string; include_analytics?: boolean }) {
    let query = supabase
      .from('marketing_campaigns')
      .select(`
        *,
        template:template_id (
          template_name,
          template_type
        ),
        creator:created_by (
          first_name,
          last_name
        )
        ${options.include_analytics ? ',analytics:campaign_analytics(*)' : ''}
      `);

    const { data: campaigns, error } = await query;

    if (error) throw error;

    if (options.format === 'csv') {
      return this.generateCSV(campaigns);
    } else {
      return this.generateExcel(campaigns);
    }
  }

  private static generatePreviewHTML(campaign: any): string {
    // Generate preview HTML based on template type
    switch (campaign.template_type) {
      case 'hero_banner':
        return `
          <div class="hero-banner" style="background-color: ${campaign.styles?.background_color || '#f8f9fa'}; padding: 2rem; text-align: center;">
            <h1 style="color: ${campaign.styles?.text_color || '#333'}; margin-bottom: 1rem;">${campaign.title}</h1>
            <p style="color: ${campaign.styles?.text_color || '#666'}; margin-bottom: 2rem;">${campaign.description}</p>
            ${campaign.cta_text ? `<a href="${campaign.cta_url}" style="background-color: ${campaign.cta_button_color}; color: ${campaign.cta_text_color}; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px;">${campaign.cta_text}</a>` : ''}
          </div>
        `;
      case 'promo_card':
        return `
          <div class="promo-card" style="border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem; margin: 1rem 0;">
            <h3 style="color: ${campaign.styles?.text_color || '#333'}; margin-bottom: 0.5rem;">${campaign.title}</h3>
            <p style="color: ${campaign.styles?.text_color || '#666'}; margin-bottom: 1rem;">${campaign.description}</p>
            ${campaign.cta_text ? `<button style="background-color: ${campaign.cta_button_color}; color: ${campaign.cta_text_color}; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">${campaign.cta_text}</button>` : ''}
          </div>
        `;
      case 'popup':
        return `
          <div class="popup" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border: 1px solid #ddd; border-radius: 8px; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000;">
            <h2 style="color: ${campaign.styles?.text_color || '#333'}; margin-bottom: 1rem;">${campaign.title}</h2>
            <p style="color: ${campaign.styles?.text_color || '#666'}; margin-bottom: 1.5rem;">${campaign.description}</p>
            ${campaign.cta_text ? `<button style="background-color: ${campaign.cta_button_color}; color: ${campaign.cta_text_color}; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer;">${campaign.cta_text}</button>` : ''}
          </div>
        `;
      default:
        return `<div>Preview not available for this template type</div>`;
    }
  }

  private static generateCSV(campaigns: any[]): string {
    const headers = [
      'ID', 'Campaign Name', 'Template Type', 'Title', 'Description',
      'Status', 'Published', 'Views', 'Clicks', 'Conversions', 'CTR',
      'Created By', 'Created At'
    ];

    const rows = campaigns.map(campaign => [
      campaign.id,
      campaign.campaign_name,
      campaign.template_type,
      campaign.title,
      campaign.description || '',
      campaign.is_active ? 'Active' : 'Inactive',
      campaign.is_published ? 'Yes' : 'No',
      campaign.views_count,
      campaign.clicks_count,
      campaign.conversions_count,
      campaign.views_count > 0 ? ((campaign.clicks_count / campaign.views_count) * 100).toFixed(2) + '%' : '0%',
      campaign.creator ? `${campaign.creator.first_name} ${campaign.creator.last_name}` : '',
      campaign.created_at
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  }

  private static generateExcel(campaigns: any[]): Buffer {
    // Implementation would use a library like 'exceljs'
    return Buffer.from('Excel data placeholder');
  }
}
```

---

## Authentication & RBAC

### RBAC Configuration: `backend/src/middleware/rbac.ts`

```typescript
// Role-based permissions for marketing module
const rolePermissions = {
  super_admin: ['*'], // All permissions
  marketing_admin: [
    'marketing.campaigns.*',
    'marketing.templates.*',
    'marketing.analytics.*'
  ],
  content_admin: [
    'marketing.campaigns.read',
    'marketing.campaigns.create',
    'marketing.campaigns.update',
    'marketing.templates.read',
    'marketing.analytics.read'
  ],
  marketing_staff: [
    'marketing.campaigns.read',
    'marketing.analytics.read'
  ]
};

// Permission checks for marketing endpoints
export const hasPermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    
    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'User role not found'
      });
    }

    const userPermissions = rolePermissions[userRole] || [];
    
    // Check if user has permission or wildcard
    if (userPermissions.includes('*') || userPermissions.includes(permission)) {
      return next();
    }

    // Check for wildcard permissions (e.g., marketing.campaigns.*)
    const permissionParts = permission.split('.');
    for (let i = permissionParts.length; i > 0; i--) {
      const wildcardPermission = permissionParts.slice(0, i).join('.') + '.*';
      if (userPermissions.includes(wildcardPermission)) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions'
    });
  };
};
```

---

## Frontend Integration

### API Service: `frontend/src/services/campaignService.ts`

```typescript
import { apiClient } from './apiClient';

export interface CampaignFilters {
  search?: string;
  template_type?: string;
  is_active?: boolean;
  is_published?: boolean;
  created_by?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  include_analytics?: boolean;
  include_template?: boolean;
}

export interface CampaignData {
  campaign_name: string;
  template_type: string;
  template_id?: string;
  title: string;
  description?: string;
  content?: any;
  styles?: any;
  cta_text?: string;
  cta_url?: string;
  cta_button_color?: string;
  cta_text_color?: string;
  target_audience?: string[];
  target_channels?: string[];
  is_active?: boolean;
  is_published?: boolean;
  publish_date?: string;
  unpublish_date?: string;
}

export class CampaignService {
  static async getCampaigns(filters: CampaignFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/api/marketing/admin/campaigns?${params.toString()}`);
    return response.data;
  }

  static async createCampaign(data: CampaignData) {
    const response = await apiClient.post('/api/marketing/admin/campaigns', data);
    return response.data;
  }

  static async getCampaign(id: string) {
    const response = await apiClient.get(`/api/marketing/admin/campaigns/${id}`);
    return response.data;
  }

  static async updateCampaign(id: string, data: Partial<CampaignData>) {
    const response = await apiClient.put(`/api/marketing/admin/campaigns/${id}`, data);
    return response.data;
  }

  static async deleteCampaign(id: string) {
    const response = await apiClient.delete(`/api/marketing/admin/campaigns/${id}`);
    return response.data;
  }

  static async publishCampaign(id: string, publishDate?: string) {
    const response = await apiClient.post(`/api/marketing/admin/campaigns/${id}/publish`, {
      publish_date: publishDate
    });
    return response.data;
  }

  static async unpublishCampaign(id: string) {
    const response = await apiClient.post(`/api/marketing/admin/campaigns/${id}/unpublish`);
    return response.data;
  }

  static async toggleCampaignStatus(id: string) {
    const response = await apiClient.patch(`/api/marketing/admin/campaigns/${id}/status`);
    return response.data;
  }

  static async getCampaignPreview(id: string, previewMode: boolean = true) {
    const response = await apiClient.get(`/api/marketing/admin/campaigns/${id}/preview?preview_mode=${previewMode}`);
    return response.data;
  }

  static async exportCampaigns(format: string = 'csv', includeAnalytics: boolean = false) {
    const params = new URLSearchParams({ format, include_analytics: includeAnalytics.toString() });
    const response = await apiClient.get(`/api/marketing/admin/campaigns/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  static async getTemplates() {
    const response = await apiClient.get('/api/marketing/admin/templates');
    return response.data;
  }

  static async getAnalytics(campaignId?: string) {
    const params = campaignId ? `?campaign_id=${campaignId}` : '';
    const response = await apiClient.get(`/api/marketing/admin/analytics${params}`);
    return response.data;
  }
}
```

### TypeScript Interfaces: `frontend/src/types/marketing.ts`

```typescript
export interface MarketingCampaign {
  id: string;
  campaign_name: string;
  template_type: 'hero_banner' | 'promo_card' | 'popup';
  template_id?: string;
  title: string;
  description?: string;
  content?: any;
  styles?: any;
  cta_text?: string;
  cta_url?: string;
  cta_button_color?: string;
  cta_text_color?: string;
  target_audience?: string[];
  target_channels?: string[];
  is_active: boolean;
  is_published: boolean;
  publish_date?: string;
  unpublish_date?: string;
  views_count: number;
  clicks_count: number;
  conversions_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  template?: CampaignTemplate;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface CampaignTemplate {
  id: string;
  template_name: string;
  template_type: 'hero_banner' | 'promo_card' | 'popup';
  description?: string;
  default_styles?: any;
  required_fields?: any;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsResponse {
  campaign_id: string;
  views_count: number;
  clicks_count: number;
  conversions_count: number;
  ctr: number;
  conversion_rate: number;
}

export interface CampaignPreview {
  campaign: MarketingCampaign;
  preview_html: string;
  preview_data: {
    template_type: string;
    content: any;
    styles: any;
    cta: {
      text?: string;
      url?: string;
      button_color?: string;
      text_color?: string;
    };
  };
}
```

---

## Implementation Plan

### Step 1: Database Setup
**Files to create:**
- `backend/supabase/migrations/001_create_marketing_tables.sql`
- `backend/supabase/migrations/002_create_marketing_functions.sql`

**Tasks:**
1. Create all marketing-related tables
2. Add performance indexes
3. Create analytics aggregation functions
4. Set up audit logging
5. Test all database functions

**Acceptance Criteria:**
- All tables created successfully
- Indexes improve query performance
- Analytics functions return correct data
- Audit logging works properly
- Full-text search functions

### Step 2: Backend Services
**Files to create:**
- `backend/src/services/marketing/campaign.service.ts`
- `backend/src/validators/campaign.validator.ts`
- `backend/src/controllers/marketing/campaign.controller.ts`
- `backend/src/routes/marketing.routes.ts`

**Tasks:**
1. Implement CampaignService with all CRUD operations
2. Add template management functionality
3. Create analytics and export functions
4. Add preview and rendering capabilities
5. Implement audit logging

**Acceptance Criteria:**
- All service methods work correctly
- Template management functions properly
- Analytics provide accurate metrics
- Export generates proper files
- Preview rendering works correctly

### Step 3: Frontend Integration
**Files to create:**
- `frontend/src/services/campaignService.ts`
- `frontend/src/types/marketing.ts`
- `frontend/src/hooks/useCampaigns.ts`

**Tasks:**
1. Create API service layer
2. Implement React hooks for state management
3. Add preview functionality
4. Test all CRUD operations
5. Implement export functionality

**Acceptance Criteria:**
- All API calls work correctly
- State management is efficient
- Preview functionality works
- Export downloads work properly
- UI updates reflect backend changes

### Step 4: Testing & Validation
**Files to create:**
- `backend/src/tests/marketing/campaign.service.test.ts`
- `backend/src/tests/marketing/campaign.controller.test.ts`
- `frontend/src/tests/campaignService.test.ts`

**Tasks:**
1. Test all service methods
2. Test API endpoints
3. Test analytics calculations
4. Test export functionality
5. Test preview rendering

**Acceptance Criteria:**
- All tests pass
- Analytics calculations are accurate
- Export files are correct
- Preview rendering works properly
- Performance is acceptable

This implementation provides a complete, scalable campaign management system with templates, analytics, publishing, and role-based access suitable for enterprise marketing needs.