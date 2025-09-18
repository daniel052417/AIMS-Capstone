# Leave Management Backend Integration Guide

## Overview
Complete backend implementation for LeaveManagement.tsx supporting leave request lifecycle, balance tracking, approval workflows, file attachments, and comprehensive audit trails.

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
-- Leave Types Table
CREATE TABLE leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL, -- 'annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid'
  description TEXT,
  max_days_per_year INTEGER DEFAULT 0, -- 0 = unlimited
  accrual_policy JSONB DEFAULT '{}', -- {type: 'monthly', days: 1.25, max_carryover: 5}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leave Policies Table
CREATE TABLE leave_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name VARCHAR(255) NOT NULL,
  rules JSONB NOT NULL, -- {min_notice_days: 2, max_consecutive_days: 30, requires_approval: true}
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leave Requests Table
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(50) UNIQUE NOT NULL, -- Auto-generated: LR-2025-001
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL REFERENCES leave_types(name) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-review', 'approved', 'rejected', 'cancelled')),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  approver_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leave Balances Table
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL REFERENCES leave_types(name) ON DELETE RESTRICT,
  entitlement INTEGER NOT NULL DEFAULT 0,
  used INTEGER NOT NULL DEFAULT 0,
  remaining INTEGER GENERATED ALWAYS AS (entitlement - used) STORED,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, leave_type, year)
);

-- Leave Status History Table
CREATE TABLE leave_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leave Attachments Table
CREATE TABLE leave_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_leave_requests_staff ON leave_requests(staff_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_type ON leave_requests(leave_type);
CREATE INDEX idx_leave_requests_submitted_at ON leave_requests(submitted_at);
CREATE INDEX idx_leave_balances_staff_type ON leave_balances(staff_id, leave_type);
CREATE INDEX idx_leave_balances_year ON leave_balances(year);
CREATE INDEX idx_leave_status_history_request ON leave_status_history(leave_request_id);
CREATE INDEX idx_leave_attachments_request ON leave_attachments(leave_request_id);

-- Full-text search index for leave requests
CREATE INDEX idx_leave_requests_reason_gin ON leave_requests USING GIN (to_tsvector('english', reason));

-- Function to generate request number
CREATE OR REPLACE FUNCTION generate_leave_request_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  request_num TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 'LR-' || year_part || '-(.*)') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM leave_requests
  WHERE request_number LIKE 'LR-' || year_part || '-%';
  
  request_num := 'LR-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
  RETURN request_num;
END;
$$ LANGUAGE plpgsql;

-- Function to approve leave request
CREATE OR REPLACE FUNCTION approve_leave_request(
  p_request_id UUID,
  p_approved_by UUID,
  p_note TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  new_balance INTEGER
) AS $$
DECLARE
  request_record RECORD;
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get request details
  SELECT * INTO request_record
  FROM leave_requests
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Leave request not found or not pending', 0;
    RETURN;
  END IF;
  
  -- Check current balance
  SELECT remaining INTO current_balance
  FROM leave_balances
  WHERE staff_id = request_record.staff_id 
    AND leave_type = request_record.leave_type 
    AND year = EXTRACT(YEAR FROM request_record.start_date);
  
  IF current_balance IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Leave balance not found for this leave type', 0;
    RETURN;
  END IF;
  
  IF current_balance < request_record.days THEN
    RETURN QUERY SELECT FALSE, 'Insufficient leave balance', current_balance;
    RETURN;
  END IF;
  
  -- Update leave request
  UPDATE leave_requests
  SET status = 'approved',
      processed_by = p_approved_by,
      processed_at = NOW(),
      approver_notes = p_note,
      updated_at = NOW()
  WHERE id = p_request_id;
  
  -- Update leave balance
  UPDATE leave_balances
  SET used = used + request_record.days,
      updated_at = NOW()
  WHERE staff_id = request_record.staff_id 
    AND leave_type = request_record.leave_type 
    AND year = EXTRACT(YEAR FROM request_record.start_date);
  
  -- Get new balance
  SELECT remaining INTO new_balance
  FROM leave_balances
  WHERE staff_id = request_record.staff_id 
    AND leave_type = request_record.leave_type 
    AND year = EXTRACT(YEAR FROM request_record.start_date);
  
  -- Insert status history
  INSERT INTO leave_status_history (leave_request_id, old_status, new_status, changed_by, note)
  VALUES (p_request_id, 'pending', 'approved', p_approved_by, p_note);
  
  RETURN QUERY SELECT TRUE, 'Leave request approved successfully', new_balance;
