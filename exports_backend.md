# Exports Backend Integration Guide

## Overview
Complete backend implementation for Exports.tsx supporting data export management, report generation, scheduled exports, and secure file handling. This module handles multiple export formats (CSV, Excel, PDF, JSON) with background processing and real-time status updates.

## Table of Contents
1. [Database Schema & Migrations](#database-schema--migrations)
2. [Express Routes & Controllers](#express-routes--controllers)
3. [Services & Data Layer](#services--data-layer)
4. [Background Worker System](#background-worker-system)
5. [File Storage & Security](#file-storage--security)
6. [Frontend Integration](#frontend-integration)
7. [Implementation Plan](#implementation-plan)

---

## Database Schema & Migrations

### Complete Migration SQL

```sql
-- Data Exports Table
CREATE TABLE data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_name VARCHAR(255) NOT NULL,
  export_type VARCHAR(50) NOT NULL CHECK (export_type IN ('sales', 'inventory', 'customers', 'staff', 'financial', 'marketing', 'attendance', 'payroll')),
  format VARCHAR(10) NOT NULL CHECK (format IN ('csv', 'excel', 'pdf', 'json')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  file_path TEXT, -- Path in storage bucket
  file_size BIGINT DEFAULT 0,
  record_count INTEGER DEFAULT 0,
  filters JSONB DEFAULT '{}', -- Export filters and parameters
  columns JSONB DEFAULT '[]', -- Selected columns for export
  recipients TEXT[] DEFAULT '{}', -- Email recipients
  error_message TEXT,
  progress_percentage INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days') -- Auto-cleanup
);

-- Export Schedules Table
CREATE TABLE export_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_name VARCHAR(255) NOT NULL,
  export_type VARCHAR(50) NOT NULL CHECK (export_type IN ('sales', 'inventory', 'customers', 'staff', 'financial', 'marketing', 'attendance', 'payroll')),
  format VARCHAR(10) NOT NULL CHECK (format IN ('csv', 'excel', 'pdf', 'json')),
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  cron_expression VARCHAR(100), -- For complex schedules
  next_run TIMESTAMP WITH TIME ZONE NOT NULL,
  last_run TIMESTAMP WITH TIME ZONE,
  recipients TEXT[] DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  columns JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Export Templates Table
CREATE TABLE export_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(255) NOT NULL,
  export_type VARCHAR(50) NOT NULL CHECK (export_type IN ('sales', 'inventory', 'customers', 'staff', 'financial', 'marketing', 'attendance', 'payroll')),
  format VARCHAR(10) NOT NULL CHECK (format IN ('csv', 'excel', 'pdf', 'json')),
  columns JSONB NOT NULL DEFAULT '[]', -- Column definitions
  filters JSONB DEFAULT '{}', -- Default filters
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE, -- Shareable templates
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Export Statistics Table
CREATE TABLE export_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id UUID NOT NULL REFERENCES data_exports(id) ON DELETE CASCADE,
  duration_ms INTEGER NOT NULL,
  file_size BIGINT NOT NULL,
  record_count INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  worker_node VARCHAR(100), -- Which worker processed it
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Export Download Logs Table (for audit)
CREATE TABLE export_download_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id UUID NOT NULL REFERENCES data_exports(id) ON DELETE CASCADE,
  downloaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_data_exports_status ON data_exports(status);
CREATE INDEX idx_data_exports_created_at ON data_exports(created_at);
CREATE INDEX idx_data_exports_type ON data_exports(export_type);
CREATE INDEX idx_data_exports_created_by ON data_exports(created_by);
CREATE INDEX idx_export_schedules_next_run ON export_schedules(next_run);
CREATE INDEX idx_export_schedules_active ON export_schedules(is_active);
CREATE INDEX idx_export_templates_type ON export_templates(export_type);
CREATE INDEX idx_export_templates_public ON export_templates(is_public);
CREATE INDEX idx_export_statistics_export ON export_statistics(export_id);
CREATE INDEX idx_export_download_logs_export ON export_download_logs(export_id);

-- Cleanup function for expired exports
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM data_exports 
  WHERE expires_at < NOW() 
    AND status IN ('completed', 'failed', 'cancelled');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get export statistics
CREATE OR REPLACE FUNCTION get_export_statistics(
  p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  total_exports BIGINT,
  successful_exports BIGINT,
  failed_exports BIGINT,
  avg_duration_ms NUMERIC,
  total_file_size BIGINT,
  total_records BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_exports,
    COUNT(CASE WHEN es.success = true THEN 1 END) as successful_exports,
    COUNT(CASE WHEN es.success = false THEN 1 END) as failed_exports,
    ROUND(AVG(es.duration_ms), 2) as avg_duration_ms,
    SUM(es.file_size) as total_file_size,
    SUM(es.record_count) as total_records
  FROM export_statistics es
  JOIN data_exports de ON es.export_id = de.id
  WHERE (p_date_from IS NULL OR de.created_at >= p_date_from)
    AND (p_date_to IS NULL OR de.created_at <= p_date_to);
END;
$$ LANGUAGE plpgsql;
```

---

## Express Routes & Controllers

### Route File: `backend/src/routes/exports.routes.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles, hasPermission } from '../middleware/rbac';
import { asyncHandler } from '../middleware/errorHandler';
import { rateLimiter } from '../middleware/rateLimiter';
import * as exportController from '../controllers/exports.controller';

const router = Router();

// Apply authentication and rate limiting to all routes
router.use(requireAuth);
router.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 })); // 100 requests per 15 minutes

// Core Export Management
router.get('/exports', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('exports.read'),
  asyncHandler(exportController.getExports)
);

router.post('/exports', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('exports.create'),
  asyncHandler(exportController.createExport)
);

router.get('/exports/:id', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('exports.read'),
  asyncHandler(exportController.getExport)
);

router.delete('/exports/:id', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('exports.delete'),
  asyncHandler(exportController.deleteExport)
);

router.get('/exports/:id/download', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('exports.download'),
  asyncHandler(exportController.downloadExport)
);

// Export Execution & Control
router.post('/exports/execute', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('exports.execute'),
  asyncHandler(exportController.executeExport)
);

router.post('/exports/execute/:type', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('exports.execute'),
  asyncHandler(exportController.executeExportByType)
);

router.get('/exports/status/:id', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('exports.read'),
  asyncHandler(exportController.getExportStatus)
);

router.post('/exports/:id/cancel', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('exports.update'),
  asyncHandler(exportController.cancelExport)
);

router.post('/exports/:id/retry', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('exports.execute'),
  asyncHandler(exportController.retryExport)
);

// Scheduled Exports
router.get('/exports/schedules', 
  requireRoles(['super_admin', 'admin']),
  hasPermission('exports.schedules.read'),
  asyncHandler(exportController.getSchedules)
);

router.post('/exports/schedules', 
  requireRoles(['super_admin', 'admin']),
  hasPermission('exports.schedules.create'),
  asyncHandler(exportController.createSchedule)
);

router.get('/exports/schedules/:id', 
  requireRoles(['super_admin', 'admin']),
  hasPermission('exports.schedules.read'),
  asyncHandler(exportController.getSchedule)
);

router.put('/exports/schedules/:id', 
  requireRoles(['super_admin', 'admin']),
  hasPermission('exports.schedules.update'),
  asyncHandler(exportController.updateSchedule)
);

router.delete('/exports/schedules/:id', 
  requireRoles(['super_admin', 'admin']),
  hasPermission('exports.schedules.delete'),
  asyncHandler(exportController.deleteSchedule)
);

router.post('/exports/schedules/:id/pause', 
  requireRoles(['super_admin', 'admin']),
  hasPermission('exports.schedules.update'),
  asyncHandler(exportController.pauseSchedule)
);

router.post('/exports/schedules/:id/resume', 
  requireRoles(['super_admin', 'admin']),
  hasPermission('exports.schedules.update'),
  asyncHandler(exportController.resumeSchedule)
);

// Templates & Types
router.get('/exports/templates', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('exports.templates.read'),
  asyncHandler(exportController.getTemplates)
);

router.post('/exports/templates', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('exports.templates.create'),
  asyncHandler(exportController.createTemplate)
);

router.put('/exports/templates/:id', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('exports.templates.update'),
  asyncHandler(exportController.updateTemplate)
);

router.delete('/exports/templates/:id', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('exports.templates.delete'),
  asyncHandler(exportController.deleteTemplate)
);

router.get('/exports/types', 
  requireRoles(['super_admin', 'admin', 'manager']),
  hasPermission('exports.read'),
  asyncHandler(exportController.getExportTypes)
);

// Analytics & Reports
router.get('/exports/statistics', 
  requireRoles(['super_admin', 'admin']),
  hasPermission('exports.analytics.read'),
  asyncHandler(exportController.getStatistics)
);

router.get('/exports/analytics', 
  requireRoles(['super_admin', 'admin']),
  hasPermission('exports.analytics.read'),
  asyncHandler(exportController.getAnalytics)
);

export default router;
```

### Controller: `backend/src/controllers/exports.controller.ts`

```typescript
import { Request, Response } from 'express';
import { ExportService } from '../services/exports.service';
import { validateExportInput, validateScheduleInput } from '../validators/export.validator';
import { AuditService } from '../services/audit.service';

export const getExports = async (req: Request, res: Response) => {
  const { 
    type, 
    format, 
    status, 
    date_from, 
    date_to, 
    created_by, 
    page = 1, 
    limit = 20,
    sort_by = 'created_at',
    sort_order = 'desc'
  } = req.query;

  const filters = {
    type: type as string,
    format: format as string,
    status: status as string,
    date_from: date_from as string,
    date_to: date_to as string,
    created_by: created_by as string,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    sort_by: sort_by as string,
    sort_order: sort_order as string
  };

  const result = await ExportService.getExports(filters);
  
  res.json({
    success: true,
    data: result.exports,
    pagination: result.pagination
  });
};

export const createExport = async (req: Request, res: Response) => {
  const validationResult = validateExportInput(req.body);
  
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.errors
    });
  }

  const userId = req.user.id;
  const exportJob = await ExportService.createExport(req.body, userId);
  
  await AuditService.log({
    userId,
    action: 'export_created',
    resource: 'data_exports',
    resourceId: exportJob.id,
    details: { export_type: req.body.export_type, format: req.body.format }
  });

  res.status(201).json({
    success: true,
    data: exportJob
  });
};

export const getExport = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { include_details = 'false' } = req.query;
  
  const exportJob = await ExportService.getExportById(id, {
    include_details: include_details === 'true'
  });
  
  res.json({
    success: true,
    data: exportJob
  });
};

