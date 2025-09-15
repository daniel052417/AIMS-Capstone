import { supabaseAdmin } from '../../config/supabaseClient';
import type { 
  Staff, 
  AttendanceRecord, 
  LeaveRequest, 
  PayrollRecord, 
  PayrollPeriod,
  PayrollBenefit,
  EmployeeBenefit,
  PerformanceReview,
  HRDocument,
  Department,
  JobTitle,
  CalculatePayrollRecordResult,
} from '@shared/types/database';

export class HRAdminService {
  // Dashboard
  static async getDashboard() {
    try {
      const [
        staffResult,
        attendanceResult,
        leaveRequestsResult,
        payrollResult,
      ] = await Promise.all([
        supabaseAdmin.from('staff').select('id', { count: 'exact' }),
        supabaseAdmin.from('attendance_records').select('id', { count: 'exact' }),
        supabaseAdmin.from('leave_requests').select('id', { count: 'exact' }),
        supabaseAdmin.from('payroll_records').select('id', { count: 'exact' }),
      ]);

      return {
        totalStaff: staffResult.count || 0,
        totalAttendance: attendanceResult.count || 0,
        pendingLeaveRequests: leaveRequestsResult.count || 0,
        totalPayrollRecords: payrollResult.count || 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch HR dashboard: ${error}`);
    }
  }

  // Staff Management
  static async getEmployees(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('staff')
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          email,
          phone,
          position,
          department,
          branch_id,
          hire_date,
          salary,
          is_active,
          role,
          created_at,
          updated_at
        `);

      // Apply filters
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      if (filters.department) {
        query = query.eq('department', filters.department);
      }
      if (filters.position) {
        query = query.eq('position', filters.position);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        employees: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch employees: ${error}`);
    }
  }

  static async getEmployeeById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('staff')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch employee: ${error}`);
    }
  }

  static async createEmployee(employeeData: Partial<Staff>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('staff')
        .insert([employeeData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create employee: ${error}`);
    }
  }

  static async updateEmployee(id: string, employeeData: Partial<Staff>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('staff')
        .update(employeeData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update employee: ${error}`);
    }
  }

