# Campaign Form Backend Integration Guide

## Overview
This guide provides a complete backend implementation for the CampaignForm module, focusing on marketing campaign creation, editing, template management, and file upload handling. This module handles the complete campaign lifecycle from creation to publishing.

## Table of Contents
1. [Database Schema & Migrations](#database-schema--migrations)
2. [API Endpoints & Routes](#api-endpoints--routes)
3. [Controllers & Services](#controllers--services)
4. [File Upload Handling](#file-upload-handling)
5. [Validation & Security](#validation--security)
6. [Frontend Integration](#frontend-integration)
7. [Implementation Steps](#implementation-steps)

---

## Database Schema & Migrations

### Enhanced Marketing Campaigns Table

```sql
-- Add additional fields to marketing_campaigns table
ALTER TABLE marketing_campaigns 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES campaign_templates(id),
ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS text_color VARCHAR(7) DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS cta_text VARCHAR(100),
ADD COLUMN IF NOT EXISTS cta_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS cta_button_color VARCHAR(7) DEFAULT '#007BFF',
ADD COLUMN IF NOT EXISTS cta_text_color VARCHAR(7) DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS target_audience TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_channels TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS publish_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS unpublish_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_template ON marketing_campaigns(template_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_active ON marketing_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_published ON marketing_campaigns(is_published);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_by ON marketing_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_publish_date ON marketing_campaigns(publish_date);
```

### Campaign Templates Enhancement

```sql
-- Add additional fields to campaign_templates table
ALTER TABLE campaign_templates 
ADD COLUMN IF NOT EXISTS template_category VARCHAR(100) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS preview_image VARCHAR(500),
ADD COLUMN IF NOT EXISTS is_system_template BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_campaign_templates_category ON campaign_templates(template_category);
CREATE INDEX IF NOT EXISTS idx_campaign_templates_active ON campaign_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_campaign_templates_system ON campaign_templates(is_system_template);
```

### File Upload Management

```sql
-- Create file uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'image', 'document', 'video'
    uploaded_by UUID REFERENCES users(id),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_file_uploads_campaign ON file_uploads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_type ON file_uploads(file_type);
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_by ON file_uploads(uploaded_by);
```

### Campaign Publishing Functions

```sql
-- Function to publish campaign
CREATE OR REPLACE FUNCTION publish_campaign(
    p_campaign_id UUID,
    p_published_by UUID,
    p_publish_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
    v_campaign marketing_campaigns%ROWTYPE;
BEGIN
    -- Get campaign details
    SELECT * INTO v_campaign
    FROM marketing_campaigns
    WHERE id = p_campaign_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Campaign not found'
        );
    END IF;
    
    -- Update campaign status
    UPDATE marketing_campaigns
    SET 
        is_published = TRUE,
        is_active = TRUE,
        publish_date = p_publish_date,
        updated_by = p_published_by,
        updated_at = NOW()
    WHERE id = p_campaign_id;
    
    -- Log the action
    INSERT INTO marketing_audit_log (
        campaign_id,
        action,
        performed_by,
        details,
        created_at
    ) VALUES (
        p_campaign_id,
        'published',
        p_published_by,
        jsonb_build_object(
            'publish_date', p_publish_date,
            'campaign_name', v_campaign.campaign_name
        ),
        NOW()
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Campaign published successfully',
        'publish_date', p_publish_date
    );
END;
$$ LANGUAGE plpgsql;

-- Function to unpublish campaign
CREATE OR REPLACE FUNCTION unpublish_campaign(
    p_campaign_id UUID,
    p_unpublished_by UUID
)
RETURNS JSONB AS $$
DECLARE
    v_campaign marketing_campaigns%ROWTYPE;
BEGIN
    -- Get campaign details
    SELECT * INTO v_campaign
    FROM marketing_campaigns
    WHERE id = p_campaign_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Campaign not found'
        );
    END IF;
    
    -- Update campaign status
    UPDATE marketing_campaigns
    SET 
        is_published = FALSE,
        is_active = FALSE,
        unpublish_date = NOW(),
        updated_by = p_unpublished_by,
        updated_at = NOW()
    WHERE id = p_campaign_id;
    
    -- Log the action
    INSERT INTO marketing_audit_log (
        campaign_id,
        action,
        performed_by,
        details,
        created_at
    ) VALUES (
        p_campaign_id,
        'unpublished',
        p_unpublished_by,
        jsonb_build_object(
            'unpublish_date', NOW(),
            'campaign_name', v_campaign.campaign_name
        ),
        NOW()
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Campaign unpublished successfully',
        'unpublish_date', NOW()
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
import * as templateController from '../controllers/marketing/template.controller';
import * as uploadController from '../controllers/upload.controller';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

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

router.delete('/admin/campaigns/:id', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('campaigns.delete'),
  asyncHandler(campaignController.deleteCampaign)
);

// Campaign Actions
router.post('/admin/campaigns/:id/publish', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('campaigns.publish'),
  asyncHandler(campaignController.publishCampaign)
);

router.post('/admin/campaigns/:id/unpublish', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('campaigns.publish'),
  asyncHandler(campaignController.unpublishCampaign)
);

// Template Management Routes
router.get('/admin/templates', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('templates.read'),
  asyncHandler(templateController.getTemplates)
);

router.get('/admin/templates/:id', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('templates.read'),
  asyncHandler(templateController.getTemplateById)
);

router.post('/admin/templates', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('templates.create'),
  asyncHandler(templateController.createTemplate)
);

router.put('/admin/templates/:id', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('templates.update'),
  asyncHandler(templateController.updateTemplate)
);

router.delete('/admin/templates/:id', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('templates.delete'),
  asyncHandler(templateController.deleteTemplate)
);

// File Upload Routes
router.post('/upload/image', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('files.upload'),
  upload.single('image'),
  asyncHandler(uploadController.uploadImage)
);

router.delete('/upload/image/:id', 
  requireRole(['super_admin', 'marketing_admin']), 
  requirePermission('files.delete'),
  asyncHandler(uploadController.deleteImage)
);

export default router;
```

---

## Controllers & Services

### Campaign Controller: `backend/src/controllers/marketing/campaign.controller.ts`

```typescript
import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { CampaignService } from '../../services/marketing/campaign.service';
import { asyncHandler } from '../../middleware/errorHandler';

export class CampaignController {
  // Get campaigns with filtering
  static getCampaigns = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      search,
      template_type,
      is_active,
      is_published,
      created_by,
      page = 1,
      limit = 25,
      sort_by = 'created_at',
      sort_order = 'desc'
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
      sort_order: sort_order as 'asc' | 'desc'
    };

    const result = await CampaignService.getCampaigns(filters);
    
    res.json({
      success: true,
      data: result
    });
  });

  // Get specific campaign
  static getCampaignById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const campaign = await CampaignService.getCampaignById(id);
    
    res.json({
      success: true,
      data: campaign
    });
  });

  // Create campaign
  static createCampaign = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const campaignData = req.body;
    const createdBy = req.user!.userId;

    // Validate required fields
    const requiredFields = ['campaign_name', 'title'];
    const missingFields = requiredFields.filter(field => !campaignData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const result = await CampaignService.createCampaign(campaignData, createdBy);
    
    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: result
    });
  });

  // Update campaign
  static updateCampaign = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const campaignData = req.body;
    const updatedBy = req.user!.userId;

    const result = await CampaignService.updateCampaign(id, campaignData, updatedBy);
    
    res.json({
      success: true,
      message: 'Campaign updated successfully',
      data: result
    });
  });

  // Delete campaign
  static deleteCampaign = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const deletedBy = req.user!.userId;

    await CampaignService.deleteCampaign(id, deletedBy);
    
    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  });

  // Publish campaign
  static publishCampaign = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { publish_date } = req.body;
    const publishedBy = req.user!.userId;

    const result = await CampaignService.publishCampaign(id, publishedBy, publish_date);
    
    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  });

  // Unpublish campaign
  static unpublishCampaign = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const unpublishedBy = req.user!.userId;

    const result = await CampaignService.unpublishCampaign(id, unpublishedBy);
    
    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  });
}
```

### Campaign Service: `backend/src/services/marketing/campaign.service.ts`

```typescript
import { supabaseAdmin } from '../../config/supabaseClient';

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
}

export interface CampaignData {
  campaign_name: string;
  template_id?: string;
  title: string;
  description?: string;
  content?: string;
  background_color?: string;
  text_color?: string;
  image_url?: string;
  cta_text?: string;
  cta_url?: string;
  cta_button_color?: string;
  cta_text_color?: string;
  target_audience?: string[];
  target_channels?: string[];
  is_active?: boolean;
  publish_date?: string;
  unpublish_date?: string;
}

export class CampaignService {
  // Get campaigns with filtering
  static async getCampaigns(filters: CampaignFilters) {
    try {
      let query = supabaseAdmin
        .from('marketing_campaigns')
        .select(`
          *,
          template:template_id (
            id,
            template_name,
            template_type,
            template_category
          ),
          creator:created_by (
            id,
            first_name,
            last_name
          )
        `);

      // Apply filters
      if (filters.search) {
        query = query.or(`campaign_name.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
      }
      if (filters.template_type) {
        query = query.eq('template.template_type', filters.template_type);
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

      // Apply sorting
      const sortColumn = filters.sort_by || 'created_at';
      const sortOrder = filters.sort_order || 'desc';
      query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);

      const { data: campaigns, error, count } = await query;

      if (error) throw error;

      return {
        campaigns: campaigns || [],
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / filters.limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch campaigns: ${error}`);
    }
  }

  // Get specific campaign
  static async getCampaignById(id: string) {
    try {
      const { data: campaign, error } = await supabaseAdmin
        .from('marketing_campaigns')
        .select(`
          *,
          template:template_id (
            id,
            template_name,
            template_type,
            template_category,
            default_styles,
            required_fields
          ),
          creator:created_by (
            id,
            first_name,
            last_name
          ),
          updater:updated_by (
            id,
            first_name,
            last_name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return campaign;
    } catch (error) {
      throw new Error(`Failed to fetch campaign: ${error}`);
    }
  }

  // Create campaign
  static async createCampaign(campaignData: CampaignData, createdBy: string) {
    try {
      // Validate targeting options
      if (campaignData.target_audience) {
        const validAudiences = [
          'All Customers', 'Pet Owners', 'Farmers', 'Veterinarians',
          'New Customers', 'Loyalty Members', 'High Value Customers'
        ];
        const invalidAudiences = campaignData.target_audience.filter(
          audience => !validAudiences.includes(audience)
        );
        if (invalidAudiences.length > 0) {
          throw new Error(`Invalid audience segments: ${invalidAudiences.join(', ')}`);
        }
      }

      if (campaignData.target_channels) {
        const validChannels = [
          'Website', 'Email', 'SMS', 'Social Media', 'Mobile App', 'POS System'
        ];
        const invalidChannels = campaignData.target_channels.filter(
          channel => !validChannels.includes(channel)
        );
        if (invalidChannels.length > 0) {
          throw new Error(`Invalid channels: ${invalidChannels.join(', ')}`);
        }
      }

      const { data: campaign, error } = await supabaseAdmin
        .from('marketing_campaigns')
        .insert({
          ...campaignData,
          created_by: createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Log the creation
      await supabaseAdmin
        .from('marketing_audit_log')
        .insert({
          campaign_id: campaign.id,
          action: 'created',
          performed_by: createdBy,
          details: {
            campaign_name: campaign.campaign_name,
            template_id: campaign.template_id
          },
          created_at: new Date().toISOString()
        });

      return campaign;
    } catch (error) {
      throw new Error(`Failed to create campaign: ${error}`);
    }
  }

  // Update campaign
  static async updateCampaign(id: string, campaignData: CampaignData, updatedBy: string) {
    try {
      // Validate targeting options if provided
      if (campaignData.target_audience) {
        const validAudiences = [
          'All Customers', 'Pet Owners', 'Farmers', 'Veterinarians',
          'New Customers', 'Loyalty Members', 'High Value Customers'
        ];
        const invalidAudiences = campaignData.target_audience.filter(
          audience => !validAudiences.includes(audience)
        );
        if (invalidAudiences.length > 0) {
          throw new Error(`Invalid audience segments: ${invalidAudiences.join(', ')}`);
        }
      }

      if (campaignData.target_channels) {
        const validChannels = [
          'Website', 'Email', 'SMS', 'Social Media', 'Mobile App', 'POS System'
        ];
        const invalidChannels = campaignData.target_channels.filter(
          channel => !validChannels.includes(channel)
        );
        if (invalidChannels.length > 0) {
          throw new Error(`Invalid channels: ${invalidChannels.join(', ')}`);
        }
      }

      const { data: campaign, error } = await supabaseAdmin
        .from('marketing_campaigns')
        .update({
          ...campaignData,
          updated_by: updatedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log the update
      await supabaseAdmin
        .from('marketing_audit_log')
        .insert({
          campaign_id: id,
          action: 'updated',
          performed_by: updatedBy,
          details: campaignData,
          created_at: new Date().toISOString()
        });

      return campaign;
    } catch (error) {
      throw new Error(`Failed to update campaign: ${error}`);
    }
  }

  // Delete campaign
  static async deleteCampaign(id: string, deletedBy: string) {
    try {
      // Get campaign details for audit log
      const { data: campaign } = await supabaseAdmin
        .from('marketing_campaigns')
        .select('campaign_name')
        .eq('id', id)
        .single();

      const { error } = await supabaseAdmin
        .from('marketing_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log the deletion
      await supabaseAdmin
        .from('marketing_audit_log')
        .insert({
          campaign_id: id,
          action: 'deleted',
          performed_by: deletedBy,
          details: {
            campaign_name: campaign?.campaign_name
          },
          created_at: new Date().toISOString()
        });

      return true;
    } catch (error) {
      throw new Error(`Failed to delete campaign: ${error}`);
    }
  }

  // Publish campaign
  static async publishCampaign(id: string, publishedBy: string, publishDate?: string) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('publish_campaign', {
          p_campaign_id: id,
          p_published_by: publishedBy,
          p_publish_date: publishDate || new Date().toISOString()
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to publish campaign: ${error}`);
    }
  }

  // Unpublish campaign
  static async unpublishCampaign(id: string, unpublishedBy: string) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('unpublish_campaign', {
          p_campaign_id: id,
          p_unpublished_by: unpublishedBy
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to unpublish campaign: ${error}`);
    }
  }
}
```

---

## File Upload Handling

### Upload Controller: `backend/src/controllers/upload.controller.ts`

```typescript
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { FileUploadService } from '../services/fileUpload.service';
import { asyncHandler } from '../middleware/errorHandler';

export class UploadController {
  // Upload image
  static uploadImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const file = req.file;
    const { campaign_id } = req.body;
    const uploadedBy = req.user!.userId;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const result = await FileUploadService.uploadImage(file, campaign_id, uploadedBy);
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: result
    });
  });

  // Delete image
  static deleteImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const deletedBy = req.user!.userId;

    await FileUploadService.deleteImage(id, deletedBy);
    
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  });
}
```

### File Upload Service: `backend/src/services/fileUpload.service.ts`

```typescript
import { supabaseAdmin } from '../config/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';

export class FileUploadService {
  static async uploadImage(file: any, campaignId?: string, uploadedBy?: string) {
    try {
      // Generate unique filename
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `campaign_${uuidv4()}.${fileExtension}`;
      const uploadPath = `campaigns/images/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from('marketing-files')
        .upload(uploadPath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('marketing-files')
        .getPublicUrl(uploadPath);

      // Save file record to database
      const { data: fileRecord, error: dbError } = await supabaseAdmin
        .from('file_uploads')
        .insert({
          original_name: file.originalname,
          file_name: fileName,
          file_path: uploadPath,
          file_size: file.size,
          mime_type: file.mimetype,
          file_type: 'image',
          uploaded_by: uploadedBy,
          campaign_id: campaignId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return {
        id: fileRecord.id,
        original_name: fileRecord.original_name,
        file_name: fileRecord.file_name,
        file_url: urlData.publicUrl,
        file_size: fileRecord.file_size,
        mime_type: fileRecord.mime_type
      };
    } catch (error) {
      throw new Error(`Failed to upload image: ${error}`);
    }
  }

  static async deleteImage(fileId: string, deletedBy: string) {
    try {
      // Get file details
      const { data: fileRecord, error: fetchError } = await supabaseAdmin
        .from('file_uploads')
        .select('file_path, file_name')
        .eq('id', fileId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabaseAdmin.storage
        .from('marketing-files')
        .remove([fileRecord.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabaseAdmin
        .from('file_uploads')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      return true;
    } catch (error) {
      throw new Error(`Failed to delete image: ${error}`);
    }
  }
}
```

---

## Frontend Integration

### API Service: `frontend/src/services/campaignService.ts`

```typescript
import { apiClient } from './apiClient';

export interface CampaignData {
  campaign_name: string;
  template_id?: string;
  title: string;
  description?: string;
  content?: string;
  background_color?: string;
  text_color?: string;
  image_url?: string;
  cta_text?: string;
  cta_url?: string;
  cta_button_color?: string;
  cta_text_color?: string;
  target_audience?: string[];
  target_channels?: string[];
  is_active?: boolean;
  publish_date?: string;
  unpublish_date?: string;
}

export class CampaignService {
  // Get campaigns
  static async getCampaigns(filters: any = {}) {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });

    const response = await apiClient.get(`/v1/marketing/admin/campaigns?${params.toString()}`);
    return response.data;
  }

  // Get specific campaign
  static async getCampaignById(id: string) {
    const response = await apiClient.get(`/v1/marketing/admin/campaigns/${id}`);
    return response.data;
  }

  // Create campaign
  static async createCampaign(data: CampaignData) {
    const response = await apiClient.post('/v1/marketing/admin/campaigns', data);
    return response.data;
  }

  // Update campaign
  static async updateCampaign(id: string, data: CampaignData) {
    const response = await apiClient.put(`/v1/marketing/admin/campaigns/${id}`, data);
    return response.data;
  }

  // Delete campaign
  static async deleteCampaign(id: string) {
    const response = await apiClient.delete(`/v1/marketing/admin/campaigns/${id}`);
    return response.data;
  }

  // Publish campaign
  static async publishCampaign(id: string, publishDate?: string) {
    const response = await apiClient.post(`/v1/marketing/admin/campaigns/${id}/publish`, {
      publish_date: publishDate
    });
    return response.data;
  }

  // Unpublish campaign
  static async unpublishCampaign(id: string) {
    const response = await apiClient.post(`/v1/marketing/admin/campaigns/${id}/unpublish`);
    return response.data;
  }

  // Upload image
  static async uploadImage(file: File, campaignId?: string) {
    const formData = new FormData();
    formData.append('image', file);
    if (campaignId) {
      formData.append('campaign_id', campaignId);
    }

    const response = await apiClient.post('/v1/marketing/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Delete image
  static async deleteImage(fileId: string) {
    const response = await apiClient.delete(`/v1/marketing/upload/image/${fileId}`);
    return response.data;
  }
}
```

---

## Implementation Steps

### Step 1: Database Setup
1. Run the SQL migrations to enhance tables
2. Create the file uploads table
3. Create the publishing functions
4. Test the database functions

### Step 2: Backend Implementation
1. Create the `CampaignService` class
2. Create the `CampaignController` class
3. Create the `FileUploadService` and `UploadController` classes
4. Update the `marketing.routes.ts` file
5. Test all endpoints

### Step 3: Frontend Integration
1. Create the `campaignService.ts` API service
2. Update your `CampaignForm.tsx` component
3. Add file upload functionality
4. Add form validation
5. Add campaign preview functionality

### Step 4: Testing
1. Test campaign CRUD operations
2. Test file upload functionality
3. Test publish/unpublish functionality
4. Test form validation
5. Test audit logging

This implementation provides a complete campaign management system with creation, editing, template management, file uploads, and publishing capabilities.