export const downloadExport = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const downloadUrl = await ExportService.generateDownloadUrl(id, userId);
  
  // Log download
  await AuditService.log({
    userId,
    action: 'export_downloaded',
    resource: 'data_exports',
    resourceId: id,
    details: { ip_address: req.ip, user_agent: req.get('User-Agent') }
  });
  
  res.json({
    success: true,
    data: { download_url: downloadUrl }
  });
};

export const executeExport = async (req: Request, res: Response) => {
  const validationResult = validateExportInput(req.body);
  
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.errors
    });
  }

  const userId = req.user.id;
  const exportJob = await ExportService.executeExport(req.body, userId);
  
  res.status(201).json({
    success: true,
    data: exportJob
  });
};

export const executeExportByType = async (req: Request, res: Response) => {
  const { type } = req.params;
  const userId = req.user.id;
  
  const exportJob = await ExportService.executeExportByType(type, req.body, userId);
  
  res.status(201).json({
    success: true,
    data: exportJob
  });
};

export const getExportStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const status = await ExportService.getExportStatus(id);
  
  res.json({
    success: true,
    data: status
  });
};

export const cancelExport = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const result = await ExportService.cancelExport(id, userId);
  
  await AuditService.log({
    userId,
    action: 'export_cancelled',
    resource: 'data_exports',
    resourceId: id,
    details: {}
  });
  
  res.json({
    success: true,
    data: result
  });
};

