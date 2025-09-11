export interface Department {
  id: string;
  name: string;
  description: string;
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentRequest {
  name: string;
  description: string;
  manager_id?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  manager_id?: string;
  is_active?: boolean;
}

export const DEPARTMENTS = {
  ADMIN: 'admin',
  HR: 'hr',
  MARKETING: 'marketing',
  SALES: 'sales',
  INVENTORY: 'inventory',
  FINANCE: 'finance',
  IT: 'it',
  CUSTOMER_SERVICE: 'customer_service'
} as const;

export type DepartmentType = typeof DEPARTMENTS[keyof typeof DEPARTMENTS];

