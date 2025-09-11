import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
export declare const requireRole: (allowedRoles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requirePermission: (requiredPermission: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireAllPermissions: (requiredPermissions: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireAnyPermission: (requiredPermissions: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireDepartment: (allowedDepartments: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.d.ts.map