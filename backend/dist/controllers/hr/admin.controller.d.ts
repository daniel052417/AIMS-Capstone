import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
export declare const getDashboard: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getEmployees: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getEmployeeById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createEmployee: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateEmployee: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteEmployee: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAttendanceRecords: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createAttendanceRecord: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateAttendanceRecord: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getLeaveRequests: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const approveLeaveRequest: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const rejectLeaveRequest: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPayrollRecords: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createPayrollRecord: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updatePayrollRecord: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=admin.controller.d.ts.map