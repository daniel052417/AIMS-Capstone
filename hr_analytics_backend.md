# HR Analytics Backend Integration Guide

## Overview
Complete backend implementation for HRAnalytics.tsx supporting workforce insights, attendance analytics, leave management metrics, and department performance with real-time updates and data export capabilities.

## Table of Contents
1. [Database Schema & Migrations](#database-schema--migrations)
2. [Express Routes & Controllers](#express-routes--controllers)
3. [Services & Data Layer](#services--data-layer)
4. [Real-time Updates](#real-time-updates)
5. [Frontend Integration](#frontend-integration)
6. [Implementation Plan](#implementation-plan)

---

## Database Schema & Migrations

### Complete Migration SQL

```sql
-- HR Analytics Cache Table (Optional - for performance)
CREATE TABLE hr_analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  data_type VARCHAR(50) NOT NULL, -- 'attendance', 'leave', 'department', 'workforce'
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  cached_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HR Analytics Exports Table (Optional - for export tracking)
CREATE TABLE hr_analytics_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_name VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL, -- 'attendance', 'leave', 'department', 'workforce'
  format VARCHAR(10) NOT NULL CHECK (format IN ('csv', 'excel', 'pdf')),
  file_path TEXT,
  file_size BIGINT DEFAULT 0,
  filters JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Performance Indexes
CREATE INDEX idx_attendance_records_date ON attendance_records(attendance_date);
CREATE INDEX idx_attendance_records_staff ON attendance_records(staff_id);
CREATE INDEX idx_attendance_records_department ON attendance_records(staff_id) INCLUDE (attendance_date);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_date_from ON leave_requests(date_from);
CREATE INDEX idx_leave_requests_date_to ON leave_requests(date_to);
CREATE INDEX idx_leave_requests_leave_type ON leave_requests(leave_type);
CREATE INDEX idx_hr_analytics_cache_key ON hr_analytics_cache(cache_key);
CREATE INDEX idx_hr_analytics_cache_expires ON hr_analytics_cache(expires_at);
CREATE INDEX idx_hr_analytics_exports_type ON hr_analytics_exports(report_type);
CREATE INDEX idx_hr_analytics_exports_created_by ON hr_analytics_exports(created_by);

-- Function to get attendance analytics
CREATE OR REPLACE FUNCTION get_attendance_analytics(
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_department_id UUID DEFAULT NULL,
  p_staff_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_days BIGINT,
  present_days BIGINT,
  absent_days BIGINT,
  late_arrivals BIGINT,
  early_departures BIGINT,
  overtime_hours NUMERIC,
  average_hours_per_day NUMERIC,
  attendance_rate NUMERIC,
  department_name TEXT,
  staff_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_days,
    COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_days,
    COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_days,
    COUNT(CASE WHEN ar.time_in > '09:00:00' THEN 1 END) as late_arrivals,
    COUNT(CASE WHEN ar.time_out < '17:00:00' THEN 1 END) as early_departures,
    COALESCE(SUM(ar.overtime_hours), 0) as overtime_hours,
    ROUND(AVG(ar.total_hours), 2) as average_hours_per_day,
    ROUND((COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::NUMERIC / COUNT(*)) * 100, 2) as attendance_rate,
    d.name as department_name,
    CONCAT(s.first_name, ' ', s.last_name) as staff_name
  FROM attendance_records ar
  JOIN staff s ON ar.staff_id = s.id
  LEFT JOIN departments d ON s.department_id = d.id
  WHERE (p_date_from IS NULL OR ar.attendance_date >= p_date_from)
    AND (p_date_to IS NULL OR ar.attendance_date <= p_date_to)
    AND (p_department_id IS NULL OR s.department_id = p_department_id)
    AND (p_staff_id IS NULL OR ar.staff_id = p_staff_id)
  GROUP BY d.name, s.id, s.first_name, s.last_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get leave analytics
CREATE OR REPLACE FUNCTION get_leave_analytics(
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_leave_type VARCHAR(50) DEFAULT NULL,
  p_status VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
  total_requests BIGINT,
  approved_requests BIGINT,
  pending_requests BIGINT,
  rejected_requests BIGINT,
  average_processing_days NUMERIC,
  total_leave_days NUMERIC,
  leave_type VARCHAR(50),
  department_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_requests,
    COUNT(CASE WHEN lr.status = 'approved' THEN 1 END) as approved_requests,
    COUNT(CASE WHEN lr.status = 'pending' THEN 1 END) as pending_requests,
    COUNT(CASE WHEN lr.status = 'rejected' THEN 1 END) as rejected_requests,
    ROUND(AVG(EXTRACT(DAYS FROM (lr.updated_at - lr.created_at))), 2) as average_processing_days,
    SUM(EXTRACT(DAYS FROM (lr.date_to - lr.date_from)) + 1) as total_leave_days,
    lr.leave_type,
    d.name as department_name
  FROM leave_requests lr
  JOIN staff s ON lr.staff_id = s.id
  LEFT JOIN departments d ON s.department_id = d.id
  WHERE (p_date_from IS NULL OR lr.date_from >= p_date_from)
    AND (p_date_to IS NULL OR lr.date_to <= p_date_to)
    AND (p_leave_type IS NULL OR lr.leave_type = p_leave_type)
    AND (p_status IS NULL OR lr.status = p_status)
  GROUP BY lr.leave_type, d.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get department performance
CREATE OR REPLACE FUNCTION get_department_performance(
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_department_id UUID DEFAULT NULL
)
RETURNS TABLE (
  department_id UUID,
  department_name TEXT,
  total_staff BIGINT,
  average_attendance_rate NUMERIC,
  total_leave_days NUMERIC,
  average_processing_time NUMERIC,
  staff_turnover_rate NUMERIC,
  performance_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH dept_stats AS (
    SELECT 
      d.id as dept_id,
      d.name as dept_name,
      COUNT(DISTINCT s.id) as staff_count,
      ROUND(AVG(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) * 100, 2) as avg_attendance,
      SUM(EXTRACT(DAYS FROM (lr.date_to - lr.date_from)) + 1) as total_leave,
      ROUND(AVG(EXTRACT(DAYS FROM (lr.updated_at - lr.created_at))), 2) as avg_processing
    FROM departments d
    LEFT JOIN staff s ON d.id = s.department_id
    LEFT JOIN attendance_records ar ON s.id = ar.staff_id
      AND (p_date_from IS NULL OR ar.attendance_date >= p_date_from)
      AND (p_date_to IS NULL OR ar.attendance_date <= p_date_to)
    LEFT JOIN leave_requests lr ON s.id = lr.staff_id
      AND (p_date_from IS NULL OR lr.date_from >= p_date_from)
      AND (p_date_to IS NULL OR lr.date_to <= p_date_to)
    WHERE (p_department_id IS NULL OR d.id = p_department_id)
    GROUP BY d.id, d.name
  )
  SELECT 
    dept_id,
    dept_name,
    staff_count,
    COALESCE(avg_attendance, 0) as average_attendance_rate,
    COALESCE(total_leave, 0) as total_leave_days,
    COALESCE(avg_processing, 0) as average_processing_time,
    0 as staff_turnover_rate, -- Placeholder - would need historical data
    ROUND((COALESCE(avg_attendance, 0) + (100 - COALESCE(avg_processing, 0)) * 0.1) / 2, 2) as performance_score
  FROM dept_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to get workforce insights
CREATE OR REPLACE FUNCTION get_workforce_insights(
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
  total_employees BIGINT,
  active_employees BIGINT,
  departments_count BIGINT,
  average_attendance_rate NUMERIC,
  total_leave_requests BIGINT,
  pending_leave_requests BIGINT,
  average_processing_time NUMERIC,
  overtime_hours NUMERIC,
  top_department TEXT,
  most_common_leave_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH workforce_stats AS (
    SELECT 
      COUNT(DISTINCT s.id) as total_emp,
      COUNT(DISTINCT CASE WHEN s.is_active = true THEN s.id END) as active_emp,
      COUNT(DISTINCT d.id) as dept_count,
      ROUND(AVG(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) * 100, 2) as avg_attendance,
      COUNT(DISTINCT lr.id) as total_leave,
      COUNT(DISTINCT CASE WHEN lr.status = 'pending' THEN lr.id END) as pending_leave,
      ROUND(AVG(EXTRACT(DAYS FROM (lr.updated_at - lr.created_at))), 2) as avg_processing,
      SUM(ar.overtime_hours) as total_overtime
    FROM staff s
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN attendance_records ar ON s.id = ar.staff_id
      AND (p_date_from IS NULL OR ar.attendance_date >= p_date_from)
      AND (p_date_to IS NULL OR ar.attendance_date <= p_date_to)
    LEFT JOIN leave_requests lr ON s.id = lr.staff_id
      AND (p_date_from IS NULL OR lr.date_from >= p_date_from)
      AND (p_date_to IS NULL OR lr.date_to <= p_date_to)
  ),
  top_dept AS (
    SELECT d.name
    FROM departments d
    JOIN staff s ON d.id = s.department_id
    JOIN attendance_records ar ON s.id = ar.staff_id
    WHERE (p_date_from IS NULL OR ar.attendance_date >= p_date_from)
      AND (p_date_to IS NULL OR ar.attendance_date <= p_date_to)
    GROUP BY d.id, d.name
    ORDER BY AVG(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) DESC
    LIMIT 1
  ),
  common_leave AS (
    SELECT lr.leave_type
    FROM leave_requests lr
    WHERE (p_date_from IS NULL OR lr.date_from >= p_date_from)
      AND (p_date_to IS NULL OR lr.date_to <= p_date_to)
    GROUP BY lr.leave_type
    ORDER BY COUNT(*) DESC
    LIMIT 1
  )
  SELECT 
    ws.total_emp,
    ws.active_emp,
    ws.dept_count,
    COALESCE(ws.avg_attendance, 0) as average_attendance_rate,
    COALESCE(ws.total_leave, 0) as total_leave_requests,
    COALESCE(ws.pending_leave, 0) as pending_leave_requests,
    COALESCE(ws.avg_processing, 0) as average_processing_time,
    COALESCE(ws.total_overtime, 0) as overtime_hours,
    td.name as top_department,
    cl.leave_type as most_common_leave_type
  FROM workforce_stats ws
  CROSS JOIN (SELECT name FROM top_dept) td
  CROSS JOIN (SELECT leave_type FROM common_leave) cl;
END;
$$ LANGUAGE plpgsql;
```

---

## Express Routes & Controllers

### Route File: `backend/src/routes/hrAnalytics.routes.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles, hasPermission } from '../middleware/rbac';
import { asyncHandler } from '../middleware/errorHandler';
import * as hrAnalyticsController from '../controllers/hrAnalytics.controller';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Analytics & Reporting
router.get('/hr/analytics/attendance', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager']),
  hasPermission('hr.analytics.read'),
  asyncHandler(hrAnalyticsController.getAttendanceAnalytics)
);

router.get('/hr/analytics/leave', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager']),
  hasPermission('hr.analytics.read'),
  asyncHandler(hrAnalyticsController.getLeaveAnalytics)
);

router.get('/hr/analytics/department-performance', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager']),
  hasPermission('hr.analytics.read'),
  asyncHandler(hrAnalyticsController.getDepartmentPerformance)
);

router.get('/hr/analytics/workforce-insights', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager']),
  hasPermission('hr.analytics.read'),
  asyncHandler(hrAnalyticsController.getWorkforceInsights)
);

// Data Management
router.get('/hr/analytics/export', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager']),
  hasPermission('hr.analytics.export'),
  asyncHandler(hrAnalyticsController.exportAnalytics)
);

router.post('/hr/analytics/refresh', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager']),
  hasPermission('hr.analytics.update'),
  asyncHandler(hrAnalyticsController.refreshAnalytics)
);

// Department & Staff Data
router.get('/hr/departments', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager']),
  hasPermission('hr.departments.read'),
  asyncHandler(hrAnalyticsController.getDepartments)
);

router.get('/hr/staff/analytics', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager']),
  hasPermission('hr.staff.read'),
  asyncHandler(hrAnalyticsController.getStaffAnalytics)
);

// Leave Management
router.get('/hr/leave-requests/analytics', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager']),
  hasPermission('hr.leave.read'),
  asyncHandler(hrAnalyticsController.getLeaveRequestAnalytics)
);

router.get('/hr/leave-requests/processing-metrics', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager']),
  hasPermission('hr.leave.read'),
  asyncHandler(hrAnalyticsController.getLeaveProcessingMetrics)
);

// Attendance Tracking
router.get('/hr/attendance/analytics', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager']),
  hasPermission('hr.attendance.read'),
  asyncHandler(hrAnalyticsController.getAttendanceAnalytics)
);

router.get('/hr/attendance/department-summary', 
  requireRoles(['super_admin', 'hr_admin', 'hr_manager']),
  hasPermission('hr.attendance.read'),
  asyncHandler(hrAnalyticsController.getAttendanceDepartmentSummary)
);

export default router;
```

### Controller: `backend/src/controllers/hrAnalytics.controller.ts`

```typescript
import { Request, Response } from 'express';
import { HRAnalyticsService } from '../services/hrAnalytics.service';
import { validateDateRange } from '../validators/analytics.validator';

export const getAttendanceAnalytics = async (req: Request, res: Response) => {
  const { date_from, date_to, department_id, staff_id } = req.query;
  
  const validationResult = validateDateRange({ date_from, date_to });
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.errors
    });
  }

  const analytics = await HRAnalyticsService.getAttendanceAnalytics({
    date_from: date_from as string,
    date_to: date_to as string,
    department_id: department_id as string,
    staff_id: staff_id as string
  });
  
  res.json({
    success: true,
    data: analytics
  });
};

export const getLeaveAnalytics = async (req: Request, res: Response) => {
  const { date_from, date_to, leave_type, status } = req.query;
  
  const validationResult = validateDateRange({ date_from, date_to });
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.errors
    });
  }

  const analytics = await HRAnalyticsService.getLeaveAnalytics({
    date_from: date_from as string,
    date_to: date_to as string,
    leave_type: leave_type as string,
    status: status as string
  });
  
  res.json({
    success: true,
    data: analytics
  });
};

