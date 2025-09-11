import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
export declare const getProfile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateProfile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMyAttendance: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const clockIn: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const clockOut: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMyLeaves: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createLeaveRequest: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateLeaveRequest: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const cancelLeaveRequest: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMyPayroll: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=staff.controller.d.ts.map