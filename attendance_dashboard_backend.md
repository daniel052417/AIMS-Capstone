# Attendance Dashboard Backend Integration Guide

## Overview
This guide provides a complete backend implementation for the AttendanceDashboard module, including enhanced database queries, API endpoints, and frontend integration steps for comprehensive attendance management.

## Table of Contents
1. [Database Schema & Migrations](#database-schema--migrations)
2. [API Endpoints & Routes](#api-endpoints--routes)
3. [Controllers & Services](#controllers--services)
4. [Export & Reporting](#export--reporting)
5. [Real-time Updates](#real-time-updates)
6. [Frontend Integration](#frontend-integration)
7. [Implementation Steps](#implementation-steps)

---

## Database Schema & Migrations

### Enhanced Attendance Records View

```sql
-- Create enhanced view for attendance records with all related data
CREATE OR REPLACE VIEW attendance_records_enhanced AS
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
    CONCAT(s.first_name, ' ', s.last_name) as staff_name,
    
    -- Branch information
    b.name as branch_name,
    b.city as branch_city,
    
    -- Department information
    d.name as department_name,
    d.description as department_description

FROM attendance_records ar
LEFT JOIN staff s ON ar.staff_id = s.id
LEFT JOIN branches b ON s.branch_id = b.id
LEFT JOIN departments d ON s.department = d.name;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_records_enhanced_date ON attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_enhanced_staff ON attendance_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_enhanced_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_attendance_records_enhanced_department ON staff(department);
```

### Clock In/Out Functions

```sql
-- Function to clock in
CREATE OR REPLACE FUNCTION clock_in(
    p_staff_id UUID,
    p_location VARCHAR(255),
    p_notes TEXT DEFAULT NULL,
    p_created_by_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_attendance_id UUID;
    v_current_date DATE := CURRENT_DATE;
    v_current_time TIME := CURRENT_TIME;
    v_existing_record UUID;
BEGIN
    -- Check if already clocked in today
    SELECT id INTO v_existing_record
    FROM attendance_records
    WHERE staff_id = p_staff_id
    AND attendance_date = v_current_date
    AND time_in IS NOT NULL
    AND time_out IS NULL;
    
    IF v_existing_record IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Already clocked in today'
        );
    END IF;
    
    -- Create or update attendance record
    INSERT INTO attendance_records (
        staff_id,
        attendance_date,
        time_in,
        status,
        notes,
        location,
        created_by_user_id,
        created_at,
        updated_at
    ) VALUES (
        p_staff_id,
        v_current_date,
        v_current_time,
        'present',
        p_notes,
        p_location,
        p_created_by_user_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (staff_id, attendance_date)
    DO UPDATE SET
        time_in = v_current_time,
        status = 'present',
        notes = COALESCE(p_notes, attendance_records.notes),
        location = COALESCE(p_location, attendance_records.location),
        updated_at = NOW()
    RETURNING id INTO v_attendance_id;
    
    -- Log the action
    INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        new_values,
        created_at
    ) VALUES (
        p_created_by_user_id,
        'clock_in',
        'attendance_record',
        v_attendance_id,
        jsonb_build_object(
            'staff_id', p_staff_id,
            'time_in', v_current_time,
            'location', p_location
        ),
        NOW()
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Clocked in successfully',
        'attendance_id', v_attendance_id,
        'time_in', v_current_time
    );
END;
$$ LANGUAGE plpgsql;

-- Function to clock out
CREATE OR REPLACE FUNCTION clock_out(
    p_staff_id UUID,
    p_notes TEXT DEFAULT NULL,
    p_updated_by_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_attendance_id UUID;
    v_current_time TIME := CURRENT_TIME;
    v_time_in TIME;
    v_break_start TIME;
    v_break_end TIME;
    v_total_hours DECIMAL(5,2);
    v_overtime_hours DECIMAL(5,2);
    v_regular_hours DECIMAL(5,2) := 8.0; -- Standard work hours
BEGIN
    -- Get today's attendance record
    SELECT id, time_in, break_start, break_end
    INTO v_attendance_id, v_time_in, v_break_start, v_break_end
    FROM attendance_records
    WHERE staff_id = p_staff_id
    AND attendance_date = CURRENT_DATE
    AND time_in IS NOT NULL
    AND time_out IS NULL;
    
    IF v_attendance_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'No active clock-in record found'
        );
    END IF;
    
    -- Calculate total hours worked
    v_total_hours := EXTRACT(EPOCH FROM (v_current_time - v_time_in)) / 3600;
    
    -- Subtract break time if break was taken
    IF v_break_start IS NOT NULL AND v_break_end IS NOT NULL THEN
        v_total_hours := v_total_hours - EXTRACT(EPOCH FROM (v_break_end - v_break_start)) / 3600;
    END IF;
    
    -- Calculate overtime
    IF v_total_hours > v_regular_hours THEN
        v_overtime_hours := v_total_hours - v_regular_hours;
    ELSE
        v_overtime_hours := 0;
    END IF;
    
    -- Update attendance record
    UPDATE attendance_records
    SET
        time_out = v_current_time,
        total_hours = v_total_hours,
        overtime_hours = v_overtime_hours,
        notes = COALESCE(p_notes, notes),
        updated_at = NOW()
    WHERE id = v_attendance_id;
    
    -- Log the action
    INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        new_values,
        created_at
    ) VALUES (
        p_updated_by_user_id,
        'clock_out',
        'attendance_record',
        v_attendance_id,
        jsonb_build_object(
            'staff_id', p_staff_id,
            'time_out', v_current_time,
            'total_hours', v_total_hours,
            'overtime_hours', v_overtime_hours
        ),
        NOW()
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Clocked out successfully',
        'attendance_id', v_attendance_id,
        'time_out', v_current_time,
        'total_hours', v_total_hours,
        'overtime_hours', v_overtime_hours
    );
END;
$$ LANGUAGE plpgsql;

-- Function to start break
CREATE OR REPLACE FUNCTION break_start(
    p_staff_id UUID,
    p_notes TEXT DEFAULT NULL,
    p_updated_by_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_attendance_id UUID;
    v_current_time TIME := CURRENT_TIME;
BEGIN
    -- Get today's attendance record
    SELECT id INTO v_attendance_id
    FROM attendance_records
    WHERE staff_id = p_staff_id
    AND attendance_date = CURRENT_DATE
    AND time_in IS NOT NULL
    AND time_out IS NULL
    AND break_start IS NULL;
    
    IF v_attendance_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'No active attendance record found or break already started'
        );
    END IF;
    
    -- Update attendance record
    UPDATE attendance_records
    SET
        break_start = v_current_time,
        notes = COALESCE(p_notes, notes),
        updated_at = NOW()
    WHERE id = v_attendance_id;
    
    -- Log the action
    INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        new_values,
        created_at
    ) VALUES (
        p_updated_by_user_id,
        'break_start',
        'attendance_record',
        v_attendance_id,
        jsonb_build_object(
            'staff_id', p_staff_id,
            'break_start', v_current_time
        ),
        NOW()
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Break started successfully',
        'attendance_id', v_attendance_id,
        'break_start', v_current_time
    );
END;
$$ LANGUAGE plpgsql;

-- Function to end break
CREATE OR REPLACE FUNCTION break_end(
    p_staff_id UUID,
    p_notes TEXT DEFAULT NULL,
    p_updated_by_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_attendance_id UUID;
    v_current_time TIME := CURRENT_TIME;
BEGIN
    -- Get today's attendance record
    SELECT id INTO v_attendance_id
    FROM attendance_records
    WHERE staff_id = p_staff_id
    AND attendance_date = CURRENT_DATE
    AND time_in IS NOT NULL
    AND time_out IS NULL
    AND break_start IS NOT NULL
    AND break_end IS NULL;
    
    IF v_attendance_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'No active break found'
        );
    END IF;
    
    -- Update attendance record
    UPDATE attendance_records
    SET
        break_end = v_current_time,
        notes = COALESCE(p_notes, notes),
        updated_at = NOW()
    WHERE id = v_attendance_id;
    
    -- Log the action
    INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        new_values,
        created_at
    ) VALUES (
        p_updated_by_user_id,
        'break_end',
        'attendance_record',
        v_attendance_id,
        jsonb_build_object(
            'staff_id', p_staff_id,
            'break_end', v_current_time
        ),
        NOW()
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Break ended successfully',
        'attendance_id', v_attendance_id,
        'break_end', v_current_time
    );
END;
$$ LANGUAGE plpgsql;
```

### Attendance Statistics Function

```sql
-- Function to get attendance statistics
CREATE OR REPLACE FUNCTION get_attendance_stats(
    p_date DATE DEFAULT CURRENT_DATE,
    p_department VARCHAR(255) DEFAULT NULL,
    p_branch_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_total_staff INTEGER;
    v_present_count INTEGER;
    v_absent_count INTEGER;
    v_late_count INTEGER;
    v_half_day_count INTEGER;
    v_on_leave_count INTEGER;
    v_attendance_rate DECIMAL(5,2);
    v_avg_hours DECIMAL(5,2);
    v_total_overtime DECIMAL(5,2);
BEGIN
    -- Get total active staff
    SELECT COUNT(*) INTO v_total_staff
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
    
    -- Get absent count
    SELECT COUNT(*) INTO v_absent_count
    FROM attendance_records ar
    JOIN staff s ON ar.staff_id = s.id
    WHERE ar.attendance_date = p_date
    AND ar.status = 'absent'
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
    IF v_total_staff > 0 THEN
        v_attendance_rate := (v_present_count::DECIMAL / v_total_staff::DECIMAL) * 100;
    ELSE
        v_attendance_rate := 0;
    END IF;
    
    -- Calculate average hours
    SELECT COALESCE(AVG(total_hours), 0) INTO v_avg_hours
    FROM attendance_records ar
    JOIN staff s ON ar.staff_id = s.id
    WHERE ar.attendance_date = p_date
    AND ar.status = 'present'
    AND (p_department IS NULL OR s.department = p_department)
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id);
    
    -- Calculate total overtime
    SELECT COALESCE(SUM(overtime_hours), 0) INTO v_total_overtime
    FROM attendance_records ar
    JOIN staff s ON ar.staff_id = s.id
    WHERE ar.attendance_date = p_date
    AND ar.status = 'present'
    AND (p_department IS NULL OR s.department = p_department)
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id);
    
    RETURN jsonb_build_object(
        'date', p_date,
        'total_staff', v_total_staff,
        'present', v_present_count,
        'absent', v_absent_count,
        'late', v_late_count,
        'half_day', v_half_day_count,
        'on_leave', v_on_leave_count,
        'attendance_rate', v_attendance_rate,
        'avg_hours', v_avg_hours,
        'total_overtime', v_total_overtime
    );
END;
$$ LANGUAGE plpgsql;
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
import * as attendanceController from '../controllers/hr/attendance.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Enhanced Attendance Management Routes
router.get('/admin/attendance', 
  requireRole(['super_admin', 'hr_admin', 'hr']), 
  requirePermission('attendance.read'),
  asyncHandler(attendanceController.getAttendanceRecords)
);

router.get('/admin/attendance/:id', 
  requireRole(['super_admin', 'hr_admin', 'hr']), 
  requirePermission('attendance.read'),
  asyncHandler(attendanceController.getAttendanceRecordById)
);

router.post('/admin/attendance', 
  requireRole(['super_admin', 'hr_admin']), 
  requirePermission('attendance.create'),
  asyncHandler(attendanceController.createAttendanceRecord)
);

router.put('/admin/attendance/:id', 
  requireRole(['super_admin', 'hr_admin']), 
  requirePermission('attendance.update'),
  asyncHandler(attendanceController.updateAttendanceRecord)
);

router.delete('/admin/attendance/:id', 
  requireRole(['super_admin', 'hr_admin']), 
  requirePermission('attendance.delete'),
  asyncHandler(attendanceController.deleteAttendanceRecord)
);

// Clock In/Out Operations
router.post('/admin/attendance/clock-in', 
  requireRole(['super_admin', 'hr_admin', 'hr', 'staff']), 
  requirePermission('attendance.clock_in'),
  asyncHandler(attendanceController.clockIn)
);

router.post('/admin/attendance/clock-out', 
  requireRole(['super_admin', 'hr_admin', 'hr', 'staff']), 
  requirePermission('attendance.clock_out'),
  asyncHandler(attendanceController.clockOut)
);

router.post('/admin/attendance/break-start', 
  requireRole(['super_admin', 'hr_admin', 'hr', 'staff']), 
  requirePermission('attendance.break_start'),
  asyncHandler(attendanceController.breakStart)
);

router.post('/admin/attendance/break-end', 
  requireRole(['super_admin', 'hr_admin', 'hr', 'staff']), 
  requirePermission('attendance.break_end'),
  asyncHandler(attendanceController.breakEnd)
);

// Statistics and Reports
router.get('/admin/attendance/stats', 
  requireRole(['super_admin', 'hr_admin', 'hr']), 
  requirePermission('attendance.read'),
  asyncHandler(attendanceController.getAttendanceStats)
);

router.get('/admin/attendance/export', 
  requireRole(['super_admin', 'hr_admin', 'hr']), 
  requirePermission('attendance.export'),
  asyncHandler(attendanceController.exportAttendanceRecords)
);

// Real-time Updates
router.get('/admin/attendance/stream', 
  requireRole(['super_admin', 'hr_admin', 'hr']), 
  requirePermission('attendance.read'),
  asyncHandler(attendanceController.getAttendanceStream)
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

### Attendance Controller: `backend/src/controllers/hr/attendance.controller.ts`

```typescript
import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AttendanceService } from '../../services/hr/attendance.service';
import { asyncHandler } from '../../middleware/errorHandler';

export class AttendanceController {
  // Get attendance records with enhanced filtering
  static getAttendanceRecords = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      search,
      status,
      department,
      branch_id,
      date,
      date_from,
      date_to,
      staff_id,
      page = 1,
      limit = 25,
      sort_by = 'attendance_date',
      sort_order = 'desc'
    } = req.query;

    const filters = {
      search: search as string,
      status: status as string,
      department: department as string,
      branch_id: branch_id as string,
      date: date as string,
      date_from: date_from as string,
      date_to: date_to as string,
      staff_id: staff_id as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort_by: sort_by as string,
      sort_order: sort_order as 'asc' | 'desc'
    };

    const result = await AttendanceService.getAttendanceRecords(filters);
    
    res.json({
      success: true,
      data: result
    });
  });

  // Get specific attendance record
  static getAttendanceRecordById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const record = await AttendanceService.getAttendanceRecordById(id);
    
    res.json({
      success: true,
      data: record
    });
  });

  // Create attendance record
  static createAttendanceRecord = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const recordData = req.body;
    const createdBy = req.user!.userId;

    const result = await AttendanceService.createAttendanceRecord(recordData, createdBy);
    
    res.status(201).json({
      success: true,
      message: 'Attendance record created successfully',
      data: result
    });
  });

  // Update attendance record
  static updateAttendanceRecord = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const recordData = req.body;
    const updatedBy = req.user!.userId;

    const result = await AttendanceService.updateAttendanceRecord(id, recordData, updatedBy);
    
    res.json({
      success: true,
      message: 'Attendance record updated successfully',
      data: result
    });
  });

  // Delete attendance record
  static deleteAttendanceRecord = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const deletedBy = req.user!.userId;

    await AttendanceService.deleteAttendanceRecord(id, deletedBy);
    
    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  });

  // Clock in
  static clockIn = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { staff_id, location, notes } = req.body;
    const userId = req.user!.userId;

    if (!staff_id) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID is required'
      });
    }

    const result = await AttendanceService.clockIn(staff_id, location, notes, userId);
    
    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  });

  // Clock out
  static clockOut = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { staff_id, notes } = req.body;
    const userId = req.user!.userId;

    if (!staff_id) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID is required'
      });
    }

    const result = await AttendanceService.clockOut(staff_id, notes, userId);
    
    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  });

  // Break start
  static breakStart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { staff_id, notes } = req.body;
    const userId = req.user!.userId;

    if (!staff_id) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID is required'
      });
    }

    const result = await AttendanceService.breakStart(staff_id, notes, userId);
    
    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  });

  // Break end
  static breakEnd = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { staff_id, notes } = req.body;
    const userId = req.user!.userId;

    if (!staff_id) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID is required'
      });
    }

    const result = await AttendanceService.breakEnd(staff_id, notes, userId);
    
    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  });

  // Get attendance statistics
  static getAttendanceStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { date, department, branch_id } = req.query;

    const result = await AttendanceService.getAttendanceStats({
      date: date as string,
      department: department as string,
      branch_id: branch_id as string
    });
    
    res.json({
      success: true,
      data: result
    });
  });

  // Export attendance records
  static exportAttendanceRecords = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      format = 'csv',
      date_from,
      date_to,
      department,
      branch_id,
      status
    } = req.query;

    const filters = {
      date_from: date_from as string,
      date_to: date_to as string,
      department: department as string,
      branch_id: branch_id as string,
      status: status as string
    };

    const result = await AttendanceService.exportAttendanceRecords(filters, format as string);
    
    res.setHeader('Content-Type', format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_records_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}"`);
    
    res.send(result);
  });

  // Get real-time attendance stream
  static getAttendanceStream = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { last_updated } = req.query;
    
    const result = await AttendanceService.getAttendanceStream(last_updated as string);
    
    res.json({
      success: true,
      data: result
    });
  });
}
```

### Attendance Service: `backend/src/services/hr/attendance.service.ts`

```typescript
import { supabaseAdmin } from '../../config/supabaseClient';
import { ExportService } from '../export.service';