export const getDepartmentPerformance = async (req: Request, res: Response) => {
  const { date_from, date_to, department_id } = req.query;
  
  const validationResult = validateDateRange({ date_from, date_to });
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.errors
    });
  }

  const performance = await HRAnalyticsService.getDepartmentPerformance({
    date_from: date_from as string,
    date_to: date_to as string,
    department_id: department_id as string
  });
  
  res.json({
    success: true,
    data: performance
  });
};

export const getWorkforceInsights = async (req: Request, res: Response) => {
  const { date_from, date_to } = req.query;
  
  const validationResult = validateDateRange({ date_from, date_to });
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.errors
    });
  }

  const insights = await HRAnalyticsService.getWorkforceInsights({
    date_from: date_from as string,
    date_to: date_to as string
  });
  
  res.json({
    success: true,
    data: insights
  });
};

export const exportAnalytics = async (req: Request, res: Response) => {
  const { report_type, format, date_from, date_to } = req.query;
  const userId = req.user.id;
  
  const exportData = await HRAnalyticsService.exportAnalytics({
    report_type: report_type as string,
    format: format as string || 'csv',
    date_from: date_from as string,
    date_to: date_to as string,
    user_id: userId
  });
  
  res.json({
    success: true,
    data: exportData
  });
};

export const refreshAnalytics = async (req: Request, res: Response) => {
  const { refresh_type = 'all' } = req.body;
  const userId = req.user.id;
  
  const result = await HRAnalyticsService.refreshAnalytics(refresh_type, userId);
  
  res.json({
    success: true,
    data: result
  });
};

