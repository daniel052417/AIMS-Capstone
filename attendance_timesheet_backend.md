# Attendance Timesheet Backend Integration Guide

## Overview
This guide provides a complete backend implementation for the AttendanceTimesheet module, focusing on daily reporting, timesheet management, and comprehensive statistics. This differs from the AttendanceDashboard by emphasizing daily summaries and historical data rather than real-time monitoring.

## Table of Contents
1. [Database Schema & Migrations](#database-schema--migrations)
2. [API Endpoints & Routes](#api-endpoints--routes)
3. [Controllers & Services](#controllers--services)
4. [Statistics & Reporting](#statistics--reporting)
5. [Export & Data Processing](#export--data-processing)
6. [Frontend Integration](#frontend-integration)
7. [Implementation Steps](#implementation-steps)

---

## Database Schema & Migrations

### Enhanced Timesheet View

```sql
-- Create comprehensive timesheet view with all related data
CREATE OR REPLACE VIEW timesheet_enhanced AS
SELECT 
    ar.id,
    ar.staff_id,
    ar.attendance_date,
    ar.time_in,
    ar.time_out,
    ar.break_start,
    ar.break_end,
    ar.total_hours,
    ar.overtime_hours,
    ar.status,
    ar.notes,
    ar.location,
    ar.created_at,
    ar.updated_at,
    ar.created_by_user_id,
    
    -- Staff information
    s.first_name as staff_first_name,
    s.last_name as staff_last_name,
    s.employee_id,
    s.position,
    s.department,
    CONCAT(s.first_name, ' ', s.last_name) as employee_name,
    
    -- Branch information
    b.name as branch_name,
    b.city as branch_city,
    
    -- Department information
    d.name as department_name,
    d.description as department_description,
    
    -- Formatted time strings for frontend
    CASE 
        WHEN ar.time_in IS NOT NULL THEN TO_CHAR(ar.time_in, 'HH12:MI AM')
        ELSE NULL 
    END as check_in_formatted,
    
    CASE 
        WHEN ar.time_out IS NOT NULL THEN TO_CHAR(ar.time_out, 'HH12:MI AM')
        ELSE NULL 
    END as check_out_formatted,
    
    -- Formatted hours for frontend
    CASE 
        WHEN ar.total_hours IS NOT NULL THEN 
            CONCAT(
                FLOOR(ar.total_hours), 'h ',
                ROUND((ar.total_hours - FLOOR(ar.total_hours)) * 60), 'm'
            )
        ELSE NULL 
    END as total_hours_formatted,
    
    CASE 
        WHEN ar.overtime_hours IS NOT NULL AND ar.overtime_hours > 0 THEN 
            CONCAT(
                FLOOR(ar.overtime_hours), 'h ',
                ROUND((ar.overtime_hours - FLOOR(ar.overtime_hours)) * 60), 'm'
            )
        ELSE '0h 0m'
    END as overtime_formatted

FROM attendance_records ar
LEFT JOIN staff s ON ar.staff_id = s.id
LEFT JOIN branches b ON s.branch_id = b.id
LEFT JOIN departments d ON s.department = d.name;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_timesheet_enhanced_date ON attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_timesheet_enhanced_staff ON attendance_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_enhanced_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_timesheet_enhanced_department ON staff(department);
CREATE INDEX IF NOT EXISTS idx_timesheet_enhanced_date_range ON attendance_records(attendance_date, staff_id);
```

### Daily Timesheet Statistics Function

```sql
-- Function to get daily timesheet statistics
CREATE OR REPLACE FUNCTION get_daily_timesheet_stats(
    p_date DATE DEFAULT CURRENT_DATE,
    p_department VARCHAR(255) DEFAULT NULL,
    p_branch_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_total_employees INTEGER;
    v_present_count INTEGER;
    v_late_count INTEGER;
    v_absent_count INTEGER;
    v_half_day_count INTEGER;
    v_on_leave_count INTEGER;
    v_attendance_rate DECIMAL(5,2);
    v_average_hours DECIMAL(5,2);
    v_total_overtime DECIMAL(5,2);
    v_total_regular_hours DECIMAL(5,2);
    v_early_departures INTEGER;
    v_late_arrivals INTEGER;
BEGIN
    -- Get total active employees for the date
    SELECT COUNT(*) INTO v_total_employees
    FROM staff s
    WHERE s.is_active = true
    AND (p_department IS NULL OR s.department = p_department)
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id);
    
    -- Get present count
    SELECT COUNT(*) INTO v_present_count
    FROM attendance_records ar
    JOIN staff s ON ar.staff_id = s.id
    WHERE ar.attendance_date = p_date
    AND ar.status = 'present'
    AND (p_department IS NULL OR s.department = p_department)
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id);
    
    -- Get late count
    SELECT COUNT(*) INTO v_late_count
    FROM attendance_records ar
    JOIN staff s ON ar.staff_id = s.id
    WHERE ar.attendance_date = p_date
    AND ar.status = 'late'
    AND (p_department IS NULL OR s.department = p_department)
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id);
    
    -- Get absent count
    SELECT COUNT(*) INTO v_absent_count
    FROM attendance_records ar
    JOIN staff s ON ar.staff_id = s.id
    WHERE ar.attendance_date = p_date
    AND ar.status = 'absent'
    AND (p_department IS NULL OR s.department = p_department)
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id);
    
    -- Get half day count
    SELECT COUNT(*) INTO v_half_day_count
    FROM attendance_records ar
    JOIN staff s ON ar.staff_id = s.id
    WHERE ar.attendance_date = p_date
    AND ar.status = 'half_day'
    AND (p_department IS NULL OR s.department = p_department)
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id);
    
    -- Get on leave count
    SELECT COUNT(*) INTO v_on_leave_count
    FROM attendance_records ar
    JOIN staff s ON ar.staff_id = s.id
    WHERE ar.attendance_date = p_date
    AND ar.status = 'on_leave'
    AND (p_department IS NULL OR s.department = p_department)
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id);
    
    -- Calculate attendance rate
    IF v_total_employees > 0 THEN
        v_attendance_rate := (v_present_count::DECIMAL / v_total_employees::DECIMAL) * 100;
    ELSE
        v_attendance_rate := 0;
    END IF;
    
    -- Calculate average hours worked
    SELECT COALESCE(AVG(total_hours), 0) INTO v_average_hours
    FROM attendance_records ar
    JOIN staff s ON ar.staff_id = s.id
    WHERE ar.attendance_date = p_date
    AND ar.status IN ('present', 'late')
    AND (p_department IS NULL OR s.department = p_department)
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id);
    
    -- Calculate total overtime
    SELECT COALESCE(SUM(overtime_hours), 0) INTO v_total_overtime
    FROM attendance_records ar
    JOIN staff s ON ar.staff_id = s.id
    WHERE ar.attendance_date = p_date
    AND ar.status IN ('present', 'late')
    AND (p_department IS NULL OR s.department = p_department)
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id);
    
    -- Calculate total regular hours
    SELECT COALESCE(SUM(total_hours - COALESCE(overtime_hours, 0)), 0) INTO v_total_regular_hours
    FROM attendance_records ar
    JOIN staff s ON ar.staff_id = s.id
    WHERE ar.attendance_date = p_date
    AND ar.status IN ('present', 'late')
    AND (p_department IS NULL OR s.department = p_department)
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id);
    
    -- Count late arrivals (after 9:00 AM)
    SELECT COUNT(*) INTO v_late_arrivals
    FROM attendance_records ar
    JOIN staff s ON ar.staff_id = s.id
    WHERE ar.attendance_date = p_date
    AND ar.time_in > '09:00:00'
    AND ar.status IN ('present', 'late')
    AND (p_department IS NULL OR s.department = p_department)
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id);
    
    -- Count early departures (before 5:00 PM)
    SELECT COUNT(*) INTO v_early_departures
    FROM attendance_records ar
    JOIN staff s ON ar.staff_id = s.id
    WHERE ar.attendance_date = p_date
    AND ar.time_out < '17:00:00'
    AND ar.status IN ('present', 'late')
    AND (p_department IS NULL OR s.department = p_department)
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id);
    
    RETURN jsonb_build_object(
        'date', p_date,
        'total_employees', v_total_employees,
        'present', v_present_count,
        'late', v_late_count,
        'absent', v_absent_count,
        'half_day', v_half_day_count,
        'on_leave', v_on_leave_count,
        'attendance_rate', v_attendance_rate,
        'average_hours', v_average_hours,
        'total_overtime', v_total_overtime,
        'total_regular_hours', v_total_regular_hours,
        'late_arrivals', v_late_arrivals,
        'early_departures', v_early_departures
    );
END;
$$ LANGUAGE plpgsql;
```

### Multi-Day Timesheet Function

```sql
-- Function to get timesheet data for date range
CREATE OR REPLACE FUNCTION get_timesheet_date_range(
    p_date_from DATE,
    p_date_to DATE,
    p_department VARCHAR(255) DEFAULT NULL,
    p_branch_id UUID DEFAULT NULL,
    p_staff_id UUID DEFAULT NULL
)
RETURNS TABLE (
    attendance_date DATE,
    staff_id UUID,
    employee_name TEXT,
    employee_id VARCHAR(50),
    position VARCHAR(100),
    department VARCHAR(100),
    time_in TIME,
    time_out TIME,
    total_hours DECIMAL(5,2),
    overtime_hours DECIMAL(5,2),
    status VARCHAR(50),
    check_in_formatted TEXT,
    check_out_formatted TEXT,
    total_hours_formatted TEXT,
    overtime_formatted TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        te.attendance_date,
        te.staff_id,
        te.employee_name,
        te.employee_id,
        te.position,
        te.department,
        te.time_in,
        te.time_out,
        te.total_hours,
        te.overtime_hours,
        te.status,
        te.check_in_formatted,
        te.check_out_formatted,
        te.total_hours_formatted,
        te.overtime_formatted
    FROM timesheet_enhanced te
    WHERE te.attendance_date BETWEEN p_date_from AND p_date_to
    AND (p_department IS NULL OR te.department = p_department)
    AND (p_branch_id IS NULL OR te.staff_id IN (
        SELECT id FROM staff WHERE branch_id = p_branch_id
    ))
    AND (p_staff_id IS NULL OR te.staff_id = p_staff_id)
    ORDER BY te.attendance_date DESC, te.employee_name;
END;
$$ LANGUAGE plpgsql;
```

### Timesheet Approval Table (Optional)

```sql
-- Create timesheet approval table for workflow
CREATE TABLE IF NOT EXISTS timesheet_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timesheet_id UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    approval_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_timesheet_approvals_staff ON timesheet_approvals(staff_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_approvals_date ON timesheet_approvals(approval_date);
CREATE INDEX IF NOT EXISTS idx_timesheet_approvals_status ON timesheet_approvals(status);
```

---

## API Endpoints & Routes

### Enhanced Route File: `backend/src/routes/hr.routes.ts`

```typescript
import { Router } from 'express';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as adminController from '../controllers/hr/admin.controller';
import * as staffController from '../controllers/hr/staff.controller';
import * as timesheetController from '../controllers/hr/timesheet.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Timesheet Management Routes
router.get('/admin/timesheet', 
  requireRole(['super_admin', 'hr_admin', 'hr']), 
  requirePermission('timesheet.read'),
  asyncHandler(timesheetController.getTimesheet)
);

router.get('/admin/timesheet/stats', 
  requireRole(['super_admin', 'hr_admin', 'hr']), 
  requirePermission('timesheet.read'),
  asyncHandler(timesheetController.getTimesheetStats)
);

router.get('/admin/timesheet/export', 
  requireRole(['super_admin', 'hr_admin', 'hr']), 
  requirePermission('timesheet.export'),
  asyncHandler(timesheetController.exportTimesheet)
);

router.get('/admin/timesheet/range', 
  requireRole(['super_admin', 'hr_admin', 'hr']), 
  requirePermission('timesheet.read'),
  asyncHandler(timesheetController.getTimesheetRange)
);

router.put('/admin/timesheet/:id', 
  requireRole(['super_admin', 'hr_admin']), 
  requirePermission('timesheet.update'),
  asyncHandler(timesheetController.updateTimesheetRecord)
);

// Timesheet Approval Routes (Optional)
router.post('/admin/timesheet/:id/approve', 
  requireRole(['super_admin', 'hr_admin']), 
  requirePermission('timesheet.approve'),
  asyncHandler(timesheetController.approveTimesheet)
);

router.post('/admin/timesheet/:id/reject', 
  requireRole(['super_admin', 'hr_admin']), 
  requirePermission('timesheet.approve'),
  asyncHandler(timesheetController.rejectTimesheet)
);

router.get('/admin/timesheet/approvals', 
  requireRole(['super_admin', 'hr_admin']), 
  requirePermission('timesheet.approve'),
  asyncHandler(timesheetController.getTimesheetApprovals)
);

// Existing routes...
router.get('/admin/dashboard', 
  requireRole(['super_admin', 'hr_admin']), 
  asyncHandler(adminController.getDashboard)
);

// ... (other existing routes)

export default router;
```

---

## Controllers & Services

### Timesheet Controller: `backend/src/controllers/hr/timesheet.controller.ts`

```typescript
import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { TimesheetService } from '../../services/hr/timesheet.service';
import { asyncHandler } from '../../middleware/errorHandler';

export class TimesheetController {
  // Get timesheet data for a specific date
  static getTimesheet = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      date = new Date().toISOString().split('T')[0],
      search,
      status,
      department,
      branch_id,
      staff_id,
      page = 1,
      limit = 25,
      sort_by = 'employee_name',
      sort_order = 'asc'
    } = req.query;

    const filters = {
      date: date as string,
      search: search as string,
      status: status as string,
      department: department as string,
      branch_id: branch_id as string,
      staff_id: staff_id as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort_by: sort_by as string,
      sort_order: sort_order as 'asc' | 'desc'
    };

    const result = await TimesheetService.getTimesheet(filters);
    
    res.json({
      success: true,
      data: result
    });
  });

  // Get timesheet statistics for a specific date
  static getTimesheetStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { date, department, branch_id } = req.query;

    const result = await TimesheetService.getTimesheetStats({
      date: date as string || new Date().toISOString().split('T')[0],
      department: department as string,
      branch_id: branch_id as string
    });
    
    res.json({
      success: true,
      data: result
    });
  });

  // Export timesheet data
  static exportTimesheet = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      date,
      format = 'csv',
      department,
      branch_id,
      status
    } = req.query;

    const filters = {
      date: date as string || new Date().toISOString().split('T')[0],
      department: department as string,
      branch_id: branch_id as string,
      status: status as string
    };

    const result = await TimesheetService.exportTimesheet(filters, format as string);
    
    res.setHeader('Content-Type', format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="timesheet_${filters.date}.${format === 'excel' ? 'xlsx' : 'csv'}"`);
    
    res.send(result);
  });

  // Get timesheet data for date range
  static getTimesheetRange = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      date_from,
      date_to,
      department,
      branch_id,
      staff_id
    } = req.query;

    if (!date_from || !date_to) {
      return res.status(400).json({
        success: false,
        message: 'date_from and date_to are required'
      });
    }

    const result = await TimesheetService.getTimesheetRange({
      date_from: date_from as string,
      date_to: date_to as string,
      department: department as string,
      branch_id: branch_id as string,
      staff_id: staff_id as string
    });
    
    res.json({
      success: true,
      data: result
    });
  });

  // Update timesheet record (manual editing)
  static updateTimesheetRecord = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const recordData = req.body;
    const updatedBy = req.user!.userId;

    const result = await TimesheetService.updateTimesheetRecord(id, recordData, updatedBy);
    
    res.json({
      success: true,
      message: 'Timesheet record updated successfully',
      data: result
    });
  });

  // Approve timesheet (Optional)
  static approveTimesheet = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { notes } = req.body;
    const approvedBy = req.user!.userId;

    const result = await TimesheetService.approveTimesheet(id, notes, approvedBy);
    
    res.json({
      success: true,
      message: 'Timesheet approved successfully',
      data: result
    });
  });

  // Reject timesheet (Optional)
  static rejectTimesheet = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason, notes } = req.body;
    const rejectedBy = req.user!.userId;

    const result = await TimesheetService.rejectTimesheet(id, reason, notes, rejectedBy);
    
    res.json({
      success: true,
      message: 'Timesheet rejected successfully',
      data: result
    });
  });

  // Get timesheet approvals
  static getTimesheetApprovals = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      status,
      date_from,
      date_to,
      page = 1,
      limit = 25
    } = req.query;

    const result = await TimesheetService.getTimesheetApprovals({
      status: status as string,
      date_from: date_from as string,
      date_to: date_to as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
    
    res.json({
      success: true,
      data: result
    });
  });
}
```

### Timesheet Service: `backend/src/services/hr/timesheet.service.ts`

```typescript
import { supabaseAdmin } from '../../config/supabaseClient';
import { ExportService } from '../export.service';