END;
$$ LANGUAGE plpgsql;
```

---

## Express Routes

### Route File: `backend/src/routes/leave.routes.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles, hasPermission } from '../middleware/rbac';
import { asyncHandler } from '../middleware/errorHandler';
import { upload } from '../middleware/upload';
import * as leaveController from '../controllers/leave.controller';

const router = Router();
router.use(requireAuth);

// Leave Request Management
router.get('/hr/leave-requests', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager', 'manager']),
  hasPermission('hr.leave.read'),
  asyncHandler(leaveController.getLeaveRequests)
);

router.get('/hr/leave-requests/:id', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager', 'manager']),
  hasPermission('hr.leave.read'),
  asyncHandler(leaveController.getLeaveRequest)
);

router.post('/hr/leave-requests', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager', 'staff']),
  hasPermission('hr.leave.create'),
  asyncHandler(leaveController.createLeaveRequest)
);

router.put('/hr/leave-requests/:id', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager', 'staff']),
  hasPermission('hr.leave.update'),
  asyncHandler(leaveController.updateLeaveRequest)
);

// Approval Actions
router.patch('/hr/leave-requests/:id/approve', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager', 'manager']),
  hasPermission('hr.leave.approve'),
  asyncHandler(leaveController.approveLeaveRequest)
);

router.patch('/hr/leave-requests/:id/reject', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager', 'manager']),
  hasPermission('hr.leave.approve'),
  asyncHandler(leaveController.rejectLeaveRequest)
);

router.patch('/hr/leave-requests/:id/cancel', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager', 'staff']),
  hasPermission('hr.leave.update'),
  asyncHandler(leaveController.cancelLeaveRequest)
);

// Leave Balances
router.get('/hr/leave-balances', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager', 'manager']),
  hasPermission('hr.leave.read'),
  asyncHandler(leaveController.getLeaveBalances)
);

router.get('/hr/leave-balances/:staff_id', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager', 'manager']),
  hasPermission('hr.leave.read'),
  asyncHandler(leaveController.getStaffLeaveBalances)
);

router.put('/hr/leave-balances/:staff_id', 
  requireRoles(['super_admin', 'hr_admin']),
  hasPermission('hr.leave.update'),
  asyncHandler(leaveController.updateLeaveBalances)
);

// Attachments
router.post('/hr/leave-requests/:id/attachments', 
  upload.single('file'),
  requireRoles(['super_admin', 'hr_admin', 'hr_manager', 'staff']),
  hasPermission('hr.leave.update'),
  asyncHandler(leaveController.uploadAttachment)
);

router.get('/hr/leave-requests/:id/attachments', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager', 'manager']),
  hasPermission('hr.leave.read'),
  asyncHandler(leaveController.getAttachments)
);

router.delete('/hr/leave-attachments/:attachment_id', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager', 'staff']),
  hasPermission('hr.leave.update'),
  asyncHandler(leaveController.deleteAttachment)
);

// Analytics & Statistics
router.get('/hr/leave/statistics', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager']),
  hasPermission('hr.leave.analytics'),
  asyncHandler(leaveController.getLeaveStatistics)
);

router.get('/hr/leave/upcoming', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager', 'manager']),
  hasPermission('hr.leave.read'),
  asyncHandler(leaveController.getUpcomingLeaves)
);

// Bulk Operations
router.post('/hr/leave/bulk-approve', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager']),
  hasPermission('hr.leave.approve'),
  asyncHandler(leaveController.bulkApprove)
);

router.post('/hr/leave/bulk-reject', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager']),
  hasPermission('hr.leave.approve'),
  asyncHandler(leaveController.bulkReject)
);

router.get('/hr/leave/export', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager']),
  hasPermission('hr.leave.export'),
  asyncHandler(leaveController.exportLeaveData)
);

export default router;
```

---

## Controllers

### Controller: `backend/src/controllers/leave.controller.ts`

```typescript
import { Request, Response } from 'express';
import { LeaveService } from '../services/leave.service';
import { validateLeaveRequest, validateLeaveApproval } from '../validators/leave.validator';