export const getDepartments = async (req: Request, res: Response) => {
  const { active_only = 'true', include_stats = 'false' } = req.query;
  
  const departments = await HRAnalyticsService.getDepartments({
    active_only: active_only === 'true',
    include_stats: include_stats === 'true'
  });
  
  res.json({
    success: true,
    data: departments
  });
};

export const getStaffAnalytics = async (req: Request, res: Response) => {
  const { department_id, position, date_from, date_to } = req.query;
  
  const analytics = await HRAnalyticsService.getStaffAnalytics({
    department_id: department_id as string,
    position: position as string,
    date_from: date_from as string,
    date_to: date_to as string
  });
  
  res.json({
    success: true,
    data: analytics
  });
};

export const getLeaveRequestAnalytics = async (req: Request, res: Response) => {
  const { status, leave_type, date_from, date_to } = req.query;
  
  const analytics = await HRAnalyticsService.getLeaveRequestAnalytics({
    status: status as string,
    leave_type: leave_type as string,
    date_from: date_from as string,
    date_to: date_to as string
  });
  
  res.json({
    success: true,
    data: analytics
  });
};

export const getLeaveProcessingMetrics = async (req: Request, res: Response) => {
  const { date_from, date_to } = req.query;
  
  const metrics = await HRAnalyticsService.getLeaveProcessingMetrics({
    date_from: date_from as string,
    date_to: date_to as string
  });
  
  res.json({
    success: true,
    data: metrics
  });
};