export interface TimesheetFilters {
  date: string;
  search?: string;
  status?: string;
  department?: string;
  branch_id?: string;
  staff_id?: string;
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface TimesheetRangeFilters {
  date_from: string;
  date_to: string;
  department?: string;
  branch_id?: string;
  staff_id?: string;
}

export class TimesheetService {
  // Get timesheet data for a specific date
  static async getTimesheet(filters: TimesheetFilters) {
    try {
      let query = supabaseAdmin
        .from('timesheet_enhanced')
        .select('*')
        .eq('attendance_date', filters.date);

      // Apply filters
      if (filters.search) {
        query = query.or(`
          employee_name.ilike.%${filters.search}%,
          employee_id.ilike.%${filters.search}%,
          position.ilike.%${filters.search}%
        `);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.department) {
        query = query.eq('department', filters.department);
      }
      if (filters.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }
      if (filters.staff_id) {
        query = query.eq('staff_id', filters.staff_id);
      }

      // Apply sorting
      const sortColumn = filters.sort_by || 'employee_name';
      const sortOrder = filters.sort_order || 'asc';
      query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);

      const { data: timesheet, error, count } = await query;

      if (error) throw error;

      // Get statistics for the same date
      const stats = await this.getTimesheetStats({
        date: filters.date,
        department: filters.department,
        branch_id: filters.branch_id
      });

      return {
        timesheet: timesheet || [],
        summary: stats,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / filters.limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch timesheet: ${error}`);
    }
  }

  // Get timesheet statistics
  static async getTimesheetStats(filters: any) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_daily_timesheet_stats', {
          p_date: filters.date,
          p_department: filters.department,
          p_branch_id: filters.branch_id
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch timesheet statistics: ${error}`);
    }
  }