export interface AttendanceFilters {
  search?: string;
  status?: string;
  department?: string;
  branch_id?: string;
  date?: string;
  date_from?: string;
  date_to?: string;
  staff_id?: string;
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export class AttendanceService {
  // Get attendance records with enhanced filtering and joins
  static async getAttendanceRecords(filters: AttendanceFilters) {
    try {
      let query = supabaseAdmin
        .from('attendance_records_enhanced')
        .select('*');

      // Apply filters
      if (filters.search) {
        query = query.or(`
          staff_name.ilike.%${filters.search}%,
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
      if (filters.date) {
        query = query.eq('attendance_date', filters.date);
      }
      if (filters.date_from) {
        query = query.gte('attendance_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('attendance_date', filters.date_to);
      }
      if (filters.staff_id) {
        query = query.eq('staff_id', filters.staff_id);
      }

      // Apply sorting
      const sortColumn = filters.sort_by || 'attendance_date';
      const sortOrder = filters.sort_order || 'desc';
      query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);

      const { data: records, error, count } = await query;

      if (error) throw error;

      return {
        records: records || [],
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / filters.limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch attendance records: ${error}`);
    }
  }

  // Get specific attendance record
  static async getAttendanceRecordById(id: string) {
    try {
      const { data: record, error } = await supabaseAdmin
        .from('attendance_records_enhanced')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return record;
    } catch (error) {
      throw new Error(`Failed to fetch attendance record: ${error}`);
    }
  }

  // Create attendance record
  static async createAttendanceRecord(recordData: any, createdBy: string) {
    try {
      const { data: record, error } = await supabaseAdmin
        .from('attendance_records')
        .insert({
          ...recordData,
          created_by_user_id: createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Log the creation
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: createdBy,
          action: 'attendance_record_created',
          entity_type: 'attendance_record',
          entity_id: record.id,
          new_values: recordData,
          created_at: new Date().toISOString()
        });

      return record;
    } catch (error) {
      throw new Error(`Failed to create attendance record: ${error}`);
    }
  }

  // Update attendance record
  static async updateAttendanceRecord(id: string, recordData: any, updatedBy: string) {
    try {
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
          action: 'attendance_record_updated',
          entity_type: 'attendance_record',
          entity_id: id,
          new_values: recordData,
          created_at: new Date().toISOString()
        });

      return record;
    } catch (error) {
      throw new Error(`Failed to update attendance record: ${error}`);
    }
  }

