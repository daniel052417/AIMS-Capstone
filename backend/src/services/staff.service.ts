import { supabaseAdmin } from '../config/supabaseClient';
import { PasswordUtils } from '../utils/password';
import { EmailService } from '../services/email.service';
import { FileUploadService } from '../services/fileUpload.service';
import { randomUUID } from 'crypto';
export interface StaffData {
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
  profile_picture?: string;
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
}

export interface StaffFilters {
  search?: string;
  department?: string;
  branch_id?: string;
  role?: string;
  is_active?: string;
  page: number;
  limit: number;
}

export class StaffService {
  // Create new staff member with user account
  static async createStaff(staffData: StaffData, profilePicture: any, createdBy: string) {
    try {
      // Start transaction
      const { data: staff, error: staffError } = await supabaseAdmin
        .from('staff')
        .insert({
          ...staffData,
          employee_id: await this.generateEmployeeId(),
          created_by: createdBy,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (staffError) throw staffError;

      // Handle profile picture upload
      let profilePictureUrl: string | null = null;
      if (profilePicture) {
        profilePictureUrl = await FileUploadService.uploadProfilePicture(
          profilePicture, 
          staff.id
        );
        
        // Update staff record with profile picture URL
        await supabaseAdmin
          .from('staff')
          .update({ profile_picture: profilePictureUrl })
          .eq('id', staff.id);
      }

      // Generate password for user account
      const generatedPassword = PasswordUtils.generateSecurePassword();

      
      // Create user account
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: staffData.email,
        password: generatedPassword,
        user_metadata: {
          first_name: staffData.first_name,
          last_name: staffData.last_name,
          phone: staffData.phone,
          branch_id: staffData.branch_id,
        },
      });

      if (authError) {
        // Rollback staff creation
        await supabaseAdmin.from('staff').delete().eq('id', staff.id);
        throw new Error(`Failed to create user account: ${authError.message}`);
      }

      // Create user in public.users table
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user!.id,
          email: staffData.email,
          first_name: staffData.first_name,
          last_name: staffData.last_name,
          phone: staffData.phone,
          branch_id: staffData.branch_id,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (userError) {
        // Rollback: Delete auth user and staff
        await supabaseAdmin.auth.admin.deleteUser(authData.user!.id);
        await supabaseAdmin.from('staff').delete().eq('id', staff.id);
        throw new Error(`Failed to create user profile: ${userError.message}`);
      }

      // Link staff to user
      const { error: linkError } = await supabaseAdmin
        .from('staff_user_link')
        .insert({
          staff_id: staff.id,
          user_id: user.id,
          is_primary: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (linkError) {
        console.error('Failed to link staff to user:', linkError);
        // Continue anyway as this is not critical
      }

      // Assign role to user
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: user.id,
          role_id: await this.getRoleIdByName(staffData.role),
          assigned_at: new Date().toISOString(),
          assigned_by_user_id: createdBy,
          created_at: new Date().toISOString()
        });

      if (roleError) {
        console.error('Failed to assign role:', roleError);
        // Continue anyway as this can be fixed later
      }

      // Send welcome email
      try {
        await EmailService.sendWelcomeEmail({
          to: staffData.email,
          name: `${staffData.first_name} ${staffData.last_name}`,
          employeeId: staff.employee_id,
          password: generatedPassword,
          position: staffData.position,
          department: staffData.department
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Continue anyway as this is not critical
      }

      return {
        staff: {
          ...staff,
          profile_picture: profilePictureUrl
        },
        user: {
          id: user.id,
          email: user.email,
          generated_password: generatedPassword
        }
      };

    } catch (error) {
        console.error('Failed to fetch Active user stats', error);
        throw new Error('Failed to fetch Active user stats');
    }
  }

  // Get staff members with filtering
  static async getStaff(filters: StaffFilters) {
    try {
      let query = supabaseAdmin
        .from('staff')
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          middle_name,
          email,
          phone,
          position,
          department,
          hire_date,
          salary,
          role,
          address,
          emergency_contact,
          emergency_phone,
          profile_picture,
          is_active,
          branch_id,
          created_at,
          updated_at,
          branches (
            name
          )
        `);

      // Apply filters
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%`);
      }
      if (filters.department) {
        query = query.eq('department', filters.department);
      }
      if (filters.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active === 'true');
      }

      // Apply pagination
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data: staff, error, count } = await query;