export const getAttendanceDepartmentSummary = async (req: Request, res: Response) => {
  const { date_from, date_to } = req.query;
  
  const summary = await HRAnalyticsService.getAttendanceDepartmentSummary({
    date_from: date_from as string,
    date_to: date_to as string
  });
  
  res.json({
    success: true,
    data: summary
  });
};
```

---

## Services & Data Layer

### Service: `backend/src/services/hrAnalytics.service.ts`

```typescript
import { supabase } from '../config/supabase';
import { CacheService } from './cache.service';
import { ExportService } from './exports.service';

export interface AnalyticsFilters {
  date_from?: string;
  date_to?: string;
  department_id?: string;
  staff_id?: string;
  leave_type?: string;
  status?: string;
  position?: string;
}

export interface DepartmentOptions {
  active_only?: boolean;
  include_stats?: boolean;
}

export class HRAnalyticsService {
  private static readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  static async getAttendanceAnalytics(filters: AnalyticsFilters) {
    const cacheKey = `attendance_analytics_${JSON.stringify(filters)}`;
    
    // Try cache first
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabase.rpc('get_attendance_analytics', {
      p_date_from: filters.date_from || null,
      p_date_to: filters.date_to || null,
      p_department_id: filters.department_id || null,
      p_staff_id: filters.staff_id || null
    });

    if (error) throw error;

    // Cache the result
    await CacheService.set(cacheKey, data, this.CACHE_TTL);

    return data;
  }

