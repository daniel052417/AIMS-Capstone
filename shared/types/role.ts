export interface Role {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role: string;
  permission: string;
  created_at: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
  is_active?: boolean;
}

export interface CreatePermissionRequest {
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface UpdatePermissionRequest {
  name?: string;
  description?: string;
  resource?: string;
  action?: string;
}

