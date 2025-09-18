# HR Dashboard Backend Integration Guide

## Overview
Complete backend implementation for HRDashboard.tsx supporting HR metrics overview, employee management, leave tracking, attendance analytics, and quick actions with real-time updates.

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
-- HR Dashboard Cache Table
CREATE TABLE hr_dashboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  data_type VARCHAR(50) NOT NULL, -- 'kpis', 'recent_hires', 'leave_summary', 'attendance'
  period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  cached_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_hr_dashboard_cache_key ON hr_dashboard_cache(cache_key);
CREATE INDEX idx_hr_dashboard_cache_expires ON hr_dashboard_cache(expires_at);
CREATE INDEX idx_staff_hire_date ON staff(hire_date);
CREATE INDEX idx_attendance_records_date ON attendance_records(attendance_date);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);

-- HR Dashboard KPIs Function
CREATE OR REPLACE FUNCTION get_hr_dashboard_kpis(
  p_period VARCHAR(20),
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
  total_employees BIGINT,
  active_employees BIGINT,
  new_hires_this_period BIGINT,
  pending_leave_requests BIGINT,
  attendance_rate NUMERIC,
  departments_count BIGINT,
  average_processing_days NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH period_dates AS (
    SELECT 
      CASE p_period
        WHEN 'daily' THEN CURRENT_DATE
        WHEN 'weekly' THEN DATE_TRUNC('week', CURRENT_DATE)::DATE
        WHEN 'monthly' THEN DATE_TRUNC('month', CURRENT_DATE)::DATE
        WHEN 'yearly' THEN DATE_TRUNC('year', CURRENT_DATE)::DATE
        ELSE COALESCE(p_date_from, CURRENT_DATE)
      END as start_date,
      CASE p_period
        WHEN 'daily' THEN CURRENT_DATE
        WHEN 'weekly' THEN (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE
        WHEN 'monthly' THEN (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE
        WHEN 'yearly' THEN (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' - INTERVAL '1 day')::DATE
        ELSE COALESCE(p_date_to, CURRENT_DATE)
      END as end_date
  )
  SELECT 
    COUNT(DISTINCT s.id) as total_employees,
    COUNT(DISTINCT CASE WHEN s.is_active = true THEN s.id END) as active_employees,
    COUNT(DISTINCT CASE WHEN s.hire_date >= pd.start_date AND s.hire_date <= pd.end_date THEN s.id END) as new_hires_this_period,
    COUNT(DISTINCT CASE WHEN lr.status = 'pending' THEN lr.id END) as pending_leave_requests,
    ROUND(AVG(CASE WHEN ar.status = 'present' THEN 1.0 ELSE 0.0 END) * 100, 2) as attendance_rate,
    COUNT(DISTINCT d.id) as departments_count,
    ROUND(AVG(EXTRACT(DAYS FROM (lr.updated_at - lr.created_at))), 2) as average_processing_days
  FROM period_dates pd
  CROSS JOIN staff s
  LEFT JOIN departments d ON s.department_id = d.id
  LEFT JOIN attendance_records ar ON s.id = ar.staff_id 
    AND ar.attendance_date >= pd.start_date AND ar.attendance_date <= pd.end_date
  LEFT JOIN leave_requests lr ON s.id = lr.staff_id 
    AND lr.created_at::DATE >= pd.start_date AND lr.created_at::DATE <= pd.end_date;
END;
$$ LANGUAGE plpgsql;
```

---

## Express Routes

### Route File: `backend/src/routes/hrDashboard.routes.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles, hasPermission } from '../middleware/rbac';
import { asyncHandler } from '../middleware/errorHandler';
import * as hrDashboardController from '../controllers/hrDashboard.controller';

const router = Router();
router.use(requireAuth);

// Dashboard Data
router.get('/hr/dashboard', 
  requireRoles(['super_admin', 'hr_admin']),
  hasPermission('hr.dashboard.read'),
  asyncHandler(hrDashboardController.getDashboard)
);

router.get('/hr/dashboard/metrics', 
  requireRoles(['super_admin', 'hr_admin']),
  hasPermission('hr.dashboard.read'),
  asyncHandler(hrDashboardController.getDashboardMetrics)
);

// Employee Management
router.get('/hr/employees/recent-hires', 
  requireRoles(['super_admin', 'hr_admin']),
  hasPermission('hr.employees.read'),
  asyncHandler(hrDashboardController.getRecentHires)
);

router.get('/hr/employees', 
  requireRoles(['super_admin', 'hr_admin']),
  hasPermission('hr.employees.read'),
  asyncHandler(hrDashboardController.getEmployees)
);

// Leave Management
router.get('/hr/leave-requests', 
  requireRoles(['super_admin', 'hr_admin']),
  hasPermission('hr.leave.read'),
  asyncHandler(hrDashboardController.getLeaveRequests)
);

router.patch('/hr/leave-requests/:id/approve', 
  requireRoles(['super_admin', 'hr_admin']),
  hasPermission('hr.leave.update'),
  asyncHandler(hrDashboardController.approveLeaveRequest)
);

// Quick Actions
router.get('/hr/quick-actions/employee-count', 
  requireRoles(['super_admin', 'hr_admin']),
  hasPermission('hr.dashboard.read'),
  asyncHandler(hrDashboardController.getEmployeeCount)
);

router.post('/hr/reports/generate', 
  requireRoles(['super_admin', 'hr_admin']),
  hasPermission('hr.reports.create'),
  asyncHandler(hrDashboardController.generateReport)
);

export default router;
```

---

## Controllers

### Controller: `backend/src/controllers/hrDashboard.controller.ts`

```typescript
import { Request, Response } from 'express';
import { HRDashboardService } from '../services/hrDashboard.service';
import { validateDateRange } from '../validators/hrDashboard.validator';

export const getDashboard = async (req: Request, res: Response) => {
  const { period = 'monthly', date_from, date_to } = req.query;
  
  const dashboard = await HRDashboardService.getDashboard({
    period: period as string,
    date_from: date_from as string,
    date_to: date_to as string
  });
  
  res.json({
    success: true,
    data: dashboard
  });
};

export const getDashboardMetrics = async (req: Request, res: Response) => {
  const { period, date_from, date_to } = req.query;
  
  const metrics = await HRDashboardService.getKPIs({
    period: period as string || 'monthly',
    date_from: date_from as string,
    date_to: date_to as string
  });
  
  res.json({
    success: true,
    data: metrics
  });
};

export const getRecentHires = async (req: Request, res: Response) => {
  const { limit = 10, date_from, date_to, department_id } = req.query;
  
  const hires = await HRDashboardService.getRecentHires({
    limit: parseInt(limit as string),
    date_from: date_from as string,
    date_to: date_to as string,
    department_id: department_id as string
  });
  
  res.json({
    success: true,
    data: hires
  });
};

export const getLeaveRequests = async (req: Request, res: Response) => {
  const { status, page = 1, limit = 20 } = req.query;
  
  const requests = await HRDashboardService.getLeaveRequests({
    status: status as string,
    page: parseInt(page as string),
    limit: parseInt(limit as string)
  });
  
  res.json({
    success: true,
    data: requests
  });
};

export const approveLeaveRequest = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { approved_by, notes } = req.body;
  const userId = req.user.id;
  
  const result = await HRDashboardService.approveLeaveRequest(id, {
    approved_by: approved_by || userId,
    notes
  });
  
  res.json({
    success: true,
    data: result
  });
};

export const getEmployeeCount = async (req: Request, res: Response) => {
  const counts = await HRDashboardService.getEmployeeCounts();
  
  res.json({
    success: true,
    data: counts
  });
};

export const generateReport = async (req: Request, res: Response) => {
  const { report_type, format, date_range, filters } = req.body;
  const userId = req.user.id;
  
  const report = await HRDashboardService.generateReport({
    report_type,
    format,
    date_range,
    filters,
    user_id: userId
  });
  
  res.json({
    success: true,
    data: report
  });
};
```

---

## Services

### Service: `backend/src/services/hrDashboard.service.ts`

```typescript
import { supabase } from '../config/supabase';
import { CacheService } from './cache.service';
import { ExportService } from './exports.service';

export class HRDashboardService {
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static async getDashboard(filters: any) {
    const cacheKey = `hr_dashboard_${JSON.stringify(filters)}`;
    
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [kpis, recentHires, leaveSummary, attendance] = await Promise.all([
      this.getKPIs(filters),
      this.getRecentHires({ ...filters, limit: 5 }),
      this.getLeaveSummary(filters),
      this.getAttendanceSummary(filters)
    ]);

    const dashboard = {
      kpis,
      recent_hires: recentHires,
      leave_summary: leaveSummary,
      attendance_summary: attendance,
      last_updated: new Date().toISOString()
    };

    await CacheService.set(cacheKey, dashboard, this.CACHE_TTL);
    return dashboard;
  }

  static async getKPIs(filters: any) {
    const cacheKey = `hr_kpis_${JSON.stringify(filters)}`;
    
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase.rpc('get_hr_dashboard_kpis', {
      p_period: filters.period || 'monthly',
      p_date_from: filters.date_from || null,
      p_date_to: filters.date_to || null
    });

    if (error) throw error;

    const kpis = data[0] || {};
    await CacheService.set(cacheKey, kpis, this.CACHE_TTL);
    return kpis;
  }

  static async getRecentHires(filters: any) {
    let query = supabase
      .from('staff')
      .select(`
        id,
        first_name,
        last_name,
        position,
        hire_date,
        is_active,
        departments (
          id,
          name
        )
      `)
      .eq('is_active', true)
      .order('hire_date', { ascending: false })
      .limit(filters.limit || 10);

    if (filters.date_from) {
      query = query.gte('hire_date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('hire_date', filters.date_to);
    }
    if (filters.department_id) {
      query = query.eq('department_id', filters.department_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getLeaveSummary(filters: any) {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        id,
        status,
        leave_type,
        date_from,
        date_to,
        created_at,
        staff:staff_id (
          first_name,
          last_name,
          departments (
            name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const summary = {
      total_requests: data?.length || 0,
      pending: data?.filter(lr => lr.status === 'pending').length || 0,
      approved: data?.filter(lr => lr.status === 'approved').length || 0,
      rejected: data?.filter(lr => lr.status === 'rejected').length || 0,
      recent_requests: data || []
    };

    return summary;
  }

  static async getAttendanceSummary(filters: any) {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        id,
        status,
        attendance_date,
        total_hours,
        overtime_hours,
        staff:staff_id (
          department_id,
          departments (
            name
          )
        )
      `)
      .gte('attendance_date', filters.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('attendance_date', { ascending: false });

    if (error) throw error;

    const departmentStats = data?.reduce((acc: any, record: any) => {
      const deptName = record.staff?.departments?.name || 'Unknown';
      if (!acc[deptName]) {
        acc[deptName] = { present: 0, absent: 0, total: 0 };
      }
      acc[deptName].total++;
      if (record.status === 'present') acc[deptName].present++;
      if (record.status === 'absent') acc[deptName].absent++;
      return acc;
    }, {}) || {};

    const summary = {
      total_records: data?.length || 0,
      present_count: data?.filter(r => r.status === 'present').length || 0,
      absent_count: data?.filter(r => r.status === 'absent').length || 0,
      attendance_rate: data?.length ? ((data.filter(r => r.status === 'present').length / data.length) * 100).toFixed(2) : '0.00',
      department_breakdown: departmentStats
    };

    return summary;
  }

  static async getEmployeeCounts() {
    const { data, error } = await supabase
      .from('staff')
      .select('is_active')
      .eq('is_active', true);

    if (error) throw error;

    return {
      total_employees: data?.length || 0,
      active_employees: data?.length || 0
    };
  }

  static async generateReport(options: any) {
    const exportData = {
      export_name: `hr_dashboard_${options.report_type}_${new Date().toISOString()}`,
      export_type: 'hr_dashboard',
      format: options.format || 'csv',
      filters: options
    };

    return await ExportService.createExport(exportData, options.user_id);
  }
}
```

---

## Frontend Integration

### API Service: `frontend/src/services/hrDashboardService.ts`

```typescript
import { apiClient } from './apiClient';

export class HRDashboardService {
  static async getDashboard(period = 'monthly', dateFrom?: string, dateTo?: string) {
    const params = new URLSearchParams();
    params.append('period', period);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);

    const response = await apiClient.get(`/api/v1/hr/dashboard?${params.toString()}`);
    return response.data;
  }

  static async getRecentHires(limit = 10, departmentId?: string) {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (departmentId) params.append('department_id', departmentId);

    const response = await apiClient.get(`/api/v1/hr/employees/recent-hires?${params.toString()}`);
    return response.data;
  }

  static async getLeaveRequests(status?: string, page = 1, limit = 20) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await apiClient.get(`/api/v1/hr/leave-requests?${params.toString()}`);
    return response.data;
  }

  static async approveLeaveRequest(id: string, notes?: string) {
    const response = await apiClient.patch(`/api/v1/hr/leave-requests/${id}/approve`, {
      notes
    });
    return response.data;
  }

  static async generateReport(reportType: string, format = 'csv', filters?: any) {
    const response = await apiClient.post('/api/v1/hr/reports/generate', {
      report_type: reportType,
      format,
      filters
    });
    return response.data;
  }
}
```

---

## Implementation Plan

### Step 1: Database Setup
**Files to create:**
- `backend/supabase/migrations/001_create_hr_dashboard_tables.sql`

**Tasks:**
1. Create hr_dashboard_cache table
2. Add performance indexes
3. Create HR dashboard KPIs function
4. Test all database functions

### Step 2: Backend Services
**Files to create:**
- `backend/src/services/hrDashboard.service.ts`
- `backend/src/controllers/hrDashboard.controller.ts`
- `backend/src/routes/hrDashboard.routes.ts`

**Tasks:**
1. Implement HRDashboardService with caching
2. Create all controller methods
3. Set up route definitions with RBAC
4. Add validation for date ranges

### Step 3: Frontend Integration
**Files to create:**
- `frontend/src/services/hrDashboardService.ts`
- `frontend/src/hooks/useHRDashboard.ts`

**Tasks:**
1. Create API service layer
2. Implement React hooks for state management
3. Add real-time data refresh
4. Test all dashboard endpoints

### Acceptance Criteria
- Dashboard loads KPIs within 2 seconds
- Recent hires display correctly
- Leave request management works
- Export functionality generates reports
- RBAC prevents unauthorized access
- Caching improves performance by 50%

This implementation provides a comprehensive HR dashboard with real-time metrics, employee management, and integrated reporting capabilities.
