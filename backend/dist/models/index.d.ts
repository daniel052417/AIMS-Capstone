export interface BaseModel {
    id: string;
    created_at: string;
    updated_at: string;
}
export interface UserModel extends BaseModel {
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    department?: string;
    is_active: boolean;
}
export interface RoleModel extends BaseModel {
    name: string;
    description: string;
    is_active: boolean;
}
export interface PermissionModel extends BaseModel {
    name: string;
    description: string;
    resource: string;
    action: string;
}
export interface DepartmentModel extends BaseModel {
    name: string;
    description: string;
    manager_id?: string;
    is_active: boolean;
}
export interface AuditLogModel extends BaseModel {
    user_id: string;
    action: string;
    resource: string;
    resource_id: string;
    details: any;
    ip_address: string;
    user_agent: string;
}
//# sourceMappingURL=index.d.ts.map