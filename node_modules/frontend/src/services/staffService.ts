import { apiClient } from '../api/apiClient';

export interface StaffFormData {
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hire_date: string;
  salary: number;
  role: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  branch_id: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  nationality?: string;
  passport_number?: string;
  sss_number?: string;
  philhealth_number?: string;
  pagibig_number?: string;
  tin_number?: string;
  bank_account?: string;
  bank_name?: string;
  notes?: string;
  profile_picture?: File;
}

export interface StaffFilters {
  search?: string;
  department?: string;
  branch_id?: string;
  role?: string;
  is_active?: string;
  page?: number;
  limit?: number;
}

export class StaffService {
  // Create new staff member
  static async createStaff(formData: StaffFormData) {
    const data = new FormData();
    
    // Append all form fields
    Object.keys(formData).forEach(key => {
      if (formData[key as keyof StaffFormData] !== undefined && formData[key as keyof StaffFormData] !== null) {
        data.append(key, formData[key as keyof StaffFormData] as string);
      }
    });

    const response = await apiClient.post('/v1/hr/admin/employees', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Get staff members
  static async getStaff(filters: StaffFilters = {}) {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof StaffFilters] !== undefined) {
        params.append(key, filters[key as keyof StaffFilters] as string);
      }
    });

    const response = await apiClient.get(`/v1/hr/admin/employees?${params.toString()}`);
    return response.data;
  }

  // Get specific staff member
  static async getStaffById(id: string) {
    const response = await apiClient.get(`/v1/hr/admin/employees/${id}`);
    return response.data;
  }

  // Update staff member
  static async updateStaff(id: string, formData: Partial<StaffFormData>) {
    const data = new FormData();
    
    Object.keys(formData).forEach(key => {
      if (formData[key as keyof StaffFormData] !== undefined && formData[key as keyof StaffFormData] !== null) {
        data.append(key, formData[key as keyof StaffFormData] as string);
      }
    });

    const response = await apiClient.put(`/v1/hr/admin/employees/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Delete staff member
  static async deleteStaff(id: string) {
    const response = await apiClient.delete(`/v1/hr/admin/employees/${id}`);
    return response.data;
  }

  // Get available roles
  static async getRoles() {
    const response = await apiClient.get('/v1/hr/admin/roles');
    return response.data;
  }

  // Get departments
  static async getDepartments() {
    const response = await apiClient.get('/v1/hr/admin/departments');
    return response.data;
  }

  // Get branches
  static async getBranches() {
    const response = await apiClient.get('/v1/hr/admin/branches');
    return response.data;
  }

  // Generate employee ID
  static async generateEmployeeId() {
    const response = await apiClient.get('/v1/hr/admin/employees/generate-id');
    return response.data;
  }

  // Validate email
  static async validateEmail(email: string) {
    const response = await apiClient.post('/v1/hr/admin/employees/validate-email', { email });
    return response.data;
  }
}