export const retryExport = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const exportJob = await ExportService.retryExport(id, userId);
  
  await AuditService.log({
    userId,
    action: 'export_retried',
    resource: 'data_exports',
    resourceId: id,
    details: {}
  });
  
  res.json({
    success: true,
    data: exportJob
  });
};

export const getSchedules = async (req: Request, res: Response) => {
  const { page = 1, limit = 20, is_active } = req.query;
  
  const schedules = await ExportService.getSchedules({
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    is_active: is_active as string
  });
  
  res.json({
    success: true,
    data: schedules
  });
};

export const createSchedule = async (req: Request, res: Response) => {
  const validationResult = validateScheduleInput(req.body);
  
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.errors
    });
  }

  const userId = req.user.id;
  const schedule = await ExportService.createSchedule(req.body, userId);
  
  await AuditService.log({
    userId,
    action: 'schedule_created',
    resource: 'export_schedules',
    resourceId: schedule.id,
    details: { export_type: req.body.export_type, frequency: req.body.frequency }
  });
  
  res.status(201).json({
    success: true,
    data: schedule
  });
};

export const getStatistics = async (req: Request, res: Response) => {
  const { date_from, date_to } = req.query;
  
  const statistics = await ExportService.getStatistics({
    date_from: date_from as string,
    date_to: date_to as string
  });
  
  res.json({
    success: true,
    data: statistics
  });
};
```

---

## Services & Data Layer

### Service: `backend/src/services/exports.service.ts`

```typescript
import { supabase } from '../config/supabase';
import { ExportWorker } from '../workers/export.worker';
import { FileStorageService } from './fileStorage.service';
import { NotificationService } from './notification.service';