  // Get timesheet data for date range
  static async getTimesheetRange(filters: TimesheetRangeFilters) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_timesheet_date_range', {
          p_date_from: filters.date_from,
          p_date_to: filters.date_to,
          p_department: filters.department,
          p_branch_id: filters.branch_id,
          p_staff_id: filters.staff_id
        });

      if (error) throw error;

      // Group by date for better frontend consumption
      const groupedData = data.reduce((acc: any, record: any) => {
        const date = record.attendance_date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(record);
        return acc;
      }, {});

      return {
        timesheet: groupedData,
        date_range: {
          from: filters.date_from,
          to: filters.date_to
        },
        total_records: data.length
      };
    } catch (error) {
      throw new Error(`Failed to fetch timesheet range: ${error}`);
    }
  }

  // Update timesheet record
  static async updateTimesheetRecord(id: string, recordData: any, updatedBy: string) {
    try {
      // Validate time data if provided
      if (recordData.time_in || recordData.time_out) {
        const { time_in, time_out, break_start, break_end } = recordData;
        
        // Calculate total hours if both time_in and time_out are provided
        if (time_in && time_out) {
          const timeIn = new Date(`2000-01-01T${time_in}`);
          const timeOut = new Date(`2000-01-01T${time_out}`);
          let totalHours = (timeOut.getTime() - timeIn.getTime()) / (1000 * 60 * 60);
          
          // Subtract break time if provided
          if (break_start && break_end) {
            const breakStart = new Date(`2000-01-01T${break_start}`);
            const breakEnd = new Date(`2000-01-01T${break_end}`);
            const breakHours = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
            totalHours -= breakHours;
          }
          
          // Calculate overtime (assuming 8 hours is standard)
          const regularHours = 8;
          const overtimeHours = Math.max(0, totalHours - regularHours);
          
          recordData.total_hours = totalHours;
          recordData.overtime_hours = overtimeHours;
        }
      }

      const { data: record, error } = await supabaseAdmin
        .from('attendance_records')
        .update({
          ...recordData,
          updated_by_user_id: updatedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log the update
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: updatedBy,
          action: 'timesheet_record_updated',
          entity_type: 'attendance_record',
          entity_id: id,
          new_values: recordData,
          created_at: new Date().toISOString()
        });

      return record;
    } catch (error) {
      throw new Error(`Failed to update timesheet record: ${error}`);
    }
  }

  // Export timesheet data
  static async exportTimesheet(filters: any, format: string) {
    try {
      // Get timesheet data for the specified date
      const { data: timesheet, error } = await supabaseAdmin
        .from('timesheet_enhanced')
        .select('*')
        .eq('attendance_date', filters.date);

      if (error) throw error;

      // Apply additional filters
      let filteredData = timesheet || [];
      
      if (filters.department) {
        filteredData = filteredData.filter(record => record.department === filters.department);
      }
      if (filters.branch_id) {
        filteredData = filteredData.filter(record => record.branch_id === filters.branch_id);
      }
      if (filters.status) {
        filteredData = filteredData.filter(record => record.status === filters.status);
      }

      // Transform data for export
      const exportData = filteredData.map(record => ({
        'Employee ID': record.employee_id,
        'Employee Name': record.employee_name,
        'Position': record.position,
        'Department': record.department,
        'Date': record.attendance_date,
        'Check In': record.check_in_formatted || 'N/A',
        'Check Out': record.check_out_formatted || 'N/A',
        'Total Hours': record.total_hours_formatted || '0h 0m',
        'Overtime': record.overtime_formatted || '0h 0m',
        'Status': record.status,
        'Location': record.location || 'N/A',
        'Notes': record.notes || ''
      }));

      // Generate export file
      if (format === 'excel') {
        return await ExportService.generateExcel(exportData, 'timesheet');
      } else {
        return await ExportService.generateCSV(exportData, 'timesheet');
      }
    } catch (error) {
      throw new Error(`Failed to export timesheet: ${error}`);
    }
  }

  // Approve timesheet (Optional)
  static async approveTimesheet(id: string, notes: string, approvedBy: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('timesheet_approvals')
        .insert({
          timesheet_id: id,
          staff_id: (await supabaseAdmin
            .from('attendance_records')
            .select('staff_id')
            .eq('id', id)
            .single()
          ).data.staff_id,
          approval_date: new Date().toISOString().split('T')[0],
          status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          notes,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Log the approval
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: approvedBy,
          action: 'timesheet_approved',
          entity_type: 'timesheet_approval',
          entity_id: data.id,
          new_values: { timesheet_id: id, status: 'approved' },
          created_at: new Date().toISOString()
        });

      return data;
    } catch (error) {
      throw new Error(`Failed to approve timesheet: ${error}`);
    }
  }

  // Reject timesheet (Optional)
  static async rejectTimesheet(id: string, reason: string, notes: string, rejectedBy: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('timesheet_approvals')
        .insert({
          timesheet_id: id,
          staff_id: (await supabaseAdmin
            .from('attendance_records')
            .select('staff_id')
            .eq('id', id)
            .single()
          ).data.staff_id,
          approval_date: new Date().toISOString().split('T')[0],
          status: 'rejected',
          approved_by: rejectedBy,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
          notes,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Log the rejection
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: rejectedBy,
          action: 'timesheet_rejected',
          entity_type: 'timesheet_approval',
          entity_id: data.id,
          new_values: { timesheet_id: id, status: 'rejected', reason },
          created_at: new Date().toISOString()
        });

      return data;
    } catch (error) {
      throw new Error(`Failed to reject timesheet: ${error}`);
    }
  }

  // Get timesheet approvals
  static async getTimesheetApprovals(filters: any) {
    try {
      let query = supabaseAdmin
        .from('timesheet_approvals')
        .select(`
          *,
          timesheet:timesheet_id (
            attendance_date,
            time_in,
            time_out,
            total_hours,
            overtime_hours,
            status
          ),
          staff:staff_id (
            first_name,
            last_name,
            employee_id,
            department
          ),
          approver:approved_by (
            first_name,
            last_name
          )
        `);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.date_from) {
        query = query.gte('approval_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('approval_date', filters.date_to);
      }

      // Apply pagination
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data: approvals, error, count } = await query;

      if (error) throw error;

      return {
        approvals: approvals || [],
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / filters.limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch timesheet approvals: ${error}`);
    }
  }
}
```

---

## Frontend Integration

### API Service: `frontend/src/services/timesheetService.ts`

```typescript
import { apiClient } from './apiClient';

export interface TimesheetFilters {
  date?: string;
  search?: string;
  status?: string;
  department?: string;
  branch_id?: string;
  staff_id?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface TimesheetRangeFilters {
  date_from: string;
  date_to: string;
  department?: string;
  branch_id?: string;
  staff_id?: string;
}

export class TimesheetService {
  // Get timesheet data for a specific date
  static async getTimesheet(filters: TimesheetFilters = {}) {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof TimesheetFilters] !== undefined) {
        params.append(key, filters[key as keyof TimesheetFilters] as string);
      }
    });

    const response = await apiClient.get(`/v1/hr/admin/timesheet?${params.toString()}`);
    return response.data;
  }

  // Get timesheet statistics
  static async getTimesheetStats(date?: string, department?: string, branchId?: string) {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (department) params.append('department', department);
    if (branchId) params.append('branch_id', branchId);

    const response = await apiClient.get(`/v1/hr/admin/timesheet/stats?${params.toString()}`);
    return response.data;
  }

  // Get timesheet data for date range
  static async getTimesheetRange(filters: TimesheetRangeFilters) {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof TimesheetRangeFilters] !== undefined) {
        params.append(key, filters[key as keyof TimesheetRangeFilters] as string);
      }
    });

    const response = await apiClient.get(`/v1/hr/admin/timesheet/range?${params.toString()}`);
    return response.data;
  }

  // Update timesheet record
  static async updateTimesheetRecord(id: string, data: any) {
    const response = await apiClient.put(`/v1/hr/admin/timesheet/${id}`, data);
    return response.data;
  }

  // Export timesheet
  static async exportTimesheet(filters: any, format: 'csv' | 'excel' = 'csv') {
    const params = new URLSearchParams();
    params.append('format', format);
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });

    const response = await apiClient.get(`/v1/hr/admin/timesheet/export?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  // Approve timesheet (Optional)
  static async approveTimesheet(id: string, notes?: string) {
    const response = await apiClient.post(`/v1/hr/admin/timesheet/${id}/approve`, {
      notes
    });
    return response.data;
  }

  // Reject timesheet (Optional)
  static async rejectTimesheet(id: string, reason: string, notes?: string) {
    const response = await apiClient.post(`/v1/hr/admin/timesheet/${id}/reject`, {
      reason,
      notes
    });
    return response.data;
  }

  // Get timesheet approvals
  static async getTimesheetApprovals(filters: any = {}) {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });

    const response = await apiClient.get(`/v1/hr/admin/timesheet/approvals?${params.toString()}`);
    return response.data;
  }
}
```

### React Hook: `frontend/src/hooks/useTimesheet.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { TimesheetService, TimesheetFilters } from '../services/timesheetService';

