export interface Role {
    id: string;
    name: string;
    description?: string;
    is_system_role: boolean;
    created_at: string;
  }
  
export interface Permission {
    id: string;
    name: string;
    resource: string;
    action: string;
    description?: string;
  }
  
export interface UserRole {
    user_id: string;
    role_id: string;
    assigned_at: string;
  }
  
export interface RolePermission {
    role_id: string;
    permission_id: string;
    granted_at: string;
  }
  
export interface RolePermissionAudit {
    id: string;
    user_id?: string;
    target_user_id: string;
    role_id?: string;
    permission_id?: string;
    action: 'role_granted' | 'role_revoked' | 'permission_granted' | 'permission_revoked';
    granted_by: string;
    granted_at: string;
    revoked_by?: string;
    revoked_at?: string;
    notes?: string;
  }
  
export interface UserWithRoles {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    branch_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    last_login?: string;
    roles: Role[];
  }
  
export interface PermissionCheck {
    resource: string;
    action: string;
  }
  
export interface RBACResponse {
    success: boolean;
    message: string;
    data?: any;
  }