export interface ExportFilters {
  type?: string;
  format?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  created_by?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: string;
}

export interface ExportOptions {
  include_details?: boolean;
}

export class ExportService {
  static async getExports(filters: ExportFilters) {
    let query = supabase
      .from('data_exports')
      .select(`
        *,
        creator:created_by (
          id,
          first_name,
          last_name,
          email
        )
      `);

    // Apply filters
    if (filters.type) query = query.eq('export_type', filters.type);
    if (filters.format) query = query.eq('format', filters.format);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.created_by) query = query.eq('created_by', filters.created_by);
    if (filters.date_from) query = query.gte('created_at', filters.date_from);
    if (filters.date_to) query = query.lte('created_at', filters.date_to);

    // Apply sorting
    const sortOrder = filters.sort_order === 'asc' ? { ascending: true } : { ascending: false };
    query = query.order(filters.sort_by || 'created_at', sortOrder);

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: exports, error, count } = await query
      .range(from, to);

    if (error) throw error;

    return {
      exports: exports || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };
  }

  static async createExport(exportData: any, userId: string) {
    const { data: exportJob, error } = await supabase
      .from('data_exports')
      .insert({
        ...exportData,
        created_by: userId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Enqueue job for processing
    await ExportWorker.enqueueExport(exportJob.id);

    return exportJob;
  }

  static async getExportById(id: string, options: ExportOptions = {}) {
    let selectFields = `
      *,
      creator:created_by (
        id,
        first_name,
        last_name,
        email
      )
    `;

    if (options.include_details) {
      selectFields += `,
        statistics:export_statistics (
          id,
          duration_ms,
          file_size,
          record_count,
          success,
          error_message,
          created_at
        )
      `;
    }

    const { data: exportJob, error } = await supabase
      .from('data_exports')
      .select(selectFields)
      .eq('id', id)
      .single();

    if (error) throw error;
    return exportJob;
  }

  static async executeExport(exportData: any, userId: string) {
    // Create export job
    const exportJob = await this.createExport(exportData, userId);
    
    // Process immediately
    await ExportWorker.processExport(exportJob.id);
    
    return exportJob;
  }

  static async executeExportByType(type: string, options: any, userId: string) {
    const exportData = {
      export_type: type,
      format: options.format || 'csv',
      filters: options.filters || {},
      columns: options.columns || [],
      export_name: options.export_name || `${type}_export_${new Date().toISOString()}`
    };

    return await this.executeExport(exportData, userId);
  }

  static async getExportStatus(id: string) {
    const { data: exportJob, error } = await supabase
      .from('data_exports')
      .select('id, status, progress_percentage, error_message, started_at, completed_at')
      .eq('id', id)
      .single();

    if (error) throw error;
    return exportJob;
  }

  static async cancelExport(id: string, userId: string) {
    const { data: exportJob, error } = await supabase
      .from('data_exports')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('created_by', userId) // Ensure user owns the export
      .select()
      .single();

    if (error) throw error;

    // Cancel worker job if still processing
    await ExportWorker.cancelJob(id);

    return exportJob;
  }

  static async retryExport(id: string, userId: string) {
    // Get original export data
    const { data: originalExport, error: fetchError } = await supabase
      .from('data_exports')
      .select('*')
      .eq('id', id)
      .eq('created_by', userId)
      .single();

    if (fetchError) throw fetchError;

    // Create new export with same data
    const retryData = {
      export_name: `${originalExport.export_name}_retry_${new Date().toISOString()}`,
      export_type: originalExport.export_type,
      format: originalExport.format,
      filters: originalExport.filters,
      columns: originalExport.columns,
      recipients: originalExport.recipients
    };

    return await this.createExport(retryData, userId);
  }

  static async generateDownloadUrl(id: string, userId: string) {
    const { data: exportJob, error } = await supabase
      .from('data_exports')
      .select('file_path, status, created_by')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (exportJob.created_by !== userId) {
      throw new Error('Unauthorized: You can only download your own exports');
    }

    if (exportJob.status !== 'completed') {
      throw new Error('Export not completed yet');
    }

    if (!exportJob.file_path) {
      throw new Error('Export file not found');
    }

    // Generate signed URL (expires in 1 hour)
    const downloadUrl = await FileStorageService.generateSignedUrl(exportJob.file_path, 3600);
    
    // Log download
    await supabase
      .from('export_download_logs')
      .insert({
        export_id: id,
        downloaded_by: userId,
        ip_address: null, // Will be filled by controller
        user_agent: null
      });

    return downloadUrl;
  }

  static async getSchedules(filters: any) {
    let query = supabase
      .from('export_schedules')
      .select(`
        *,
        creator:created_by (
          id,
          first_name,
          last_name,
          email
        )
      `);

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active === 'true');
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: schedules, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      schedules: schedules || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };
  }

  static async createSchedule(scheduleData: any, userId: string) {
    // Calculate next run time based on frequency
    const nextRun = this.calculateNextRun(scheduleData.frequency, scheduleData.cron_expression);
    
    const { data: schedule, error } = await supabase
      .from('export_schedules')
      .insert({
        ...scheduleData,
        next_run: nextRun,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    return schedule;
  }

  static async getStatistics(filters: any) {
    const { data, error } = await supabase.rpc('get_export_statistics', {
      p_date_from: filters.date_from || null,
      p_date_to: filters.date_to || null
    });

    if (error) throw error;
    return data[0];
  }

  private static calculateNextRun(frequency: string, cronExpression?: string): string {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      case 'quarterly':
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
      case 'yearly':
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return now.toISOString();
    }
  }
}
```

---

## Background Worker System

### Worker: `backend/src/workers/export.worker.ts`

```typescript
import Queue from 'bull';
import { supabase } from '../config/supabase';
import { FileStorageService } from '../services/fileStorage.service';
import { NotificationService } from '../services/notification.service';
import { ExportGenerator } from '../services/exportGenerator.service';

