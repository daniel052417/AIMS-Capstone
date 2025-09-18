# Claims Backend Integration Guide

## Overview
Complete backend implementation for Claims.tsx supporting customer claims and returns management with workflow processing, attachments, analytics, and comprehensive audit trails. This module handles the complete claims lifecycle from submission to resolution.

## Table of Contents
1. [Database Schema & Migrations](#database-schema--migrations)
2. [Express Routes & Controllers](#express-routes--controllers)
3. [Services & Data Layer](#services--data-layer)
4. [File Upload & Attachments](#file-upload--attachments)
5. [Analytics & Dashboard](#analytics--dashboard)
6. [Frontend Integration](#frontend-integration)
7. [Implementation Plan](#implementation-plan)

---

## Database Schema & Migrations

### Complete Migration SQL

```sql
-- Customer Claims Table
CREATE TABLE customer_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
  claim_type_id UUID NOT NULL REFERENCES claim_types(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'approved', 'rejected', 'resolved')),
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  submitted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_date TIMESTAMP WITH TIME ZONE,
  resolution TEXT,
  resolution_code VARCHAR(50),
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Claim Types Table
CREATE TABLE claim_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Claim Status History Table
CREATE TABLE claim_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES customer_claims(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  note TEXT,
  action VARCHAR(50) -- 'approve', 'reject', 'assign', 'resolve', 'create'
);

-- Claim Attachments Table
CREATE TABLE claim_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES customer_claims(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Claim Resolutions Table (detailed resolution info)
CREATE TABLE claim_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES customer_claims(id) ON DELETE CASCADE,
  resolution_type VARCHAR(50) NOT NULL, -- 'refund', 'replacement', 'credit', 'denial'
  resolution_text TEXT NOT NULL,
  resolution_code VARCHAR(50),
  resolved_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  refund_amount DECIMAL(10,2),
  replacement_order_id UUID REFERENCES sales_orders(id),
  notes TEXT
);

-- Performance Indexes
CREATE INDEX idx_customer_claims_customer_id ON customer_claims(customer_id);
CREATE INDEX idx_customer_claims_order_id ON customer_claims(order_id);
CREATE INDEX idx_customer_claims_status ON customer_claims(status);
CREATE INDEX idx_customer_claims_priority ON customer_claims(priority);
CREATE INDEX idx_customer_claims_assigned_to ON customer_claims(assigned_to_user_id);
CREATE INDEX idx_customer_claims_submitted_date ON customer_claims(submitted_date);
CREATE INDEX idx_customer_claims_claim_number ON customer_claims(claim_number);
CREATE INDEX idx_claim_status_history_claim_id ON claim_status_history(claim_id);
CREATE INDEX idx_claim_status_history_changed_at ON claim_status_history(changed_at);
CREATE INDEX idx_claim_attachments_claim_id ON claim_attachments(claim_id);
CREATE INDEX idx_claim_resolutions_claim_id ON claim_resolutions(claim_id);

-- Full-text search index
CREATE INDEX idx_customer_claims_search ON customer_claims USING gin(to_tsvector('english', title || ' ' || description));

-- Insert default claim types
INSERT INTO claim_types (name, description) VALUES
('Product Defect', 'Product received is defective or damaged'),
('Wrong Item', 'Received different item than ordered'),
('Missing Item', 'Item missing from order'),
('Late Delivery', 'Order delivered later than expected'),
('Quality Issue', 'Product quality does not meet expectations'),
('Size/Color Wrong', 'Wrong size or color received'),
('Return Request', 'Customer wants to return item'),
('Refund Request', 'Customer requests refund'),
('Other', 'Other type of claim');
```

### Claim Number Generation Function

```sql
-- Function to generate unique claim numbers
CREATE OR REPLACE FUNCTION generate_claim_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  new_number VARCHAR(50);
  counter INTEGER;
BEGIN
  -- Get current date in YYYYMMDD format
  new_number := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  -- Get count of claims for today
  SELECT COUNT(*) + 1 INTO counter
  FROM customer_claims
  WHERE claim_number LIKE new_number || '%';
  
  -- Pad counter with zeros (e.g., 001, 002, etc.)
  new_number := new_number || LPAD(counter::TEXT, 3, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
```

### Analytics Materialized View

```sql
-- Materialized view for claims analytics
CREATE MATERIALIZED VIEW claim_stats AS
SELECT 
  DATE_TRUNC('day', submitted_date) as date,
  status,
  priority,
  claim_type_id,
  ct.name as claim_type_name,
  COUNT(*) as claim_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM customer_claims cc
JOIN claim_types ct ON cc.claim_type_id = ct.id
WHERE submitted_date >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY DATE_TRUNC('day', submitted_date), status, priority, claim_type_id, ct.name;

-- Create index on materialized view
CREATE INDEX idx_claim_stats_date ON claim_stats(date);
CREATE INDEX idx_claim_stats_status ON claim_stats(status);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_claim_stats()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY claim_stats;
END;
$$ LANGUAGE plpgsql;
```

---

## Express Routes & Controllers

### Route File: `backend/src/routes/claims.routes.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles, hasPermission } from '../middleware/rbac';
import { asyncHandler } from '../middleware/errorHandler';
import * as claimsController from '../controllers/claims.controller';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  },
});

// Apply authentication to all routes
router.use(requireAuth);

// Claims Management Routes
router.get('/claims', 
  requireRoles(['super_admin', 'customer_service_admin', 'claims_admin']),
  hasPermission('claims.read'),
  asyncHandler(claimsController.listClaims)
);

router.get('/claims/:id', 
  requireRoles(['super_admin', 'customer_service_admin', 'claims_admin']),
  hasPermission('claims.read'),
  asyncHandler(claimsController.getClaim)
);

router.post('/claims', 
  requireRoles(['super_admin', 'customer_service_admin', 'claims_admin']),
  hasPermission('claims.create'),
  asyncHandler(claimsController.createClaim)
);

router.put('/claims/:id', 
  requireRoles(['super_admin', 'customer_service_admin', 'claims_admin']),
  hasPermission('claims.update'),
  asyncHandler(claimsController.updateClaim)
);

router.delete('/claims/:id', 
  requireRoles(['super_admin', 'customer_service_admin']),
  hasPermission('claims.delete'),
  asyncHandler(claimsController.deleteClaim)
);

// Claims Actions
router.post('/claims/:id/approve', 
  requireRoles(['super_admin', 'customer_service_admin', 'claims_admin']),
  hasPermission('claims.approve'),
  asyncHandler(claimsController.approveClaim)
);

router.post('/claims/:id/reject', 
  requireRoles(['super_admin', 'customer_service_admin', 'claims_admin']),
  hasPermission('claims.approve'),
  asyncHandler(claimsController.rejectClaim)
);

router.post('/claims/:id/assign', 
  requireRoles(['super_admin', 'customer_service_admin', 'claims_admin']),
  hasPermission('claims.assign'),
  asyncHandler(claimsController.assignClaim)
);

router.post('/claims/:id/resolve', 
  requireRoles(['super_admin', 'customer_service_admin', 'claims_admin']),
  hasPermission('claims.resolve'),
  asyncHandler(claimsController.resolveClaim)
);

// Bulk Operations
router.post('/claims/bulk-approve', 
  requireRoles(['super_admin', 'customer_service_admin', 'claims_admin']),
  hasPermission('claims.approve'),
  asyncHandler(claimsController.bulkApproveClaims)
);

router.post('/claims/bulk-reject', 
  requireRoles(['super_admin', 'customer_service_admin', 'claims_admin']),
  hasPermission('claims.approve'),
  asyncHandler(claimsController.bulkRejectClaims)
);

// Attachments
router.post('/claims/:id/attachments', 
  requireRoles(['super_admin', 'customer_service_admin', 'claims_admin']),
  hasPermission('claims.update'),
  upload.array('attachments', 5), // Max 5 files
  asyncHandler(claimsController.uploadAttachments)
);

router.get('/claims/:id/attachments', 
  requireRoles(['super_admin', 'customer_service_admin', 'claims_admin']),
  hasPermission('claims.read'),
  asyncHandler(claimsController.getClaimAttachments)
);

router.delete('/claims/attachments/:attachmentId', 
  requireRoles(['super_admin', 'customer_service_admin', 'claims_admin']),
  hasPermission('claims.update'),
  asyncHandler(claimsController.deleteAttachment)
);

// Analytics & Dashboard
router.get('/claims/dashboard', 
  requireRoles(['super_admin', 'customer_service_admin', 'claims_admin']),
  hasPermission('claims.analytics'),
  asyncHandler(claimsController.getClaimsDashboard)
);

router.get('/claims/analytics', 
  requireRoles(['super_admin', 'customer_service_admin', 'claims_admin']),
  hasPermission('claims.analytics'),
  asyncHandler(claimsController.getClaimsAnalytics)
);

router.get('/claims/types-distribution', 
  requireRoles(['super_admin', 'customer_service_admin', 'claims_admin']),
  hasPermission('claims.analytics'),
  asyncHandler(claimsController.getTypesDistribution)
);

router.get('/claims/recent-activity', 
  requireRoles(['super_admin', 'customer_service_admin', 'claims_admin']),
  hasPermission('claims.analytics'),
  asyncHandler(claimsController.getRecentActivity)
);

// Export & History
router.get('/claims/export', 
  requireRoles(['super_admin', 'customer_service_admin', 'claims_admin']),
  hasPermission('claims.export'),
  asyncHandler(claimsController.exportClaims)
);

router.get('/claims/:id/history', 
  requireRoles(['super_admin', 'customer_service_admin', 'claims_admin']),
  hasPermission('claims.read'),
  asyncHandler(claimsController.getClaimHistory)
);

export default router;
```

### Controller: `backend/src/controllers/claims.controller.ts`

```typescript
import { Request, Response } from 'express';
import { ClaimsService } from '../services/claims.service';
import { validateClaimInput } from '../validators/claim.validator';
import { AuditService } from '../services/audit.service';

export const listClaims = async (req: Request, res: Response) => {
  const {
    search,
    status,
    type,
    priority,
    assigned_to,
    customer_id,
    date_from,
    date_to,
    page = 1,
    limit = 25,
    sort_by = 'submitted_date',
    sort_order = 'desc'
  } = req.query;

  const filters = {
    search: search as string,
    status: status as string,
    type: type as string,
    priority: priority as string,
    assigned_to: assigned_to as string,
    customer_id: customer_id as string,
    date_from: date_from as string,
    date_to: date_to as string,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    sort_by: sort_by as string,
    sort_order: sort_order as 'asc' | 'desc'
  };

  const result = await ClaimsService.list(filters);
  
  res.json({
    success: true,
    data: result.claims,
    pagination: result.pagination
  });
};

export const createClaim = async (req: Request, res: Response) => {
  const validationResult = validateClaimInput(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.errors
    });
  }

  const userId = req.user.id;
  const claim = await ClaimsService.create(req.body, userId);
  
  // Audit log
  await AuditService.log({
    userId,
    action: 'claim_created',
    resource: 'customer_claims',
    resourceId: claim.id,
    details: { 
      claim_number: claim.claim_number,
      customer_id: claim.customer_id,
      amount: claim.amount
    }
  });

  res.status(201).json({
    success: true,
    data: claim
  });
};

export const approveClaim = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { resolution, resolution_code, resolution_type, refund_amount } = req.body;
  const userId = req.user.id;

  const result = await ClaimsService.approveClaim(id, {
    resolution,
    resolution_code,
    resolution_type,
    refund_amount,
    resolved_by: userId
  });
  
  await AuditService.log({
    userId,
    action: 'claim_approved',
    resource: 'customer_claims',
    resourceId: id,
    details: { 
      resolution_type,
      refund_amount,
      resolution_code
    }
  });

  res.json({
    success: true,
    data: result
  });
};

export const uploadAttachments = async (req: Request, res: Response) => {
  const { id } = req.params;
  const files = req.files as Express.Multer.File[];
  const userId = req.user.id;

  if (!files || files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  const attachments = await ClaimsService.uploadAttachments(id, files, userId);
  
  res.json({
    success: true,
    data: attachments
  });
};

export const getClaimsDashboard = async (req: Request, res: Response) => {
  const { date_from, date_to } = req.query;
  
  const dashboard = await ClaimsService.getDashboard({
    date_from: date_from as string,
    date_to: date_to as string
  });
  
  res.json({
    success: true,
    data: dashboard
  });
};

export const exportClaims = async (req: Request, res: Response) => {
  const { format = 'csv', date_from, date_to, include_attachments = 'false' } = req.query;
  
  const exportData = await ClaimsService.exportClaims({
    format: format as string,
    date_from: date_from as string,
    date_to: date_to as string,
    include_attachments: include_attachments === 'true'
  });
  
  res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="claims-export.${format}"`);
  
  res.send(exportData);
};
```

---

## Services & Data Layer

### Service: `backend/src/services/claims.service.ts`

```typescript
import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface ClaimFilters {
  search?: string;
  status?: string;
  type?: string;
  priority?: string;
  assigned_to?: string;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ClaimData {
  customer_id: string;
  order_id?: string;
  claim_type_id: string;
  title: string;
  description: string;
  amount: number;
  priority?: string;
  assigned_to_user_id?: string;
  due_date?: string;
}

export class ClaimsService {
  static async list(filters: ClaimFilters) {
    let query = supabase
      .from('customer_claims')
      .select(`
        *,
        customer:customer_id (
          id,
          first_name,
          last_name,
          email
        ),
        order:order_id (
          id,
          order_number,
          total_amount
        ),
        claim_type:claim_type_id (
          id,
          name
        ),
        assigned_user:assigned_to_user_id (
          id,
          first_name,
          last_name
        ),
        attachments:claim_attachments (
          id,
          file_name,
          file_type,
          uploaded_at
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,claim_number.ilike.%${filters.search}%`);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.type) {
      query = query.eq('claim_type.name', filters.type);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.assigned_to) {
      query = query.eq('assigned_to_user_id', filters.assigned_to);
    }
    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    if (filters.date_from) {
      query = query.gte('submitted_date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('submitted_date', filters.date_to);
    }

    // Apply sorting and pagination
    const sortColumn = filters.sort_by || 'submitted_date';
    const ascending = filters.sort_order === 'asc';
    
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;

    const { data: claims, error, count } = await query
      .order(sortColumn, { ascending })
      .range(from, to);

    if (error) throw error;

    return {
      claims: claims || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / filters.limit)
      }
    };
  }

  static async create(data: ClaimData, userId: string) {
    // Generate claim number
    const { data: claimNumber } = await supabase.rpc('generate_claim_number');
    
    const { data: claim, error } = await supabase
      .from('customer_claims')
      .insert({
        ...data,
        claim_number: claimNumber,
        submitted_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        customer:customer_id (
          id,
          first_name,
          last_name,
          email
        ),
        claim_type:claim_type_id (
          id,
          name
        )
      `)
      .single();

    if (error) throw error;

    // Add initial status history entry
    await supabase
      .from('claim_status_history')
      .insert({
        claim_id: claim.id,
        old_status: null,
        new_status: 'pending',
        changed_by: userId,
        note: 'Claim created',
        action: 'create'
      });

    return claim;
  }

  static async approveClaim(claimId: string, approvalData: any) {
    const { data: claim, error: claimError } = await supabase
      .from('customer_claims')
      .update({
        status: 'approved',
        resolved_date: new Date().toISOString(),
        resolution: approvalData.resolution,
        resolution_code: approvalData.resolution_code,
        resolved_by: approvalData.resolved_by,
        updated_at: new Date().toISOString()
      })
      .eq('id', claimId)
      .select()
      .single();

    if (claimError) throw claimError;

    // Add status history entry
    await supabase
      .from('claim_status_history')
      .insert({
        claim_id: claimId,
        old_status: 'pending',
        new_status: 'approved',
        changed_by: approvalData.resolved_by,
        note: `Claim approved: ${approvalData.resolution}`,
        action: 'approve'
      });

    // Add resolution details
    await supabase
      .from('claim_resolutions')
      .insert({
        claim_id: claimId,
        resolution_type: approvalData.resolution_type,
        resolution_text: approvalData.resolution,
        resolution_code: approvalData.resolution_code,
        resolved_by: approvalData.resolved_by,
        refund_amount: approvalData.refund_amount
      });

    return claim;
  }

  static async uploadAttachments(claimId: string, files: Express.Multer.File[], userId: string) {
    const attachments = [];

    for (const file of files) {
      // Generate unique filename
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `claim_${claimId}_${uuidv4()}.${fileExtension}`;
      const uploadPath = `claims/attachments/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('claims-files')
        .upload(uploadPath, file.buffer, {
          contentType: file.mimeType,
          cacheControl: '3600',
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('claims-files')
        .getPublicUrl(uploadPath);

      // Save attachment record
      const { data: attachment, error: dbError } = await supabase
        .from('claim_attachments')
        .insert({
          claim_id: claimId,
          file_name: file.originalname,
          file_url: urlData.publicUrl,
          file_type: file.mimetype,
          file_size: file.size,
          mime_type: file.mimetype,
          uploaded_by: userId
        })
        .select()
        .single();

      if (dbError) throw dbError;

      attachments.push(attachment);
    }

    return attachments;
  }

  static async getDashboard(filters: { date_from?: string; date_to?: string }) {
    let query = supabase
      .from('customer_claims')
      .select(`
        status,
        priority,
        amount,
        submitted_date,
        claim_type:claim_type_id (
          name
        )
      `);

    if (filters.date_from) {
      query = query.gte('submitted_date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('submitted_date', filters.date_to);
    }

    const { data: claims, error } = await query;

    if (error) throw error;

    // Calculate dashboard metrics
    const total = claims.length;
    const pending = claims.filter(c => c.status === 'pending').length;
    const approved = claims.filter(c => c.status === 'approved').length;
    const rejected = claims.filter(c => c.status === 'rejected').length;
    const resolved = claims.filter(c => c.status === 'resolved').length;
    const totalAmount = claims.reduce((sum, c) => sum + parseFloat(c.amount), 0);

    // Group by type
    const typeDistribution = claims.reduce((acc, claim) => {
      const type = claim.claim_type?.name || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Group by priority
    const priorityDistribution = claims.reduce((acc, claim) => {
      acc[claim.priority] = (acc[claim.priority] || 0) + 1;
      return acc;
    }, {});

    return {
      totals: {
        total,
        pending,
        approved,
        rejected,
        resolved,
        total_amount: totalAmount
      },
      type_distribution: typeDistribution,
      priority_distribution: priorityDistribution
    };
  }

  static async exportClaims(options: { format: string; date_from?: string; date_to?: string; include_attachments?: boolean }) {
    let query = supabase
      .from('customer_claims')
      .select(`
        *,
        customer:customer_id (
          first_name,
          last_name,
          email
        ),
        claim_type:claim_type_id (
          name
        ),
        assigned_user:assigned_to_user_id (
          first_name,
          last_name
        )
        ${options.include_attachments ? ',attachments:claim_attachments(*)' : ''}
      `);

    if (options.date_from) {
      query = query.gte('submitted_date', options.date_from);
    }
    if (options.date_to) {
      query = query.lte('submitted_date', options.date_to);
    }

    const { data: claims, error } = await query;

    if (error) throw error;

    if (options.format === 'csv') {
      return this.generateCSV(claims);
    } else {
      return this.generateExcel(claims);
    }
  }

  private static generateCSV(claims: any[]): string {
    const headers = [
      'Claim Number', 'Customer', 'Order ID', 'Type', 'Title', 'Description',
      'Amount', 'Status', 'Priority', 'Assigned To', 'Submitted Date', 'Resolved Date'
    ];

    const rows = claims.map(claim => [
      claim.claim_number,
      `${claim.customer?.first_name} ${claim.customer?.last_name}`,
      claim.order_id || '',
      claim.claim_type?.name || '',
      claim.title,
      claim.description,
      claim.amount,
      claim.status,
      claim.priority,
      claim.assigned_user ? `${claim.assigned_user.first_name} ${claim.assigned_user.last_name}` : '',
      claim.submitted_date,
      claim.resolved_date || ''
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  }

  private static generateExcel(claims: any[]): Buffer {
    // Implementation would use a library like 'exceljs'
    // This is a placeholder - implement based on your Excel library choice
    return Buffer.from('Excel data placeholder');
  }
}
```

---

## Frontend Integration

### API Service: `frontend/src/services/claimsService.ts`

```typescript
import { apiClient } from './apiClient';

export interface ClaimFilters {
  search?: string;
  status?: string;
  type?: string;
  priority?: string;
  assigned_to?: string;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ClaimData {
  customer_id: string;
  order_id?: string;
  claim_type_id: string;
  title: string;
  description: string;
  amount: number;
  priority?: string;
  assigned_to_user_id?: string;
  due_date?: string;
}

export class ClaimsService {
  static async getClaims(filters: ClaimFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/v1/claims?${params.toString()}`);
    return response.data;
  }

  static async getClaim(id: string) {
    const response = await apiClient.get(`/v1/claims/${id}`);
    return response.data;
  }

  static async createClaim(data: ClaimData) {
    const response = await apiClient.post('/v1/claims', data);
    return response.data;
  }

  static async updateClaim(id: string, data: Partial<ClaimData>) {
    const response = await apiClient.put(`/v1/claims/${id}`, data);
    return response.data;
  }

  static async deleteClaim(id: string) {
    const response = await apiClient.delete(`/v1/claims/${id}`);
    return response.data;
  }

  static async approveClaim(id: string, data: any) {
    const response = await apiClient.post(`/v1/claims/${id}/approve`, data);
    return response.data;
  }

  static async rejectClaim(id: string, data: any) {
    const response = await apiClient.post(`/v1/claims/${id}/reject`, data);
    return response.data;
  }

  static async assignClaim(id: string, data: any) {
    const response = await apiClient.post(`/v1/claims/${id}/assign`, data);
    return response.data;
  }

  static async resolveClaim(id: string, data: any) {
    const response = await apiClient.post(`/v1/claims/${id}/resolve`, data);
    return response.data;
  }

  static async bulkApproveClaims(claimIds: string[], data: any) {
    const response = await apiClient.post('/v1/claims/bulk-approve', {
      claim_ids: claimIds,
      ...data
    });
    return response.data;
  }

  static async bulkRejectClaims(claimIds: string[], data: any) {
    const response = await apiClient.post('/v1/claims/bulk-reject', {
      claim_ids: claimIds,
      ...data
    });
    return response.data;
  }

  static async uploadAttachments(id: string, files: File[]) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('attachments', file);
    });

    const response = await apiClient.post(`/v1/claims/${id}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  static async getClaimAttachments(id: string) {
    const response = await apiClient.get(`/v1/claims/${id}/attachments`);
    return response.data;
  }

  static async deleteAttachment(attachmentId: string) {
    const response = await apiClient.delete(`/v1/claims/attachments/${attachmentId}`);
    return response.data;
  }

  static async getClaimsDashboard(dateFrom?: string, dateTo?: string) {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);

    const response = await apiClient.get(`/v1/claims/dashboard?${params.toString()}`);
    return response.data;
  }

  static async getClaimsAnalytics(dateFrom?: string, dateTo?: string, groupBy?: string) {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (groupBy) params.append('group_by', groupBy);

    const response = await apiClient.get(`/v1/claims/analytics?${params.toString()}`);
    return response.data;
  }

  static async exportClaims(format: string = 'csv', dateFrom?: string, dateTo?: string, includeAttachments?: boolean) {
    const params = new URLSearchParams({ format });
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (includeAttachments) params.append('include_attachments', includeAttachments.toString());

    const response = await apiClient.get(`/v1/claims/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  static async getClaimHistory(id: string) {
    const response = await apiClient.get(`/v1/claims/${id}/history`);
    return response.data;
  }
}
```

---

## Implementation Plan

### Step 1: Database Setup
**Files to create:**
- `backend/supabase/migrations/001_create_claims_tables.sql`
- `backend/supabase/migrations/002_create_claims_functions.sql`

**Tasks:**
1. Create all claims-related tables
2. Add performance indexes
3. Create claim number generation function
4. Set up materialized view for analytics
5. Insert default claim types

**Acceptance Criteria:**
- All tables created successfully
- Indexes improve query performance
- Claim numbers are unique and sequential
- Materialized view updates correctly
- Default claim types are available

### Step 2: Backend Services
**Files to create:**
- `backend/src/services/claims.service.ts`
- `backend/src/validators/claim.validator.ts`
- `backend/src/controllers/claims.controller.ts`
- `backend/src/routes/claims.routes.ts`

**Tasks:**
1. Implement ClaimsService with all CRUD operations
2. Add workflow management (approve, reject, assign, resolve)
3. Implement file upload handling
4. Create analytics and dashboard functions
5. Add export functionality

**Acceptance Criteria:**
- All service methods work correctly
- File uploads are handled securely
- Workflow actions update status history
- Analytics provide accurate metrics
- Export generates proper files

### Step 3: API Routes & Controllers
**Files to create:**
- `backend/src/controllers/claims.controller.ts`
- `backend/src/routes/claims.routes.ts`

**Tasks:**
1. Create all API endpoints
2. Add proper authentication and RBAC
3. Implement input validation
4. Add error handling
5. Set up file upload middleware

**Acceptance Criteria:**
- All endpoints return correct status codes
- Authentication and authorization work
- File uploads are validated
- Error responses are consistent
- Audit logs are created

### Step 4: Frontend Integration
**Files to create:**
- `frontend/src/services/claimsService.ts`
- `frontend/src/hooks/useClaims.ts`

**Tasks:**
1. Create API service layer
2. Implement React hooks for state management
3. Add file upload functionality
4. Test all CRUD operations
5. Implement export functionality

**Acceptance Criteria:**
- All API calls work correctly
- File uploads work properly
- State management is efficient
- Export downloads work
- UI updates reflect backend changes

### Step 5: Testing & Validation
**Files to create:**
- `backend/src/tests/claims.service.test.ts`
- `backend/src/tests/claims.controller.test.ts`
- `frontend/src/tests/claimsService.test.ts`

**Tasks:**
1. Test all service methods
2. Test API endpoints
3. Test file upload functionality
4. Test workflow operations
5. Test export functionality

**Acceptance Criteria:**
- All tests pass
- File uploads are secure
- Workflow operations are atomic
- Performance is acceptable
- Documentation is complete

This implementation provides a complete, scalable claims management system with workflow processing, file attachments, analytics, and comprehensive audit trails suitable for enterprise customer service operations.
