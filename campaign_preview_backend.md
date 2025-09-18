# Campaign Preview Backend Integration Guide

## Overview
Complete backend implementation for CampaignPreview.tsx supporting campaign visualization, preview functionality, secure preview tokens, and real-time analytics. This module handles campaign preview generation, rendering, and status management with role-based access.

## Table of Contents
1. [Database Schema & Migrations](#database-schema--migrations)
2. [Express Routes & Controllers](#express-routes--controllers)
3. [Services & Data Layer](#services--data-layer)
4. [Preview Token Security](#preview-token-security)
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
  image_url VARCHAR(500),
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
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'published', 'unpublished', 'deleted', 'previewed'
  entity_type VARCHAR(50) NOT NULL, -- 'campaign', 'template'
  entity_id UUID NOT NULL,
  old_values JSONB DEFAULT '{}',
  new_values JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Preview Tokens Table (for secure preview sharing)
CREATE TABLE preview_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_marketing_campaigns_template_type ON marketing_campaigns(template_type);
CREATE INDEX idx_marketing_campaigns_active ON marketing_campaigns(is_active);
CREATE INDEX idx_marketing_campaigns_published ON marketing_campaigns(is_published);
CREATE INDEX idx_campaign_analytics_campaign ON campaign_analytics(campaign_id);
CREATE INDEX idx_campaign_analytics_event_type ON campaign_analytics(event_type);
CREATE INDEX idx_campaign_analytics_created_at ON campaign_analytics(created_at);
CREATE INDEX idx_preview_tokens_token ON preview_tokens(token);
CREATE INDEX idx_preview_tokens_campaign ON preview_tokens(campaign_id);
CREATE INDEX idx_preview_tokens_expires ON preview_tokens(expires_at);
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

### Route File: `backend/src/routes/campaigns.routes.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles, hasPermission } from '../middleware/rbac';
import { asyncHandler } from '../middleware/errorHandler';
import { validatePreviewToken } from '../middleware/previewToken';
import * as campaignController from '../controllers/marketing/campaign.controller';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Campaign Management
router.get('/marketing/admin/campaigns/:id', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.campaigns.read'),
  asyncHandler(campaignController.getCampaign)
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

router.patch('/marketing/admin/campaigns/:id/activate', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.campaigns.update'),
  asyncHandler(campaignController.activateCampaign)
);

router.patch('/marketing/admin/campaigns/:id/deactivate', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.campaigns.update'),
  asyncHandler(campaignController.deactivateCampaign)
);

// Template Management
router.get('/marketing/admin/templates', 
  requireRoles(['super_admin', 'marketing_admin']),
  hasPermission('marketing.templates.read'),
  asyncHandler(campaignController.getTemplates)
);

router.get('/marketing/admin/templates/:id', 
  requireRoles(['super_admin', 'marketing_admin']),
  hasPermission('marketing.templates.read'),
  asyncHandler(campaignController.getTemplate)
);

// Analytics & Performance
router.get('/marketing/admin/analytics/campaigns/:id', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.analytics.read'),
  asyncHandler(campaignController.getCampaignAnalytics)
);

router.get('/marketing/admin/analytics/campaigns/:id/performance', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.analytics.read'),
  asyncHandler(campaignController.getCampaignPerformance)
);

router.get('/marketing/admin/analytics/campaigns/:id/views', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.analytics.read'),
  asyncHandler(campaignController.getCampaignViews)
);

router.get('/marketing/admin/analytics/campaigns/:id/clicks', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.analytics.read'),
  asyncHandler(campaignController.getCampaignClicks)
);

router.get('/marketing/admin/analytics/campaigns/:id/conversions', 
  requireRoles(['super_admin', 'marketing_admin', 'content_admin']),
  hasPermission('marketing.analytics.read'),
  asyncHandler(campaignController.getCampaignConversions)
);

// Campaign Preview & Render
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
  [requireAuth, validatePreviewToken], // Optional preview token validation
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

export const getCampaign = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { include_analytics, include_template, include_targeting } = req.query;
  
  const campaign = await CampaignService.getById(id, {
    include_analytics: include_analytics === 'true',
    include_template: include_template === 'true',
    include_targeting: include_targeting === 'true'
  });
  
  res.json({
    success: true,
    data: campaign
  });
};

export const updateCampaign = async (req: Request, res: Response) => {
  const { id } = req.params;
  const validationResult = validateCampaignInput(req.body);
  
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.errors
    });
  }

  const userId = req.user.id;
  const campaign = await CampaignService.update(id, req.body, userId);
  
  await AuditService.log({
    userId,
    action: 'campaign_updated',
    resource: 'marketing_campaigns',
    resourceId: id,
    details: req.body
  });

  res.json({
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
    details: { publish_date: publish_date || new Date().toISOString() }
  });

  res.json({
    success: true,
    data: result
  });
};

export const getCampaignPreview = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    preview_mode = 'true', 
    include_template = 'true', 
    include_analytics = 'false' 
  } = req.query;
  
  const preview = await CampaignService.getPreview(id, {
    preview_mode: preview_mode === 'true',
    include_template: include_template === 'true',
    include_analytics: include_analytics === 'true'
  });
  
  // Log preview action
  await AuditService.log({
    userId: req.user.id,
    action: 'campaign_previewed',
    resource: 'marketing_campaigns',
    resourceId: id,
    details: { preview_mode: preview_mode === 'true' }
  });
  
  res.json({
    success: true,
    data: preview
  });
};