  // Delete attendance record
  static async deleteAttendanceRecord(id: string, deletedBy: string) {
    try {
      const { error } = await supabaseAdmin
        .from('attendance_records')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log the deletion
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: deletedBy,
          action: 'attendance_record_deleted',
          entity_type: 'attendance_record',
          entity_id: id,
          created_at: new Date().toISOString()
        });

      return true;
    } catch (error) {
      throw new Error(`Failed to delete attendance record: ${error}`);
    }
  }

  // Clock in
  static async clockIn(staffId: string, location: string, notes: string, userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('clock_in', {
          p_staff_id: staffId,
          p_location: location,
          p_notes: notes,
          p_created_by_user_id: userId
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to clock in: ${error}`);
    }
  }

  // Clock out
  static async clockOut(staffId: string, notes: string, userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('clock_out', {
          p_staff_id: staffId,
          p_notes: notes,
          p_updated_by_user_id: userId
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to clock out: ${error}`);
    }
  }

  // Break start
  static async breakStart(staffId: string, notes: string, userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('break_start', {
          p_staff_id: staffId,
          p_notes: notes,
          p_updated_by_user_id: userId
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to start break: ${error}`);
    }
  }

  // Break end
  static async breakEnd(staffId: string, notes: string, userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('break_end', {
          p_staff_id: staffId,
          p_notes: notes,
          p_updated_by_user_id: userId
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to end break: ${error}`);
    }
  }

  // Get attendance statistics
  static async getAttendanceStats(filters: any) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_attendance_stats', {
          p_date: filters.date || new Date().toISOString().split('T')[0],
          p_department: filters.department,
          p_branch_id: filters.branch_id
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch attendance statistics: ${error}`);
    }
  }

  // Export attendance records
  static async exportAttendanceRecords(filters: any, format: string) {
    try {
      // Get all records matching filters (no pagination for export)
      const { data: records, error } = await supabaseAdmin
        .from('attendance_records_enhanced')
        .select('*');

      if (error) throw error;

      // Apply filters
      let filteredRecords = records || [];
      
      if (filters.date_from) {
        filteredRecords = filteredRecords.filter(r => r.attendance_date >= filters.date_from);
      }
      if (filters.date_to) {
        filteredRecords = filteredRecords.filter(r => r.attendance_date <= filters.date_to);
      }
      if (filters.department) {
        filteredRecords = filteredRecords.filter(r => r.department === filters.department);
      }
      if (filters.status) {
        filteredRecords = filteredRecords.filter(r => r.status === filters.status);
      }

      // Generate export file
      if (format === 'excel') {
        return await ExportService.generateExcel(filteredRecords, 'attendance_records');
      } else {
        return await ExportService.generateCSV(filteredRecords, 'attendance_records');
      }
    } catch (error) {
      throw new Error(`Failed to export attendance records: ${error}`);
    }
  }

  // Get real-time attendance stream
  static async getAttendanceStream(lastUpdated?: string) {
    try {
      let query = supabaseAdmin
        .from('attendance_records_enhanced')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (lastUpdated) {
        query = query.gt('updated_at', lastUpdated);
      }

      const { data: records, error } = await query;

      if (error) throw error;

      return {
        records: records || [],
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to fetch attendance stream: ${error}`);
    }
  }
}
```

---

## Frontend Integration

### API Service: `frontend/src/services/attendanceService.ts`

```typescript
import { apiClient } from './apiClient';