export const getLeaveRequests = async (req: Request, res: Response) => {
  const { 
    status, 
    leave_type, 
    staff_id, 
    department, 
    date_from, 
    date_to, 
    search, 
    page = 1, 
    limit = 20,
    sort_by = 'submitted_at',
    sort_order = 'desc'
  } = req.query;

  const filters = {
    status: status as string,
    leave_type: leave_type as string,
    staff_id: staff_id as string,
    department: department as string,
    date_from: date_from as string,
    date_to: date_to as string,
    search: search as string,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    sort_by: sort_by as string,
    sort_order: sort_order as string
  };

  const result = await LeaveService.getLeaveRequests(filters);
  
  res.json({
    success: true,
    data: result.requests,
    pagination: result.pagination
  });
};

export const getLeaveRequest = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const request = await LeaveService.getLeaveRequestById(id);
  
  res.json({
    success: true,
    data: request
  });
};

export const createLeaveRequest = async (req: Request, res: Response) => {
  const validationResult = validateLeaveRequest(req.body);
  
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.errors
    });
  }

  const userId = req.user.id;
  const request = await LeaveService.createLeaveRequest(req.body, userId);
  
  res.status(201).json({
    success: true,
    data: request
  });
};

export const approveLeaveRequest = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { approved_by, note } = req.body;
  const userId = req.user.id;
  
  const result = await LeaveService.approveLeaveRequest(id, {
    approved_by: approved_by || userId,
    note
  });
  
  res.json({
    success: true,
    data: result
  });
};

export const rejectLeaveRequest = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rejected_by, reason } = req.body;
  const userId = req.user.id;
  
  const result = await LeaveService.rejectLeaveRequest(id, {
    rejected_by: rejected_by || userId,
    reason
  });
  
  res.json({
    success: true,
    data: result
  });
};

export const getLeaveBalances = async (req: Request, res: Response) => {
  const { staff_id, department, year, include_used } = req.query;
  
  const balances = await LeaveService.getLeaveBalances({
    staff_id: staff_id as string,
    department: department as string,
    year: year ? parseInt(year as string) : new Date().getFullYear(),
    include_used: include_used === 'true'
  });
  
  res.json({
    success: true,
    data: balances
  });
};

export const uploadAttachment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  const attachment = await LeaveService.uploadAttachment(id, req.file, userId);
  
  res.json({
    success: true,
    data: attachment
  });
};

export const getLeaveStatistics = async (req: Request, res: Response) => {
  const { date_from, date_to, department } = req.query;
  
  const statistics = await LeaveService.getLeaveStatistics({
    date_from: date_from as string,
    date_to: date_to as string,
    department: department as string
  });
  
  res.json({
    success: true,
    data: statistics
  });
};

export const bulkApprove = async (req: Request, res: Response) => {
  const { request_ids, approved_by, note } = req.body;
  const userId = req.user.id;
  
  const result = await LeaveService.bulkApprove(request_ids, {
    approved_by: approved_by || userId,
    note
  });
  
  res.json({
    success: true,
    data: result
  });
};
```

---

## Services

### Service: `backend/src/services/leave.service.ts`

```typescript
import { supabase } from '../config/supabase';
import { FileStorageService } from './fileStorage.service';
import { NotificationService } from './notification.service';