  static async deleteEmployee(id: string) {
    try {
      const { error } = await supabaseAdmin
        .from('staff')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete employee: ${error}`);
    }
  }

  // Attendance Management
  static async getAttendanceRecords(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('attendance_records')
        .select(`
          *,
          staff:staff_id (
            first_name,
            last_name,
            employee_id
          )
        `);

      if (filters.staff_id) {
        query = query.eq('staff_id', filters.staff_id);
      }
      if (filters.date_from) {
        query = query.gte('date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('date', filters.date_to);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('date', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        records: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch attendance records: ${error}`);
    }
  }

  static async createAttendanceRecord(recordData: Partial<AttendanceRecord>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('attendance_records')
        .insert([recordData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create attendance record: ${error}`);
    }
  }

  static async updateAttendanceRecord(id: string, recordData: Partial<AttendanceRecord>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('attendance_records')
        .update(recordData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update attendance record: ${error}`);
    }
  }

  // Leave Management
  static async getLeaveRequests(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('leave_requests')
        .select(`
          *,
          staff:staff_id (
            first_name,
            last_name,
            employee_id
          )
        `);

      if (filters.staff_id) {
        query = query.eq('staff_id', filters.staff_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.leave_type) {
        query = query.eq('leave_type', filters.leave_type);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        requests: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch leave requests: ${error}`);
    }
  }

  static async approveLeaveRequest(id: string, approvedBy: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('leave_requests')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to approve leave request: ${error}`);
    }
  }

  static async rejectLeaveRequest(id: string, rejectedBy: string, rejectionReason: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('leave_requests')
        .update({
          status: 'rejected',
          approved_by: rejectedBy,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to reject leave request: ${error}`);
    }
  }

  // Payroll Management
  static async getPayrollRecords(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('payroll_records')
        .select(`
          *,
          staff:staff_id (
            first_name,
            last_name,
            employee_id
          ),
          payroll_periods:period_id (
            period_name,
            start_date,
            end_date
          )
        `);

      if (filters.staff_id) {
        query = query.eq('staff_id', filters.staff_id);
      }
      if (filters.period_id) {
        query = query.eq('period_id', filters.period_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        records: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch payroll records: ${error}`);
    }
  }

  static async createPayrollRecord(recordData: Partial<PayrollRecord>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('payroll_records')
        .insert([recordData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create payroll record: ${error}`);
    }
  }

  static async updatePayrollRecord(id: string, recordData: Partial<PayrollRecord>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('payroll_records')
        .update(recordData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update payroll record: ${error}`);
    }
  }

  // Payroll Calculation Function
  static async calculatePayrollRecord(
    staffId: string,
    periodId: string,
    baseSalary: number,
    regularHours: number = 0,
    overtimeHours: number = 0,
    bonuses: number = 0,
    allowances: number = 0,
  ): Promise<CalculatePayrollRecordResult> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('calculate_payroll_record', {
          p_staff_id: staffId,
          p_period_id: periodId,
          p_base_salary: baseSalary,
          p_regular_hours: regularHours,
          p_overtime_hours: overtimeHours,
          p_bonuses: bonuses,
          p_allowances: allowances,
        });

      if (error) throw error;
      return data[0];
    } catch (error) {
      throw new Error(`Failed to calculate payroll record: ${error}`);
    }
  }

  // Payroll Periods
  static async getPayrollPeriods() {
    try {
      const { data, error } = await supabaseAdmin
        .from('payroll_periods')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch payroll periods: ${error}`);
    }
  }

  static async createPayrollPeriod(periodData: Partial<PayrollPeriod>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('payroll_periods')
        .insert([periodData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create payroll period: ${error}`);
    }
  }

  // Process Payroll Period
  static async processPayrollPeriod(periodId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('process_payroll_period', { p_period_id: periodId });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to process payroll period: ${error}`);
    }
  }

  // Benefits Management
  static async getBenefits() {
    try {
      const { data, error } = await supabaseAdmin
        .from('benefits')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch benefits: ${error}`);
    }
  }

  static async createBenefit(benefitData: Partial<Benefit>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('benefits')
        .insert([benefitData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create benefit: ${error}`);
    }
  }

  static async updateBenefit(id: string, benefitData: Partial<Benefit>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('benefits')
        .update(benefitData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update benefit: ${error}`);
    }
  }

  static async deleteBenefit(id: string) {
    try {
      const { error } = await supabaseAdmin
        .from('benefits')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete benefit: ${error}`);
    }
  }

  // Employee Benefits
  static async getEmployeeBenefits(staffId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('employee_benefits')
        .select(`
          *,
          benefits:benefit_id (
            name,
            description,
            benefit_type
          )
        `)
        .eq('staff_id', staffId);

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch employee benefits: ${error}`);
    }
  }

  static async assignBenefitToEmployee(assignmentData: Partial<EmployeeBenefit>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('employee_benefits')
        .insert([assignmentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to assign benefit to employee: ${error}`);
    }
  }

  // Performance Reviews
  static async getPerformanceReviews(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('performance_reviews')
        .select(`
          *,
          staff:staff_id (
            first_name,
            last_name,
            employee_id
          )
        `);

      if (filters.staff_id) {
        query = query.eq('staff_id', filters.staff_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('review_date', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        reviews: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch performance reviews: ${error}`);
    }
  }

  static async createPerformanceReview(reviewData: Partial<PerformanceReview>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('performance_reviews')
        .insert([reviewData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create performance review: ${error}`);
    }
  }

  // HR Documents
  static async getHRDocuments(staffId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('hr_documents')
        .select('*')
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch HR documents: ${error}`);
    }
  }

  static async uploadHRDocument(documentData: Partial<HRDocument>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('hr_documents')
        .insert([documentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to upload HR document: ${error}`);
    }
  }

  // Departments
  static async getDepartments() {
    try {
      const { data, error } = await supabaseAdmin
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch departments: ${error}`);
    }
  }

  // Job Titles
  static async getJobTitles() {
    try {
      const { data, error } = await supabaseAdmin
        .from('job_titles')
        .select('*')
        .order('title');

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch job titles: ${error}`);
    }
  }
}