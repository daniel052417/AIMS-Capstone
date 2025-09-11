import type { User, Role, Permission, AppSettings } from '@shared/types/database';
export declare class SuperAdminService {
    static getDashboardData(): Promise<{
        users: {
            total: number;
        };
        staff: {
            total: number;
        };
        roles: {
            total: number;
        };
        permissions: {
            total: number;
        };
        auditLogs: {
            total: number;
        };
        systemHealth: {
            status: string;
            uptime: number;
            memory: NodeJS.MemoryUsage;
            timestamp: string;
        };
    }>;
    static getUsers(filters?: any): Promise<{
        users: {
            id: any;
            email: any;
            first_name: any;
            last_name: any;
            role: any;
            is_active: any;
            last_login: any;
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
    static getUserById(id: string): Promise<{
        id: any;
        email: any;
        first_name: any;
        last_name: any;
        phone: any;
        avatar_url: any;
        role: any;
        is_active: any;
        last_login: any;
        staff_id: any;
        username: any;
        created_at: any;
        updated_at: any;
    }>;
    static createUser(userData: Partial<User>): Promise<any>;
    static updateUser(id: string, userData: Partial<User>): Promise<any>;
    static deleteUser(id: string): Promise<{
        success: boolean;
    }>;
    static getRoles(): Promise<any[]>;
    static createRole(roleData: Partial<Role>): Promise<any>;
    static updateRole(id: string, roleData: Partial<Role>): Promise<any>;
    static deleteRole(id: string): Promise<{
        success: boolean;
    }>;
    static getPermissions(): Promise<any[]>;
    static createPermission(permissionData: Partial<Permission>): Promise<any>;
    static updatePermission(id: string, permissionData: Partial<Permission>): Promise<any>;
    static deletePermission(id: string): Promise<{
        success: boolean;
    }>;
    static getStaffWithAccounts(filters?: any): Promise<{
        staff: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static getAppSettings(): Promise<any>;
    static updateAppSettings(settingsData: Partial<AppSettings>): Promise<any>;
    static getSystemSettings(): Promise<any[]>;
    static updateSystemSetting(key: string, value: any, updatedBy: string): Promise<any>;
    static getAuditLogs(filters?: any): Promise<{
        logs: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static getAuditLogById(id: string): Promise<any>;
    static getUserAccessibleComponents(userId: string): Promise<any>;
    static getUserPermissions(userId: string): Promise<any>;
    static userHasPermission(userId: string, permissionName: string): Promise<any>;
    static getSystemHealth(): Promise<{
        status: string;
        database: string;
        uptime: number;
        memory: NodeJS.MemoryUsage;
        timestamp: string;
        error?: undefined;
    } | {
        status: string;
        database: string;
        uptime: number;
        memory: NodeJS.MemoryUsage;
        timestamp: string;
        error: unknown;
    }>;
    static getSystemStats(): Promise<{
        users: number;
        staff: number;
        roles: number;
        permissions: number;
        auditLogs: number;
        timestamp: string;
    }>;
}
//# sourceMappingURL=superAdmin.service.d.ts.map