export class LeaveService {
  static async getLeaveRequests(filters: any) {
    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        staff:staff_id (
          id,
          first_name,
          last_name,
          employee_id,
          departments (
            name
          )
        ),
        submitted_by_user:submitted_by (
          first_name,
          last_name
        ),
        processed_by_user:processed_by (
          first_name,
          last_name
        ),
        leave_status_history (
          id,
          old_status,
          new_status,
          changed_at,
          note,
          changed_by_user:changed_by (
            first_name,
            last_name
          )
        )
      `);

    // Apply filters
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.leave_type) query = query.eq('leave_type', filters.leave_type);
    if (filters.staff_id) query = query.eq('staff_id', filters.staff_id);
    if (filters.department) query = query.eq('staff.department_id', filters.department);
    if (filters.date_from) query = query.gte('start_date', filters.date_from);
    if (filters.date_to) query = query.lte('end_date', filters.date_to);
    if (filters.search) {
      query = query.or(`reason.ilike.%${filters.search}%,staff.first_name.ilike.%${filters.search}%,staff.last_name.ilike.%${filters.search}%`);
    }

    // Apply sorting
    const sortOrder = filters.sort_order === 'asc' ? { ascending: true } : { ascending: false };
    query = query.order(filters.sort_by, sortOrder);

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: requests, error, count } = await query
      .range(from, to);

    if (error) throw error;

    return {
      requests: requests || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };
  }

  static async createLeaveRequest(requestData: any, userId: string) {
    // Generate request number
    const { data: requestNumber, error: numberError } = await supabase
      .rpc('generate_leave_request_number');

    if (numberError) throw numberError;

    // Check for date conflicts
    const { data: conflicts, error: conflictError } = await supabase
      .from('leave_requests')
      .select('id')
      .eq('staff_id', requestData.staff_id)
      .eq('status', 'approved')
      .or(`and(start_date.lte.${requestData.end_date},end_date.gte.${requestData.start_date})`);

    if (conflictError) throw conflictError;

    if (conflicts && conflicts.length > 0) {
      throw new Error('Leave request conflicts with existing approved leave');
    }

    // Check leave balance
    const { data: balance, error: balanceError } = await supabase
      .from('leave_balances')
      .select('remaining')
      .eq('staff_id', requestData.staff_id)
      .eq('leave_type', requestData.staff_id)
      .eq('year', new Date().getFullYear())
      .single();

    if (balanceError && balanceError.code !== 'PGRST116') throw balanceError;

    if (balance && balance.remaining < requestData.days) {
      throw new Error('Insufficient leave balance');
    }

    // Create leave request
    const { data: request, error } = await supabase
      .from('leave_requests')
      .insert({
        ...requestData,
        request_number: requestNumber,
        submitted_by: userId
      })
      .select(`
        *,
        staff:staff_id (
          first_name,
          last_name,
          employee_id
        )
      `)
      .single();

    if (error) throw error;

    // Insert initial status history
    await supabase
      .from('leave_status_history')
      .insert({
        leave_request_id: request.id,
        new_status: 'pending',
        changed_by: userId,
        note: 'Leave request submitted'
      });

    // Send notification to approvers
    await NotificationService.sendLeaveRequestNotification(request);

    return request;
  }

  static async approveLeaveRequest(requestId: string, approvalData: any) {
    const { data, error } = await supabase.rpc('approve_leave_request', {
      p_request_id: requestId,
      p_approved_by: approvalData.approved_by,
      p_note: approvalData.note
    });

    if (error) throw error;

    const result = data[0];
    if (!result.success) {
      throw new Error(result.message);
    }

    // Send notification to staff
    const { data: request } = await supabase
      .from('leave_requests')
      .select(`
        *,
        staff:staff_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', requestId)
      .single();

    if (request) {
      await NotificationService.sendLeaveApprovalNotification(request);
    }

    return {
      success: result.success,
      message: result.message,
      new_balance: result.new_balance
    };
  }