      if (error) throw error;

      return {
        staff: staff || [],
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / filters.limit)
        }
      };
    } catch (error) {
        console.error('Sipyat sa pag kuha sa employee', error);
        throw new Error('Sipyat sa pag kuha sa employee');
    }
  }

  // Get specific staff member
  static async getStaffById(id: string) {
    try {
      const { data: staff, error } = await supabaseAdmin
        .from('staff')
        .select(`
          *,
          branches (
            id,
            name,
            address,
            city,
            phone
          ),
          staff_user_link (
            user_id,
            users (
              id,
              email,
              is_active,
              last_login
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return staff;
    } catch (error) {
      throw new Error(`Failed to fetch staff member: ${error}`);
    }
  }

  // Update staff member
  static async updateStaff(id: string, staffData: Partial<StaffData>, profilePicture: any, updatedBy: string) {
    try {
      const updateData = {
        ...staffData,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      };

      // Handle profile picture upload
      if (profilePicture) {
        const profilePictureUrl = await FileUploadService.uploadProfilePicture(
          profilePicture, 
          id
        );
        updateData.profile_picture = profilePictureUrl;
      }

      const { data: staff, error } = await supabaseAdmin
        .from('staff')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const newRecordId = randomUUID();
    console.log('Generated record_id for audit_logs:', newRecordId);
      // Log the update
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          record_id: newRecordId,
          user_id: updatedBy,
          action: 'update',
          entity_type: 'staff',
          entity_id: id,
          new_values: updateData,
          created_at: new Date().toISOString()
        });

      return staff;
    } catch (error) {
        console.error('Failed to fetch Active user stats', error);
        throw new Error('Failed to fetch Active user stats'); 
    }
  }

  // Delete staff member
  static async deleteStaff(id: string, deletedBy: string) {
    try {
      // Soft delete - mark as inactive
      const { error } = await supabaseAdmin
        .from('staff')
        .update({ 
          is_active: false,
          updated_by: deletedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Log the deletion
      await supabaseAdmin
        .from('audit_logs')
        .insert({
        record_id: randomUUID(),
          user_id: 'delete',
          entity_type: 'staff',
          entity_id: id,
          created_at: new Date().toISOString()
        });

      return true;
    } catch (error) {
      throw new Error(`Failed to delete staff member: ${error}`);
    }
  }

  // Get available roles
  static async getRoles() {
    try {
      const { data: roles, error } = await supabaseAdmin
        .from('roles')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return roles || [];
    } catch (error) {
        console.error('Failed to fetch Active user stats', error);
        throw new Error('Failed to fetch Active user stats');  // keep message generic     }
  }
}

  // Get departments
//   static async getDepartments() {
//     try {
//       const { data: departments, error } = await supabaseAdmin
//         .from('departments')
//         .select('id, name, description')
//         .eq('is_active', true)
//         .order('name');

//       if (error) throw error;
//       return departments || [];
//     } catch (error) {
//         console.error('Failed to fetch Active user stats', error);
//         throw new Error('Failed to fetch Active user stats');
//     }
//   }

  // Get branches
  static async getBranches() {
    try {
      const { data: branches, error } = await supabaseAdmin
        .from('branches')
        .select('id, name, address, city, phone')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return branches || [];
    } catch (error) {
        console.error('Failed to fetch Active user stats', error);
        throw new Error('Failed to fetch Active user stats');
    }
  }

  // Generate unique employee ID
  static async generateEmployeeId() {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('generate_employee_id');

      if (error) throw error;
      return data;
    } catch (error) {
        console.error('Failed to fetch Active user stats', error);
        throw new Error('Failed to fetch Active user stats');
    }
  }

  // Check if email exists
  static async checkEmailExists(email: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('staff')
        .select('id')
        .eq('email', email)
        .single();

      return !!data;
    } catch (error) {
        
      return false;
      
    }
  }

  // Get role ID by name
  static async getRoleIdByName(roleName: string) {
    try {
      const { data: role, error } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('role_name', roleName)
        .single();

      if (error) throw error;
      return role.id;
    } catch (error) {
      throw new Error(`Failed to get role ID: ${error}`);
    }
  }
}