  static async getLeaveAnalytics(filters: AnalyticsFilters) {
    const cacheKey = `leave_analytics_${JSON.stringify(filters)}`;
    
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabase.rpc('get_leave_analytics', {
      p_date_from: filters.date_from || null,
      p_date_to: filters.date_to || null,
      p_leave_type: filters.leave_type || null,
      p_status: filters.status || null
    });

    if (error) throw error;

    await CacheService.set(cacheKey, data, this.CACHE_TTL);
    return data;
  }

  static async getDepartmentPerformance(filters: AnalyticsFilters) {
    const cacheKey = `department_performance_${JSON.stringify(filters)}`;
    
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabase.rpc('get_department_performance', {
      p_date_from: filters.date_from || null,
      p_date_to: filters.date_to || null,
      p_department_id: filters.department_id || null
    });

    if (error) throw error;

    await CacheService.set(cacheKey, data, this.CACHE_TTL);
    return data;
  }

  static async getWorkforceInsights(filters: AnalyticsFilters) {
    const cacheKey = `workforce_insights_${JSON.stringify(filters)}`;
    
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabase.rpc('get_workforce_insights', {
      p_date_from: filters.date_from || null,
      p_date_to: filters.date_to || null
    });

    if (error) throw error;

    await CacheService.set(cacheKey, data, this.CACHE_TTL);
    return data[0]; // Function returns single row
  }