  static async rejectLeaveRequest(requestId: string, rejectionData: any) {
    const { data: request, error: fetchError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        processed_by: rejectionData.rejected_by,
        processed_at: new Date().toISOString(),
        rejection_reason: rejectionData.reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // Insert status history
    await supabase
      .from('leave_status_history')
      .insert({
        leave_request_id: requestId,
        old_status: 'pending',
        new_status: 'rejected',
        changed_by: rejectionData.rejected_by,
        note: rejectionData.reason
      });

    // Send notification
    await NotificationService.sendLeaveRejectionNotification(request);

    return {
      success: true,
      message: 'Leave request rejected successfully'
    };
  }

  static async getLeaveBalances(filters: any) {
    let query = supabase
      .from('leave_balances')
      .select(`
        *,
        staff:staff_id (
          id,
          first_name,
          last_name,
          employee_id,
          departments (
            name
          )
        )
      `);

    if (filters.staff_id) {
      query = query.eq('staff_id', filters.staff_id);
    }
    if (filters.department) {
      query = query.eq('staff.department_id', filters.department);
    }
    if (filters.year) {
      query = query.eq('year', filters.year);
    }

    const { data, error } = await query.order('staff_id', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async uploadAttachment(requestId: string, file: Express.Multer.File, userId: string) {
    // Upload file to storage
    const fileUrl = await FileStorageService.uploadFile(
      file.buffer,
      `leave-attachments/${requestId}/${file.originalname}`,
      file.mimetype
    );

    // Save attachment record
    const { data: attachment, error } = await supabase
      .from('leave_attachments')
      .insert({
        leave_request_id: requestId,
        file_url: fileUrl,
        file_name: file.originalname,
        file_type: file.mimetype,
        file_size: file.size,
        uploaded_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return attachment;
  }

  static async getLeaveStatistics(filters: any) {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        id,
        status,
        leave_type,
        submitted_at,
        processed_at,
        days
      `)
      .gte('submitted_at', filters.date_from || '1900-01-01')
      .lte('submitted_at', filters.date_to || '2100-12-31');

    if (error) throw error;

    const statistics = {
      total_requests: data?.length || 0,
      pending: data?.filter(r => r.status === 'pending').length || 0,
      approved: data?.filter(r => r.status === 'approved').length || 0,
      rejected: data?.filter(r => r.status === 'rejected').length || 0,
      cancelled: data?.filter(r => r.status === 'cancelled').length || 0,
      total_days_requested: data?.reduce((sum, r) => sum + r.days, 0) || 0,
      avg_processing_time: 0,
      leave_type_breakdown: {}
    };

    // Calculate average processing time
    const processedRequests = data?.filter(r => r.processed_at) || [];
    if (processedRequests.length > 0) {
      const totalProcessingTime = processedRequests.reduce((sum, r) => {
        const processingTime = new Date(r.processed_at).getTime() - new Date(r.submitted_at).getTime();
        return sum + processingTime;
      }, 0);
      statistics.avg_processing_time = Math.round(totalProcessingTime / processedRequests.length / (1000 * 60 * 60 * 24) * 100) / 100; // days
    }

    // Calculate leave type breakdown
    data?.forEach(request => {
      if (!statistics.leave_type_breakdown[request.leave_type]) {
        statistics.leave_type_breakdown[request.leave_type] = 0;
      }
      statistics.leave_type_breakdown[request.leave_type]++;
    });

    return statistics;
  }

  static async bulkApprove(requestIds: string[], approvalData: any) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const requestId of requestIds) {
      try {
        await this.approveLeaveRequest(requestId, approvalData);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          request_id: requestId,
          error: error.message
        });
      }
    }

    return results;
  }
}
```

---

## Frontend Integration

### API Service: `frontend/src/services/leaveService.ts`

```typescript
import { apiClient } from './apiClient';

export class LeaveService {
  static async getLeaveRequests(filters: any = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/api/v1/hr/leave-requests?${params.toString()}`);
    return response.data;
  }

  static async getLeaveRequest(id: string) {
    const response = await apiClient.get(`/api/v1/hr/leave-requests/${id}`);
    return response.data;
  }

  static async createLeaveRequest(requestData: any) {
    const response = await apiClient.post('/api/v1/hr/leave-requests', requestData);
    return response.data;
  }

  static async approveLeaveRequest(id: string, note?: string) {
    const response = await apiClient.patch(`/api/v1/hr/leave-requests/${id}/approve`, {
      note
    });
    return response.data;
  }

  static async rejectLeaveRequest(id: string, reason: string) {
    const response = await apiClient.patch(`/api/v1/hr/leave-requests/${id}/reject`, {
      reason
    });
    return response.data;
  }

  static async getLeaveBalances(filters: any = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/api/v1/hr/leave-balances?${params.toString()}`);
    return response.data;
  }

  static async uploadAttachment(requestId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`/api/v1/hr/leave-requests/${requestId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  static async getLeaveStatistics(filters: any = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/api/v1/hr/leave/statistics?${params.toString()}`);
    return response.data;
  }

  static async bulkApprove(requestIds: string[], note?: string) {
    const response = await apiClient.post('/api/v1/hr/leave/bulk-approve', {
      request_ids: requestIds,
      note
    });
    return response.data;
  }
}
```

---

## Implementation Plan

### Step 1: Database Setup
**Files to create:**
- `backend/supabase/migrations/001_create_leave_tables.sql`

**Tasks:**
1. Create all leave-related tables
2. Add performance indexes
3. Create leave functions
4. Test all database functions

### Step 2: Backend Services
**Files to create:**
- `backend/src/services/leave.service.ts`
- `backend/src/controllers/leave.controller.ts`
- `backend/src/routes/leave.routes.ts`
- `backend/src/validators/leave.validator.ts`

**Tasks:**
1. Implement LeaveService with all CRUD operations
2. Add approval workflow logic
3. Create file upload handling
4. Add audit logging

### Step 3: Frontend Integration
**Files to create:**
- `frontend/src/services/leaveService.ts`
- `frontend/src/hooks/useLeaveManagement.ts`

**Tasks:**
1. Create API service layer
2. Implement React hooks for state management
3. Add file upload functionality
4. Test all leave endpoints

### Acceptance Criteria
- Leave requests can be created and managed
- Approval workflow works correctly
- File attachments upload and display
- Leave balances track accurately
- Bulk operations function properly
- Audit trail captures all changes
- RBAC prevents unauthorized access

This implementation provides a comprehensive leave management system with complete workflow support, file handling, and audit trails for enterprise HR needs.