export interface AttendanceFilters {
  search?: string;
  status?: string;
  department?: string;
  branch_id?: string;
  date?: string;
  date_from?: string;
  date_to?: string;
  staff_id?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export class AttendanceService {
  // Get attendance records
  static async getAttendanceRecords(filters: AttendanceFilters = {}) {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof AttendanceFilters] !== undefined) {
        params.append(key, filters[key as keyof AttendanceFilters] as string);
      }
    });

    const response = await apiClient.get(`/v1/hr/admin/attendance?${params.toString()}`);
    return response.data;
  }

  // Get specific record
  static async getAttendanceRecordById(id: string) {
    const response = await apiClient.get(`/v1/hr/admin/attendance/${id}`);
    return response.data;
  }

  // Create record
  static async createAttendanceRecord(data: any) {
    const response = await apiClient.post('/v1/hr/admin/attendance', data);
    return response.data;
  }

  // Update record
  static async updateAttendanceRecord(id: string, data: any) {
    const response = await apiClient.put(`/v1/hr/admin/attendance/${id}`, data);
    return response.data;
  }

  // Delete record
  static async deleteAttendanceRecord(id: string) {
    const response = await apiClient.delete(`/v1/hr/admin/attendance/${id}`);
    return response.data;
  }

  // Clock in
  static async clockIn(staffId: string, location: string, notes?: string) {
    const response = await apiClient.post('/v1/hr/admin/attendance/clock-in', {
      staff_id: staffId,
      location,
      notes
    });
    return response.data;
  }

  // Clock out
  static async clockOut(staffId: string, notes?: string) {
    const response = await apiClient.post('/v1/hr/admin/attendance/clock-out', {
      staff_id: staffId,
      notes
    });
    return response.data;
  }

  // Break start
  static async breakStart(staffId: string, notes?: string) {
    const response = await apiClient.post('/v1/hr/admin/attendance/break-start', {
      staff_id: staffId,
      notes
    });
    return response.data;
  }

  // Break end
  static async breakEnd(staffId: string, notes?: string) {
    const response = await apiClient.post('/v1/hr/admin/attendance/break-end', {
      staff_id: staffId,
      notes
    });
    return response.data;
  }

  // Get statistics
  static async getAttendanceStats(date?: string, department?: string, branchId?: string) {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (department) params.append('department', department);
    if (branchId) params.append('branch_id', branchId);

    const response = await apiClient.get(`/v1/hr/admin/attendance/stats?${params.toString()}`);
    return response.data;
  }

  // Export records
  static async exportAttendanceRecords(filters: any, format: 'csv' | 'excel' = 'csv') {
    const params = new URLSearchParams();
    params.append('format', format);
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });

    const response = await apiClient.get(`/v1/hr/admin/attendance/export?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  // Get real-time stream
  static async getAttendanceStream(lastUpdated?: string) {
    const params = new URLSearchParams();
    if (lastUpdated) {
      params.append('last_updated', lastUpdated);
    }

    const response = await apiClient.get(`/v1/hr/admin/attendance/stream?${params.toString()}`);
    return response.data;
  }
}
```

---

## Implementation Steps

### Step 1: Database Setup
1. Run the SQL migrations to create enhanced views and functions
2. Create the clock in/out functions
3. Create the attendance statistics function
4. Test the database functions

### Step 2: Backend Implementation
1. Create the `AttendanceService` class
2. Create the `AttendanceController` class
3. Update the `hr.routes.ts` file
4. Add export functionality
5. Test all endpoints

### Step 3: Frontend Integration
1. Create the `attendanceService.ts` API service
2. Update your `AttendanceDashboard.tsx` component
3. Add real-time updates
4. Add export functionality
5. Add clock in/out functionality

### Step 4: Testing
1. Test all CRUD operations
2. Test clock in/out functionality
3. Test break start/end functionality
4. Test filtering and pagination
5. Test export functionality
6. Test real-time updates

This implementation provides a complete attendance management system with real-time monitoring, clock in/out functionality, break management, statistics, and export capabilities.