  static async getDepartments(options: DepartmentOptions = {}) {
    let query = supabase
      .from('departments')
      .select(`
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
      `);

    if (options.active_only) {
      query = query.eq('is_active', true);
    }

    if (options.include_stats) {
      // Add department statistics
      const { data: deptStats, error: statsError } = await supabase.rpc('get_department_performance');
      if (!statsError && deptStats) {
        // Merge statistics with department data
        const departments = await query;
        return departments.data?.map(dept => ({
          ...dept,
          stats: deptStats.find((stat: any) => stat.department_id === dept.id)
        }));
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return data;
  }

  static async getStaffAnalytics(filters: AnalyticsFilters) {
    let query = supabase
      .from('staff')
      .select(`
        id,
        first_name,
        last_name,
        position,
        department_id,
        is_active,
        departments (
          id,
          name
        )
      `);

    if (filters.department_id) {
      query = query.eq('department_id', filters.department_id);
    }

    if (filters.position) {
      query = query.eq('position', filters.position);
    }

    const { data: staff, error } = await query;
    if (error) throw error;

    // Get attendance data for each staff member
    const staffWithAnalytics = await Promise.all(
      (staff || []).map(async (member) => {
        const { data: attendance } = await supabase.rpc('get_attendance_analytics', {
          p_date_from: filters.date_from || null,
          p_date_to: filters.date_to || null,
          p_department_id: null,
          p_staff_id: member.id
        });

        return {
          ...member,
          attendance_analytics: attendance?.[0] || null
        };
      })
    );

    return staffWithAnalytics;
  }

  static async getLeaveRequestAnalytics(filters: AnalyticsFilters) {
    let query = supabase
      .from('leave_requests')
      .select(`
        id,
        leave_type,
        status,
        date_from,
        date_to,
        created_at,
        updated_at,
        staff:staff_id (
          id,
          first_name,
          last_name,
          department_id,
          departments (
            name
          )
        )
      `);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.leave_type) {
      query = query.eq('leave_type', filters.leave_type);
    }

    if (filters.date_from) {
      query = query.gte('date_from', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('date_to', filters.date_to);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data;
  }

  static async getLeaveProcessingMetrics(filters: AnalyticsFilters) {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        leave_type
      `)
      .gte('created_at', filters.date_from || '1900-01-01')
      .lte('created_at', filters.date_to || '2100-12-31');

    if (error) throw error;

    // Calculate processing metrics
    const metrics = {
      total_requests: data?.length || 0,
      approved_requests: data?.filter(lr => lr.status === 'approved').length || 0,
      pending_requests: data?.filter(lr => lr.status === 'pending').length || 0,
      rejected_requests: data?.filter(lr => lr.status === 'rejected').length || 0,
      average_processing_days: 0,
      approval_rate: 0,
      rejection_rate: 0
    };

    if (data && data.length > 0) {
      const processedRequests = data.filter(lr => lr.status !== 'pending');
      if (processedRequests.length > 0) {
        const totalProcessingDays = processedRequests.reduce((sum, lr) => {
          const processingDays = Math.ceil(
            (new Date(lr.updated_at).getTime() - new Date(lr.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + processingDays;
        }, 0);
        
        metrics.average_processing_days = Math.round(totalProcessingDays / processedRequests.length * 100) / 100;
      }

      metrics.approval_rate = Math.round((metrics.approved_requests / metrics.total_requests) * 100 * 100) / 100;
      metrics.rejection_rate = Math.round((metrics.rejected_requests / metrics.total_requests) * 100 * 100) / 100;
    }

    return metrics;
  }

  static async getAttendanceDepartmentSummary(filters: AnalyticsFilters) {
    const { data, error } = await supabase.rpc('get_department_performance', {
      p_date_from: filters.date_from || null,
      p_date_to: filters.date_to || null,
      p_department_id: null
    });

    if (error) throw error;

    return data;
  }

  static async exportAnalytics(options: {
    report_type: string;
    format: string;
    date_from?: string;
    date_to?: string;
    user_id: string;
  }) {
    // Use existing export service
    const exportData = {
      export_name: `hr_analytics_${options.report_type}_${new Date().toISOString()}`,
      export_type: 'hr_analytics',
      format: options.format,
      filters: {
        report_type: options.report_type,
        date_from: options.date_from,
        date_to: options.date_to
      },
      columns: this.getExportColumns(options.report_type)
    };

    return await ExportService.createExport(exportData, options.user_id);
  }

  static async refreshAnalytics(refreshType: string, userId: string) {
    const cachePatterns = {
      'attendance': 'attendance_analytics_*',
      'leave': 'leave_analytics_*',
      'department': 'department_performance_*',
      'workforce': 'workforce_insights_*',
      'all': '*'
    };

    const pattern = cachePatterns[refreshType as keyof typeof cachePatterns] || 'all';
    await CacheService.clearPattern(pattern);

    return {
      message: `Analytics cache cleared for ${refreshType}`,
      timestamp: new Date().toISOString()
    };
  }

  private static getExportColumns(reportType: string): string[] {
    const columnMap = {
      'attendance': ['staff_name', 'department_name', 'total_days', 'present_days', 'attendance_rate', 'overtime_hours'],
      'leave': ['leave_type', 'department_name', 'total_requests', 'approved_requests', 'average_processing_days'],
      'department': ['department_name', 'total_staff', 'average_attendance_rate', 'performance_score'],
      'workforce': ['total_employees', 'active_employees', 'average_attendance_rate', 'total_leave_requests']
    };

    return columnMap[reportType as keyof typeof columnMap] || [];
  }
}
```

---

## Real-time Updates

### WebSocket Service: `backend/src/services/websocket.service.ts`

```typescript
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export class WebSocketService {
  private static io: SocketIOServer;

  static initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join_hr_analytics', (userId) => {
        socket.join(`hr_analytics_${userId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  static emitAnalyticsUpdate(userId: string, data: any) {
    this.io.to(`hr_analytics_${userId}`).emit('analytics_updated', data);
  }

  static emitRefreshComplete(userId: string, refreshType: string) {
    this.io.to(`hr_analytics_${userId}`).emit('refresh_complete', {
      type: refreshType,
      timestamp: new Date().toISOString()
    });
  }
}
```

---

## Frontend Integration

### API Service: `frontend/src/services/hrAnalyticsService.ts`

```typescript
import { apiClient } from './apiClient';

export interface AnalyticsFilters {
  date_from?: string;
  date_to?: string;
  department_id?: string;
  staff_id?: string;
  leave_type?: string;
  status?: string;
  position?: string;
}

export class HRAnalyticsService {
  static async getAttendanceAnalytics(filters: AnalyticsFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value);
      }
    });

    const response = await apiClient.get(`/api/v1/hr/analytics/attendance?${params.toString()}`);
    return response.data;
  }

  static async getLeaveAnalytics(filters: AnalyticsFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value);
      }
    });

    const response = await apiClient.get(`/api/v1/hr/analytics/leave?${params.toString()}`);
    return response.data;
  }

  static async getDepartmentPerformance(filters: AnalyticsFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value);
      }
    });

    const response = await apiClient.get(`/api/v1/hr/analytics/department-performance?${params.toString()}`);
    return response.data;
  }

  static async getWorkforceInsights(filters: AnalyticsFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value);
      }
    });

    const response = await apiClient.get(`/api/v1/hr/analytics/workforce-insights?${params.toString()}`);
    return response.data;
  }

  static async exportAnalytics(reportType: string, format: string = 'csv', filters: AnalyticsFilters = {}) {
    const params = new URLSearchParams();
    params.append('report_type', reportType);
    params.append('format', format);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value);
      }
    });

    const response = await apiClient.get(`/api/v1/hr/analytics/export?${params.toString()}`);
    return response.data;
  }

  static async refreshAnalytics(refreshType: string = 'all') {
    const response = await apiClient.post('/api/v1/hr/analytics/refresh', {
      refresh_type: refreshType
    });
    return response.data;
  }

  static async getDepartments(activeOnly: boolean = true, includeStats: boolean = false) {
    const params = new URLSearchParams();
    params.append('active_only', activeOnly.toString());
    params.append('include_stats', includeStats.toString());

    const response = await apiClient.get(`/api/v1/hr/departments?${params.toString()}`);
    return response.data;
  }

  static async getStaffAnalytics(filters: AnalyticsFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value);
      }
    });

    const response = await apiClient.get(`/api/v1/hr/staff/analytics?${params.toString()}`);
    return response.data;
  }
}
```

### React Hook: `frontend/src/hooks/useHRAnalytics.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { HRAnalyticsService } from '../services/hrAnalyticsService';
import { useWebSocket } from './useWebSocket';