// Redis connection for queue
const exportQueue = new Queue('export processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  }
});

export class ExportWorker {
  static async enqueueExport(exportId: string) {
    await exportQueue.add('process-export', { exportId }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: 10,
      removeOnFail: 5
    });
  }

  static async processExport(exportId: string) {
    const job = await exportQueue.add('process-export', { exportId }, {
      priority: 1, // High priority for immediate processing
      attempts: 1
    });
    
    return job;
  }

  static async cancelJob(exportId: string) {
    const jobs = await exportQueue.getJobs(['waiting', 'active']);
    const job = jobs.find(j => j.data.exportId === exportId);
    
    if (job) {
      await job.remove();
    }
  }

  static async getJobStatus(exportId: string) {
    const jobs = await exportQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
    const job = jobs.find(j => j.data.exportId === exportId);
    
    if (!job) return null;
    
    return {
      id: job.id,
      status: await job.getState(),
      progress: job.progress(),
      data: job.data,
      failedReason: job.failedReason
    };
  }
}

// Process export jobs
exportQueue.process('process-export', async (job, done) => {
  const { exportId } = job.data;
  
  try {
    // Update status to processing
    await supabase
      .from('data_exports')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        progress_percentage: 0
      })
      .eq('id', exportId);

    // Get export details
    const { data: exportJob, error } = await supabase
      .from('data_exports')
      .select('*')
      .eq('id', exportId)
      .single();

    if (error) throw error;

    // Generate export file
    const startTime = Date.now();
    const result = await ExportGenerator.generateExport(exportJob, (progress) => {
      job.progress(progress);
      
      // Update progress in database
      supabase
        .from('data_exports')
        .update({ progress_percentage: progress })
        .eq('id', exportId);
    });

    const duration = Date.now() - startTime;

    // Upload file to storage
    const filePath = await FileStorageService.uploadFile(
      result.buffer,
      `exports/${exportJob.export_type}/${exportId}.${exportJob.format}`,
      exportJob.format
    );

    // Update export record
    await supabase
      .from('data_exports')
      .update({
        status: 'completed',
        file_path: filePath,
        file_size: result.buffer.length,
        record_count: result.recordCount,
        completed_at: new Date().toISOString(),
        progress_percentage: 100
      })
      .eq('id', exportId);

    // Record statistics
    await supabase
      .from('export_statistics')
      .insert({
        export_id: exportId,
        duration_ms: duration,
        file_size: result.buffer.length,
        record_count: result.recordCount,
        success: true,
        worker_node: process.env.WORKER_NODE || 'default'
      });

    // Send notifications
    if (exportJob.recipients && exportJob.recipients.length > 0) {
      await NotificationService.sendExportComplete(exportJob);
    }

    done();
  } catch (error) {
    console.error('Export processing failed:', error);
    
    // Update status to failed
    await supabase
      .from('data_exports')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', exportId);

    // Record failure statistics
    await supabase
      .from('export_statistics')
      .insert({
        export_id: exportId,
        duration_ms: 0,
        file_size: 0,
        record_count: 0,
        success: false,
        error_message: error.message,
        worker_node: process.env.WORKER_NODE || 'default'
      });

    done(error);
  }
});

