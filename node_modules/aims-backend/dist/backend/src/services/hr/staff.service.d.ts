export declare class HRStaffService {
    static getProfile(userId: string): Promise<{
        message: string;
    }>;
    static updateProfile(userId: string, profileData: any): Promise<{
        message: string;
    }>;
    static getMyAttendance(userId: string, filters: any): Promise<{
        message: string;
    }>;
    static clockIn(userId: string, clockInData: any): Promise<{
        message: string;
    }>;
    static clockOut(userId: string, clockOutData: any): Promise<{
        message: string;
    }>;
    static getMyLeaves(userId: string, filters: any): Promise<{
        message: string;
    }>;
    static createLeaveRequest(userId: string, leaveData: any): Promise<{
        message: string;
    }>;
    static updateLeaveRequest(userId: string, leaveId: string, leaveData: any): Promise<{
        message: string;
    }>;
    static cancelLeaveRequest(userId: string, leaveId: string): Promise<{
        message: string;
    }>;
    static getMyPayroll(userId: string, filters: any): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=staff.service.d.ts.map