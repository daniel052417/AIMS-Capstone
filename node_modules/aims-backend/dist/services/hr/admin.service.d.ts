import type { Staff, AttendanceRecord, PayrollRecord, PayrollPeriod, EmployeeBenefit, PerformanceReview, HRDocument, CalculatePayrollRecordResult } from '@shared/types/database';
export declare class HRAdminService {
    static getDashboard(): Promise<{
        totalStaff: number;
        totalAttendance: number;
        pendingLeaveRequests: number;
        totalPayrollRecords: number;
        timestamp: string;
    }>;
    static getEmployees(filters?: any): Promise<{
        employees: {
            id: any;
            employee_id: any;
            first_name: any;
            last_name: any;
            email: any;
            phone: any;
            position: any;
            department: any;
            branch_id: any;
            hire_date: any;
            salary: any;
            is_active: any;
            role: any;
            created_at: any;
            updated_at: any;
        }[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static getEmployeeById(id: string): Promise<any>;
    static createEmployee(employeeData: Partial<Staff>): Promise<any>;
    static updateEmployee(id: string, employeeData: Partial<Staff>): Promise<any>;
    static deleteEmployee(id: string): Promise<{
        success: boolean;
    }>;
    static getAttendanceRecords(filters?: any): Promise<{
        records: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static createAttendanceRecord(recordData: Partial<AttendanceRecord>): Promise<any>;
    static updateAttendanceRecord(id: string, recordData: Partial<AttendanceRecord>): Promise<any>;
    static getLeaveRequests(filters?: any): Promise<{
        requests: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static approveLeaveRequest(id: string, approvedBy: string): Promise<any>;
    static rejectLeaveRequest(id: string, rejectedBy: string, rejectionReason: string): Promise<any>;
    static getPayrollRecords(filters?: any): Promise<{
        records: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static createPayrollRecord(recordData: Partial<PayrollRecord>): Promise<any>;
    static updatePayrollRecord(id: string, recordData: Partial<PayrollRecord>): Promise<any>;
    static calculatePayrollRecord(staffId: string, periodId: string, baseSalary: number, regularHours?: number, overtimeHours?: number, bonuses?: number, allowances?: number): Promise<CalculatePayrollRecordResult>;
    static getPayrollPeriods(): Promise<any[]>;
    static createPayrollPeriod(periodData: Partial<PayrollPeriod>): Promise<any>;
    static processPayrollPeriod(periodId: string): Promise<any>;
    static getBenefits(): Promise<any[]>;
    static createBenefit(benefitData: Partial<Benefit>): Promise<any>;
    static updateBenefit(id: string, benefitData: Partial<Benefit>): Promise<any>;
    static deleteBenefit(id: string): Promise<{
        success: boolean;
    }>;
    static getEmployeeBenefits(staffId: string): Promise<any[]>;
    static assignBenefitToEmployee(assignmentData: Partial<EmployeeBenefit>): Promise<any>;
    static getPerformanceReviews(filters?: any): Promise<{
        reviews: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static createPerformanceReview(reviewData: Partial<PerformanceReview>): Promise<any>;
    static getHRDocuments(staffId: string): Promise<any[]>;
    static uploadHRDocument(documentData: Partial<HRDocument>): Promise<any>;
    static getDepartments(): Promise<any[]>;
    static getJobTitles(): Promise<any[]>;
}
//# sourceMappingURL=admin.service.d.ts.map