// Schedule runner for recurring exports
exportQueue.process('scheduled-export', async (job, done) => {
  const { scheduleId } = job.data;
  
  try {
    // Get schedule details
    const { data: schedule, error } = await supabase
      .from('export_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (error) throw error;

    if (!schedule.is_active) {
      done();
      return;
    }

    // Create export job
    const exportData = {
      export_name: `${schedule.schedule_name}_${new Date().toISOString()}`,
      export_type: schedule.export_type,
      format: schedule.format,
      filters: schedule.filters,
      columns: schedule.columns,
      recipients: schedule.recipients
    };

    const { data: exportJob, error: createError } = await supabase
      .from('data_exports')
      .insert({
        ...exportData,
        created_by: schedule.created_by,
        status: 'pending'
      })
      .select()
      .single();

    if (createError) throw createError;

    // Enqueue for processing
    await ExportWorker.enqueueExport(exportJob.id);

    // Update next run time
    const nextRun = ExportService.calculateNextRun(schedule.frequency, schedule.cron_expression);
    await supabase
      .from('export_schedules')
      .update({
        last_run: new Date().toISOString(),
        next_run: nextRun
      })
      .eq('id', scheduleId);

    done();
  } catch (error) {
    console.error('Scheduled export failed:', error);
    done(error);
  }
});

export default exportQueue;
```

---

## File Storage & Security

### File Storage Service: `backend/src/services/fileStorage.service.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseStorage = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class FileStorageService {
  static async uploadFile(
    buffer: Buffer, 
    path: string, 
    contentType: string
  ): Promise<string> {
    const { data, error } = await supabaseStorage.storage
      .from('exports')
      .upload(path, buffer, {
        contentType,
        upsert: true
      });

    if (error) throw error;
    return data.path;
  }

  static async generateSignedUrl(
    filePath: string, 
    expiresIn: number = 3600
  ): Promise<string> {
    const { data, error } = await supabaseStorage.storage
      .from('exports')
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  }

  static async deleteFile(filePath: string): Promise<boolean> {
    const { error } = await supabaseStorage.storage
      .from('exports')
      .remove([filePath]);

    return !error;
  }

  static async streamFile(filePath: string): Promise<ReadableStream> {
    const { data, error } = await supabaseStorage.storage
      .from('exports')
      .download(filePath);

    if (error) throw error;
    return data.stream();
  }
}
```

---

## Frontend Integration

### API Service: `frontend/src/services/exportsService.ts`

```typescript
import { apiClient } from './apiClient';

export interface ExportFilters {
  type?: string;
  format?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  created_by?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: string;
}

export interface ExportData {
  export_name: string;
  export_type: string;
  format: string;
  filters?: any;
  columns?: string[];
  recipients?: string[];
}

export class ExportsService {
  static async getExports(filters: ExportFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/api/v1/exports?${params.toString()}`);
    return response.data;
  }

  static async createExport(exportData: ExportData) {
    const response = await apiClient.post('/api/v1/exports', exportData);
    return response.data;
  }

  static async getExport(id: string, includeDetails: boolean = false) {
    const response = await apiClient.get(`/api/v1/exports/${id}?include_details=${includeDetails}`);
    return response.data;
  }

  static async downloadExport(id: string) {
    const response = await apiClient.get(`/api/v1/exports/${id}/download`);
    return response.data;
  }

  static async executeExport(exportData: ExportData) {
    const response = await apiClient.post('/api/v1/exports/execute', exportData);
    return response.data;
  }

  static async executeExportByType(type: string, options: any) {
    const response = await apiClient.post(`/api/v1/exports/execute/${type}`, options);
    return response.data;
  }

  static async getExportStatus(id: string) {
    const response = await apiClient.get(`/api/v1/exports/status/${id}`);
    return response.data;
  }

  static async cancelExport(id: string) {
    const response = await apiClient.post(`/api/v1/exports/${id}/cancel`);
    return response.data;
  }

  static async retryExport(id: string) {
    const response = await apiClient.post(`/api/v1/exports/${id}/retry`);
    return response.data;
  }

  static async getSchedules(filters: any = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/api/v1/exports/schedules?${params.toString()}`);
    return response.data;
  }

  static async createSchedule(scheduleData: any) {
    const response = await apiClient.post('/api/v1/exports/schedules', scheduleData);
    return response.data;
  }

  static async getTemplates() {
    const response = await apiClient.get('/api/v1/exports/templates');
    return response.data;
  }

  static async getExportTypes() {
    const response = await apiClient.get('/api/v1/exports/types');
    return response.data;
  }

  static async getStatistics(filters: any = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/api/v1/exports/statistics?${params.toString()}`);
    return response.data;
  }
}
```

---

## Implementation Plan

### Step 1: Database Setup
**Files to create:**
- `backend/supabase/migrations/001_create_export_tables.sql`
- `backend/supabase/migrations/002_create_export_functions.sql`

**Tasks:**
1. Create all export-related tables
2. Add performance indexes
3. Create cleanup and statistics functions
4. Set up file storage bucket
5. Test all database functions

**Acceptance Criteria:**
- All tables created successfully
- Indexes improve query performance
- Statistics functions return correct data
- File storage bucket configured
- Cleanup functions work

### Step 2: Backend Services
**Files to create:**
- `backend/src/services/exports.service.ts`
- `backend/src/services/fileStorage.service.ts`
- `backend/src/services/exportGenerator.service.ts`
- `backend/src/workers/export.worker.ts`
- `backend/src/controllers/exports.controller.ts`
- `backend/src/routes/exports.routes.ts`

**Tasks:**
1. Implement ExportService with all CRUD operations
2. Add file storage and signed URL generation
3. Create background worker system
4. Add export generation logic
5. Implement audit logging

**Acceptance Criteria:**
- All service methods work correctly
- File storage handles uploads/downloads
- Worker processes exports successfully
- Export generation works for all formats
- Audit logging captures all actions

### Step 3: Frontend Integration
**Files to create:**
- `frontend/src/services/exportsService.ts`
- `frontend/src/types/exports.ts`
- `frontend/src/hooks/useExports.ts`

**Tasks:**
1. Create API service layer
2. Implement React hooks for state management
3. Add real-time status updates
4. Test all CRUD operations
5. Implement download functionality

**Acceptance Criteria:**
- All API calls work correctly
- Real-time updates work properly
- State management is efficient
- Download functionality works
- UI updates reflect backend changes

### Step 4: Testing & Validation
**Files to create:**
- `backend/src/tests/exports.service.test.ts`
- `backend/src/tests/exports.controller.test.ts`
- `frontend/src/tests/exportsService.test.ts`

**Tasks:**
1. Test all service methods
2. Test API endpoints
3. Test worker processing
4. Test file storage
5. Test export generation

**Acceptance Criteria:**
- All tests pass
- Worker processes jobs correctly
- File storage works reliably
- Export generation is accurate
- Performance is acceptable

This implementation provides a complete, scalable export system with background processing, secure file handling, and real-time status updates suitable for enterprise data export needs.