export const useTimesheet = (filters: TimesheetFilters = {}) => {
  const [timesheet, setTimesheet] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });

  const fetchTimesheet = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await TimesheetService.getTimesheet(filters);
      setTimesheet(response.data.timesheet);
      setSummary(response.data.summary);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch timesheet');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTimesheet();
  }, [fetchTimesheet]);

  const updateTimesheetRecord = async (id: string, data: any) => {
    try {
      setLoading(true);
      const response = await TimesheetService.updateTimesheetRecord(id, data);
      await fetchTimesheet(); // Refresh the data
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update timesheet record');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportTimesheet = async (format: 'csv' | 'excel' = 'csv') => {
    try {
      const blob = await TimesheetService.exportTimesheet(filters, format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `timesheet_${filters.date || new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export timesheet');
      throw err;
    }
  };

  const approveTimesheet = async (id: string, notes?: string) => {
    try {
      setLoading(true);
      const response = await TimesheetService.approveTimesheet(id, notes);
      await fetchTimesheet(); // Refresh the data
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve timesheet');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectTimesheet = async (id: string, reason: string, notes?: string) => {
    try {
      setLoading(true);
      const response = await TimesheetService.rejectTimesheet(id, reason, notes);
      await fetchTimesheet(); // Refresh the data
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject timesheet');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    timesheet,
    summary,
    loading,
    error,
    pagination,
    fetchTimesheet,
    updateTimesheetRecord,
    exportTimesheet,
    approveTimesheet,
    rejectTimesheet
  };
};
```

---

## Implementation Steps

### Step 1: Database Setup
1. Run the SQL migrations to create enhanced views and functions
2. Create the timesheet statistics functions
3. Create the multi-day timesheet function
4. Create the timesheet approval table (optional)
5. Test the database functions

### Step 2: Backend Implementation
1. Create the `TimesheetService` class
2. Create the `TimesheetController` class
3. Update the `hr.routes.ts` file
4. Add export functionality
5. Test all endpoints

### Step 3: Frontend Integration
1. Create the `timesheetService.ts` API service
2. Create the `useTimesheet.ts` React hook
3. Update your `AttendanceTimesheet.tsx` component
4. Add export functionality
5. Add timesheet editing functionality
6. Add approval workflow (optional)

### Step 4: Testing
1. Test timesheet data retrieval for specific dates
2. Test statistics calculation
3. Test date range functionality
4. Test filtering and pagination
5. Test export functionality
6. Test timesheet editing
7. Test approval workflow (optional)

This implementation provides a complete timesheet management system with daily reporting, statistics, export capabilities, and optional approval workflow, specifically designed for the AttendanceTimesheet module's requirements.