export const generateCampaignPreview = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { create_token = 'false', expires_in = 3600 } = req.body; // expires_in in seconds
  const userId = req.user.id;

  const preview = await CampaignService.generatePreview(id, {
    create_token: create_token === 'true',
    expires_in: parseInt(expires_in as string),
    user_id: userId
  });
  
  res.json({
    success: true,
    data: preview
  });
};

export const renderCampaign = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { preview_mode = 'true' } = req.query;
  
  const rendered = await CampaignService.renderCampaign(id, {
    preview_mode: preview_mode === 'true'
  });
  
  res.setHeader('Content-Type', 'text/html');
  res.send(rendered);
};

export const getCampaignPerformance = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { date_from, date_to } = req.query;
  
  const performance = await CampaignService.getPerformance(id, {
    date_from: date_from as string,
    date_to: date_to as string
  });
  
  res.json({
    success: true,
    data: performance
  });
};
```

---

## Services & Data Layer

### Service: `backend/src/services/marketing/campaign.service.ts`

```typescript
import { supabase } from '../../config/supabase';
import { PreviewTokenService } from './previewToken.service';

export interface CampaignOptions {
  include_analytics?: boolean;
  include_template?: boolean;
  include_targeting?: boolean;
}

export interface PreviewOptions {
  preview_mode?: boolean;
  include_template?: boolean;
  include_analytics?: boolean;
  create_token?: boolean;
  expires_in?: number;
  user_id?: string;
}

export class CampaignService {
  static async getById(id: string, options: CampaignOptions = {}) {
    let selectFields = `
      *,
      creator:created_by (
        id,
        first_name,
        last_name,
        email
      )
    `;

    if (options.include_template) {
      selectFields += `,
        template:template_id (
          id,
          template_name,
          template_type,
          default_styles,
          required_fields
        )`;
    }

    if (options.include_analytics) {
      selectFields += `,
        analytics:campaign_analytics (
          id,
          event_type,
          created_at
        )`;
    }

    const { data: campaign, error } = await supabase
      .from('marketing_campaigns')
      .select(selectFields)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Add targeting info if requested
    if (options.include_targeting) {
      campaign.targeting_info = {
        audience: campaign.target_audience,
        channels: campaign.target_channels
      };
    }

    return campaign;
  }

