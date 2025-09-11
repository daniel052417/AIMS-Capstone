export interface UserContext {
    id: string;
    role: string;
    department?: string;
    permissions: string[];
}
export declare const hasPermission: (user: UserContext, permission: string) => boolean;
export declare const hasAnyPermission: (user: UserContext, permissions: string[]) => boolean;
export declare const hasAllPermissions: (user: UserContext, permissions: string[]) => boolean;
export declare const hasRole: (user: UserContext, role: string) => boolean;
export declare const hasAnyRole: (user: UserContext, roles: string[]) => boolean;
export declare const hasHigherRole: (user: UserContext, targetRole: string) => boolean;
export declare const canAccessResource: (user: UserContext, resource: string, action: string) => boolean;
export declare const canManageUser: (user: UserContext, targetUser: UserContext) => boolean;
export declare const canAccessDepartment: (user: UserContext, department: string) => boolean;
export declare const getAccessibleDepartments: (user: UserContext) => string[];
export declare const validatePermission: (user: UserContext, requiredPermission: string) => boolean;
export declare const validateRole: (user: UserContext, requiredRole: string) => boolean;
export declare const validateAnyRole: (user: UserContext, requiredRoles: string[]) => boolean;
//# sourceMappingURL=rbac.d.ts.map