export const useHRAnalytics = (filters: any = {}) => {
  const [data, setData] = useState({
    attendance: null,
    leave: null,
    department: null,
    workforce: null,
    loading: true,
    error: null
  });

  const { socket } = useWebSocket();

  const fetchData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const [attendance, leave, department, workforce] = await Promise.all([
        HRAnalyticsService.getAttendanceAnalytics(filters),
        HRAnalyticsService.getLeaveAnalytics(filters),
        HRAnalyticsService.getDepartmentPerformance(filters),
        HRAnalyticsService.getWorkforceInsights(filters)
      ]);

      setData({
        attendance: attendance.data,
        leave: leave.data,
        department: department.data,
        workforce: workforce.data,
        loading: false,
        error: null
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, [filters]);

  const refreshData = useCallback(async (refreshType: string = 'all') => {
    try {
      await HRAnalyticsService.refreshAnalytics(refreshType);
      await fetchData();
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('analytics_updated', (updateData) => {
        setData(prev => ({
          ...prev,
          ...updateData
        }));
      });

      socket.on('refresh_complete', (refreshData) => {
        console.log('Analytics refresh complete:', refreshData);
        fetchData();
      });

      return () => {
        socket.off('analytics_updated');
        socket.off('refresh_complete');
      };
    }
  }, [socket, fetchData]);

  return {
    ...data,
    refresh: refreshData,
    refetch: fetchData
  };
};
```

---

## Implementation Plan

### Step 1: Database Setup
**Files to create:**
- `backend/supabase/migrations/001_create_hr_analytics_tables.sql`
- `backend/supabase/migrations/002_create_hr_analytics_functions.sql`

**Tasks:**
1. Create analytics cache and export tables
2. Add performance indexes
3. Create analytics aggregation functions
4. Test all database functions
5. Set up caching strategy

**Acceptance Criteria:**
- All tables created successfully
- Indexes improve query performance
- Analytics functions return correct data
- Caching system works properly
- Functions handle edge cases

### Step 2: Backend Services
**Files to create:**
- `backend/src/services/hrAnalytics.service.ts`
- `backend/src/services/cache.service.ts`
- `backend/src/controllers/hrAnalytics.controller.ts`
- `backend/src/routes/hrAnalytics.routes.ts`
- `backend/src/validators/analytics.validator.ts`

**Tasks:**
1. Implement HRAnalyticsService with all analytics methods
2. Add caching layer for performance
3. Create validation for date ranges and filters
4. Add export integration
5. Implement real-time updates

**Acceptance Criteria:**
- All service methods work correctly
- Caching improves performance
- Validation prevents invalid requests
- Export functionality works
- Real-time updates are reliable

### Step 3: Frontend Integration
**Files to create:**
- `frontend/src/services/hrAnalyticsService.ts`
- `frontend/src/hooks/useHRAnalytics.ts`
- `frontend/src/types/hrAnalytics.ts`

**Tasks:**
1. Create API service layer
2. Implement React hooks for state management
3. Add real-time updates with WebSocket
4. Test all analytics endpoints
5. Implement data visualization

**Acceptance Criteria:**
- All API calls work correctly
- Real-time updates work properly
- State management is efficient
- Data visualization is accurate
- UI updates reflect backend changes

### Step 4: Testing & Validation
**Files to create:**
- `backend/src/tests/hrAnalytics.service.test.ts`
- `backend/src/tests/hrAnalytics.controller.test.ts`
- `frontend/src/tests/hrAnalyticsService.test.ts`

**Tasks:**
1. Test all service methods
2. Test API endpoints
3. Test caching functionality
4. Test real-time updates
5. Test export functionality

**Acceptance Criteria:**
- All tests pass
- Caching works correctly
- Real-time updates are reliable
- Export functionality works
- Performance is acceptable

This implementation provides a comprehensive HR analytics system with real-time updates, caching, and export capabilities suitable for enterprise workforce management needs.