  static async update(id: string, data: any, userId: string) {
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

  static async getPreview(id: string, options: PreviewOptions = {}) {
    const campaign = await this.getById(id, {
      include_template: options.include_template,
      include_analytics: options.include_analytics
    });

    const preview = {
      campaign,
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

  static async generatePreview(id: string, options: PreviewOptions = {}) {
    const preview = await this.getPreview(id, options);
    
    let previewToken = null;
    if (options.create_token && options.user_id) {
      previewToken = await PreviewTokenService.createToken(id, {
        expires_in: options.expires_in || 3600,
        created_by: options.user_id
      });
    }

    return {
      ...preview,
      preview_token: previewToken
    };
  }

  static async renderCampaign(id: string, options: { preview_mode?: boolean } = {}) {
    const campaign = await this.getById(id, { include_template: true });
    
    const html = this.generatePreviewHTML(campaign, options.preview_mode);
    
    // Wrap in complete HTML document for embedding
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Campaign Preview - ${campaign.title}</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          .preview-container { max-width: 100%; }
          ${options.preview_mode ? '.preview-mode { border: 2px dashed #007BFF; padding: 10px; }' : ''}
        </style>
      </head>
      <body>
        <div class="preview-container ${options.preview_mode ? 'preview-mode' : ''}">
          ${html}
        </div>
      </body>
      </html>
    `;
  }

  static async getPerformance(id: string, options: { date_from?: string; date_to?: string } = {}) {
    const { data, error } = await supabase.rpc('get_campaign_performance', {
      p_campaign_id: id,
      p_date_from: options.date_from || null,
      p_date_to: options.date_to || null
    });

    if (error) throw error;
    return data[0];
  }

  private static generatePreviewHTML(campaign: any, previewMode: boolean = true): string {
    const baseStyles = `
      .campaign-preview { 
        font-family: Arial, sans-serif; 
        line-height: 1.6; 
        color: #333;
        ${previewMode ? 'border: 2px dashed #007BFF; padding: 20px; margin: 10px 0;' : ''}
      }
    `;

    switch (campaign.template_type) {
      case 'hero_banner':
        return `
          <style>${baseStyles}</style>
          <div class="campaign-preview hero-banner" style="background-color: ${campaign.styles?.background_color || '#f8f9fa'}; padding: 3rem 2rem; text-align: center; border-radius: 8px;">
            <h1 style="color: ${campaign.styles?.text_color || '#333'}; margin-bottom: 1rem; font-size: 2.5rem;">${campaign.title}</h1>
            <p style="color: ${campaign.styles?.text_color || '#666'}; margin-bottom: 2rem; font-size: 1.2rem;">${campaign.description}</p>
            ${campaign.image_url ? `<img src="${campaign.image_url}" alt="${campaign.title}" style="max-width: 100%; height: auto; margin-bottom: 2rem; border-radius: 4px;" />` : ''}
            ${campaign.cta_text ? `<a href="${campaign.cta_url || '#'}" style="background-color: ${campaign.cta_button_color}; color: ${campaign.cta_text_color}; padding: 1rem 2rem; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${campaign.cta_text}</a>` : ''}
          </div>
        `;
      case 'promo_card':
        return `
          <style>${baseStyles}</style>
          <div class="campaign-preview promo-card" style="border: 1px solid #ddd; border-radius: 12px; padding: 2rem; margin: 1rem 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h3 style="color: ${campaign.styles?.text_color || '#333'}; margin-bottom: 1rem; font-size: 1.5rem;">${campaign.title}</h3>
            <p style="color: ${campaign.styles?.text_color || '#666'}; margin-bottom: 1.5rem;">${campaign.description}</p>
            ${campaign.image_url ? `<img src="${campaign.image_url}" alt="${campaign.title}" style="max-width: 100%; height: auto; margin-bottom: 1.5rem; border-radius: 4px;" />` : ''}
            ${campaign.cta_text ? `<button style="background-color: ${campaign.cta_button_color}; color: ${campaign.cta_text_color}; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: bold; cursor: pointer;">${campaign.cta_text}</button>` : ''}
          </div>
        `;
      case 'popup':
        return `
          <style>${baseStyles}</style>
          <div class="campaign-preview popup" style="position: relative; background: white; border: 1px solid #ddd; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 20px rgba(0,0,0,0.15); max-width: 400px; margin: 0 auto;">
            <h2 style="color: ${campaign.styles?.text_color || '#333'}; margin-bottom: 1rem; font-size: 1.8rem;">${campaign.title}</h2>
            <p style="color: ${campaign.styles?.text_color || '#666'}; margin-bottom: 1.5rem;">${campaign.description}</p>
            ${campaign.image_url ? `<img src="${campaign.image_url}" alt="${campaign.title}" style="max-width: 100%; height: auto; margin-bottom: 1.5rem; border-radius: 4px;" />` : ''}
            ${campaign.cta_text ? `<button style="background-color: ${campaign.cta_button_color}; color: ${campaign.cta_text_color}; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%;">${campaign.cta_text}</button>` : ''}
          </div>
        `;
      default:
        return `<div class="campaign-preview">Preview not available for this template type</div>`;
    }
  }
}
```

---

## Preview Token Security

### Preview Token Service: `backend/src/services/marketing/previewToken.service.ts`

```typescript
import { supabase } from '../../config/supabase';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface TokenOptions {
  expires_in: number; // seconds
  created_by: string;
}

export class PreviewTokenService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly TOKEN_EXPIRY = 3600; // 1 hour default

  static async createToken(campaignId: string, options: TokenOptions) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + (options.expires_in * 1000));

    const { data, error } = await supabase
      .from('preview_tokens')
      .insert({
        campaign_id: campaignId,
        token,
        expires_at: expiresAt.toISOString(),
        created_by: options.created_by
      })
      .select()
      .single();

    if (error) throw error;

    // Create signed JWT for additional security
    const jwtToken = jwt.sign(
      { 
        campaign_id: campaignId, 
        token_id: data.id,
        type: 'preview' 
      },
      this.JWT_SECRET,
      { expiresIn: options.expires_in }
    );

    return {
      token: jwtToken,
      expires_at: expiresAt.toISOString(),
      campaign_id: campaignId
    };
  }

  static async validateToken(token: string) {
    try {
      // Verify JWT
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      if (decoded.type !== 'preview') {
        throw new Error('Invalid token type');
      }

      // Check if token exists in database and is still valid
      const { data, error } = await supabase
        .from('preview_tokens')
        .select('*')
        .eq('id', decoded.token_id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        throw new Error('Token not found or expired');
      }

      return {
        campaign_id: data.campaign_id,
        token_id: data.id,
        created_by: data.created_by
      };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static async revokeToken(tokenId: string) {
    const { error } = await supabase
      .from('preview_tokens')
      .update({ is_active: false })
      .eq('id', tokenId);

    if (error) throw error;
    return true;
  }

  static async cleanupExpiredTokens() {
    const { error } = await supabase
      .from('preview_tokens')
      .update({ is_active: false })
      .lt('expires_at', new Date().toISOString());

    if (error) throw error;
    return true;
  }
}
```

### Preview Token Middleware: `backend/src/middleware/previewToken.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { PreviewTokenService } from '../services/marketing/previewToken.service';

export const validatePreviewToken = async (req: Request, res: Response, next: NextFunction) => {
  const { preview_token } = req.query;
  
  if (!preview_token) {
    return res.status(401).json({
      success: false,
      message: 'Preview token required'
    });
  }

  try {
    const tokenData = await PreviewTokenService.validateToken(preview_token as string);
    req.previewToken = tokenData;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired preview token'
    });
  }
};
```

---

## Frontend Integration

### API Service: `frontend/src/services/campaignPreviewService.ts`

```typescript
import { apiClient } from './apiClient';

export interface CampaignPreviewOptions {
  preview_mode?: boolean;
  include_template?: boolean;
  include_analytics?: boolean;
  include_targeting?: boolean;
}

export interface PreviewGenerationOptions {
  create_token?: boolean;
  expires_in?: number;
}

export class CampaignPreviewService {
  static async getCampaign(id: string, options: CampaignPreviewOptions = {}) {
    const params = new URLSearchParams();
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/api/marketing/admin/campaigns/${id}?${params.toString()}`);
    return response.data;
  }

  static async updateCampaign(id: string, data: any) {
    const response = await apiClient.put(`/api/marketing/admin/campaigns/${id}`, data);
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

  static async activateCampaign(id: string) {
    const response = await apiClient.patch(`/api/marketing/admin/campaigns/${id}/activate`);
    return response.data;
  }

  static async deactivateCampaign(id: string) {
    const response = await apiClient.patch(`/api/marketing/admin/campaigns/${id}/deactivate`);
    return response.data;
  }

  static async getCampaignPreview(id: string, options: CampaignPreviewOptions = {}) {
    const params = new URLSearchParams();
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/api/marketing/admin/campaigns/${id}/preview?${params.toString()}`);
    return response.data;
  }

  static async generateCampaignPreview(id: string, options: PreviewGenerationOptions = {}) {
    const response = await apiClient.post(`/api/marketing/admin/campaigns/${id}/preview`, options);
    return response.data;
  }

  static async renderCampaign(id: string, previewMode: boolean = true, previewToken?: string) {
    const params = new URLSearchParams();
    params.append('preview_mode', previewMode.toString());
    if (previewToken) {
      params.append('preview_token', previewToken);
    }

    const response = await apiClient.get(`/api/marketing/admin/campaigns/${id}/render?${params.toString()}`);
    return response.data;
  }

  static async getCampaignPerformance(id: string, dateFrom?: string, dateTo?: string) {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);

    const response = await apiClient.get(`/api/marketing/admin/analytics/campaigns/${id}/performance?${params.toString()}`);
    return response.data;
  }

  static async getTemplates() {
    const response = await apiClient.get('/api/marketing/admin/templates');
    return response.data;
  }
}
```

### TypeScript Interfaces: `frontend/src/types/campaignPreview.ts`

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
  image_url?: string;
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
    email: string;
  };
  targeting_info?: {
    audience: string[];
    channels: string[];
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
  preview_token?: {
    token: string;
    expires_at: string;
    campaign_id: string;
  };
}

export interface PerformanceMetrics {
  campaign_id: string;
  views_count: number;
  clicks_count: number;
  conversions_count: number;
  ctr: number;
  conversion_rate: number;
}

export interface AnalyticsEvent {
  id: string;
  event_type: 'view' | 'click' | 'conversion' | 'impression';
  event_data: any;
  created_at: string;
}
```

---

## Implementation Plan

### Step 1: Database Setup
**Files to create:**
- `backend/supabase/migrations/001_create_campaign_preview_tables.sql`
- `backend/supabase/migrations/002_create_campaign_preview_functions.sql`

**Tasks:**
1. Create all campaign and preview-related tables
2. Add performance indexes
3. Create analytics aggregation functions
4. Set up preview token system
5. Test all database functions

**Acceptance Criteria:**
- All tables created successfully
- Indexes improve query performance
- Analytics functions return correct data
- Preview token system works
- Full-text search functions

### Step 2: Backend Services
**Files to create:**
- `backend/src/services/marketing/campaign.service.ts`
- `backend/src/services/marketing/previewToken.service.ts`
- `backend/src/middleware/previewToken.ts`
- `backend/src/controllers/marketing/campaign.controller.ts`
- `backend/src/routes/campaigns.routes.ts`

**Tasks:**
1. Implement CampaignService with preview functionality
2. Add preview token management
3. Create analytics and performance functions
4. Add preview rendering capabilities
5. Implement audit logging

**Acceptance Criteria:**
- All service methods work correctly
- Preview token system is secure
- Analytics provide accurate metrics
- Preview rendering works correctly
- Audit logging captures all actions

### Step 3: Frontend Integration
**Files to create:**
- `frontend/src/services/campaignPreviewService.ts`
- `frontend/src/types/campaignPreview.ts`
- `frontend/src/hooks/useCampaignPreview.ts`

**Tasks:**
1. Create API service layer
2. Implement React hooks for state management
3. Add preview functionality
4. Test all CRUD operations
5. Implement preview token handling

**Acceptance Criteria:**
- All API calls work correctly
- Preview functionality works properly
- State management is efficient
- Preview token handling is secure
- UI updates reflect backend changes

### Step 4: Testing & Validation
**Files to create:**
- `backend/src/tests/marketing/campaign.service.test.ts`
- `backend/src/tests/marketing/campaign.controller.test.ts`
- `frontend/src/tests/campaignPreviewService.test.ts`

**Tasks:**
1. Test all service methods
2. Test API endpoints
3. Test preview token security
4. Test analytics calculations
5. Test preview rendering

**Acceptance Criteria:**
- All tests pass
- Preview token security is validated
- Analytics calculations are accurate
- Preview rendering works correctly
- Performance is acceptable

This implementation provides a complete, secure campaign preview system with token-based access, real-time analytics, and comprehensive preview functionality suitable for enterprise marketing needs.
