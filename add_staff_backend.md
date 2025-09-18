# Add Staff Backend Integration Guide

## Overview
This guide provides a complete backend implementation for the AddStaff module, including database schema updates, API endpoints, and frontend integration steps for creating new staff members with automatic user account creation.

## Table of Contents
1. [Database Schema & Migrations](#database-schema--migrations)
2. [API Endpoints & Routes](#api-endpoints--routes)
3. [Controllers & Services](#controllers--services)
4. [Authentication & Authorization](#authentication--authorization)
5. [Frontend Integration](#frontend-integration)
6. [Implementation Steps](#implementation-steps)

---

## Database Schema & Migrations

### Update Existing Staff Table

```sql
-- Add new fields to staff table
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(100),
ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500),
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20) CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
ADD COLUMN IF NOT EXISTS nationality VARCHAR(50),
ADD COLUMN IF NOT EXISTS passport_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS sss_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS philhealth_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS pagibig_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS tin_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_employee_id ON staff(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);
CREATE INDEX IF NOT EXISTS idx_staff_branch_id ON staff(branch_id);
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON staff(is_active);
```

### Create Employee ID Generation Function

```sql
-- Function to generate unique employee ID
CREATE OR REPLACE FUNCTION generate_employee_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    counter INTEGER := 1;
    prefix TEXT := 'EMP';
    year_part TEXT := TO_CHAR(CURRENT_DATE, 'YY');
BEGIN
    LOOP
        new_id := prefix || year_part || LPAD(counter::TEXT, 4, '0');
        
        -- Check if ID already exists
        IF NOT EXISTS (SELECT 1 FROM staff WHERE employee_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
        
        -- Prevent infinite loop
        IF counter > 9999 THEN
            RAISE EXCEPTION 'Unable to generate unique employee ID';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### Create Staff Creation Audit Function

```sql
-- Function to log staff creation
CREATE OR REPLACE FUNCTION log_staff_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        new_values,
        created_at
    ) VALUES (
        NEW.created_by,
        'staff_created',
        'staff',
        NEW.id,
        jsonb_build_object(
            'employee_id', NEW.employee_id,
            'name', NEW.first_name || ' ' || NEW.last_name,
            'email', NEW.email,
            'position', NEW.position,
            'department', NEW.department
        ),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER staff_creation_audit
    AFTER INSERT ON staff
    FOR EACH ROW
    EXECUTE FUNCTION log_staff_creation();
```

### Create Staff-User Link Function

```sql
-- Function to create staff-user link
CREATE OR REPLACE FUNCTION create_staff_user_link(
    p_staff_id UUID,
    p_user_id UUID,
    p_created_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert staff-user link
    INSERT INTO staff_user_link (staff_id, user_id, is_primary, created_at)
    VALUES (p_staff_id, p_user_id, true, NOW());
    
    -- Log the action
    INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        new_values,
        created_at
    ) VALUES (
        p_created_by,
        'staff_user_linked',
        'staff_user_link',
        p_staff_id,
        jsonb_build_object(
            'staff_id', p_staff_id,
            'user_id', p_user_id
        ),
        NOW()
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

---

## API Endpoints & Routes

### Route File: `backend/src/routes/staff.routes.ts`

```typescript
import { Router } from 'express';
import { StaffController } from '../controllers/staff.controller';
import { authenticateToken, requireRole } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Apply authentication to all routes
router.use(authenticateToken);

// Staff Management Routes
router.post('/employees',
  requireRole(['super_admin', 'hr_admin']),
  requirePermission('staff.create'),
  upload.single('profile_picture'),
  StaffController.createStaff
);

router.get('/employees',
  requireRole(['super_admin', 'hr_admin', 'hr']),
  requirePermission('staff.read'),
  StaffController.getStaff
);

router.get('/employees/:id',
  requireRole(['super_admin', 'hr_admin', 'hr']),
  requirePermission('staff.read'),
  StaffController.getStaffById
);

router.put('/employees/:id',
  requireRole(['super_admin', 'hr_admin']),
  requirePermission('staff.update'),
  upload.single('profile_picture'),
  StaffController.updateStaff
);

router.delete('/employees/:id',
  requireRole(['super_admin', 'hr_admin']),
  requirePermission('staff.delete'),
  StaffController.deleteStaff
);

// Supporting Routes
router.get('/roles',
  requireRole(['super_admin', 'hr_admin']),
  requirePermission('roles.read'),
  StaffController.getRoles
);

router.get('/departments',
  requireRole(['super_admin', 'hr_admin', 'hr']),
  requirePermission('departments.read'),
  StaffController.getDepartments
);

router.get('/branches',
  requireRole(['super_admin', 'hr_admin', 'hr']),
  requirePermission('branches.read'),
  StaffController.getBranches
);

// Employee ID Generation
router.get('/employees/generate-id',
  requireRole(['super_admin', 'hr_admin']),
  requirePermission('staff.create'),
  StaffController.generateEmployeeId
);

// Email Validation
router.post('/employees/validate-email',
  requireRole(['super_admin', 'hr_admin']),
  requirePermission('staff.create'),
  StaffController.validateEmail
);

export default router;
```

---

## Controllers & Services

### Controller: `backend/src/controllers/staff.controller.ts`

```typescript
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { StaffService } from '../services/staff.service';
import { asyncHandler } from '../middleware/errorHandler';

export class StaffController {
  // Create new staff member
  static createStaff = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const staffData = req.body;
    const profilePicture = req.file;
    const createdBy = req.user!.userId;

    // Validate required fields
    const requiredFields = [
      'first_name', 'last_name', 'email', 'phone', 'position', 
      'department', 'hire_date', 'salary', 'role', 'branch_id'
    ];
    
    const missingFields = requiredFields.filter(field => !staffData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(staffData.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if email already exists
    const emailExists = await StaffService.checkEmailExists(staffData.email);
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Create staff member
    const result = await StaffService.createStaff(staffData, profilePicture, createdBy);

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: result
    });
  });

  // Get staff members with filtering
  static getStaff = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { search, department, branch_id, role, is_active, page = 1, limit = 10 } = req.query;
    
    const filters = {
      search: search as string,
      department: department as string,
      branch_id: branch_id as string,
      role: role as string,
      is_active: is_active as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await StaffService.getStaff(filters);
    
    res.json({
      success: true,
      data: result
    });
  });

  // Get specific staff member
  static getStaffById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const staff = await StaffService.getStaffById(id);
    
    res.json({
      success: true,
      data: staff
    });
  });

  // Update staff member
  static updateStaff = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const staffData = req.body;
    const profilePicture = req.file;
    const updatedBy = req.user!.userId;

    const result = await StaffService.updateStaff(id, staffData, profilePicture, updatedBy);
    
    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: result
    });
  });

  // Delete staff member
  static deleteStaff = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const deletedBy = req.user!.userId;

    await StaffService.deleteStaff(id, deletedBy);
    
    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  });

  // Get available roles
  static getRoles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const roles = await StaffService.getRoles();
    
    res.json({
      success: true,
      data: roles
    });
  });

  // Get departments
  static getDepartments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const departments = await StaffService.getDepartments();
    
    res.json({
      success: true,
      data: departments
    });
  });

  // Get branches
  static getBranches = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const branches = await StaffService.getBranches();
    
    res.json({
      success: true,
      data: branches
    });
  });

  // Generate employee ID
  static generateEmployeeId = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const employeeId = await StaffService.generateEmployeeId();
    
    res.json({
      success: true,
      data: { employee_id: employeeId }
    });
  });

  // Validate email
  static validateEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const exists = await StaffService.checkEmailExists(email);
    
    res.json({
      success: true,
      data: { 
        email,
        available: !exists 
      }
    });
  });
}
```

### Service: `backend/src/services/staff.service.ts`

```typescript
import { supabaseAdmin } from '../config/supabaseClient';
import { PasswordUtils } from '../utils/password';
import { EmailService } from '../services/email.service';
import { FileUploadService } from '../services/fileUpload.service';

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
      let profilePictureUrl = null;
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
          email_verified: false,
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
      throw new Error(`Failed to create staff member: ${error}`);
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
      throw new Error(`Failed to fetch staff: ${error}`);
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

      // Log the update
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: updatedBy,
          action: 'staff_updated',
          entity_type: 'staff',
          entity_id: id,
          new_values: updateData,
          created_at: new Date().toISOString()
        });

      return staff;
    } catch (error) {
      throw new Error(`Failed to update staff member: ${error}`);
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
          user_id: deletedBy,
          action: 'staff_deleted',
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
        .select('id, role_name, display_name, description')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      return roles || [];
    } catch (error) {
      throw new Error(`Failed to fetch roles: ${error}`);
    }
  }

  // Get departments
  static async getDepartments() {
    try {
      const { data: departments, error } = await supabaseAdmin
        .from('departments')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return departments || [];
    } catch (error) {
      throw new Error(`Failed to fetch departments: ${error}`);
    }
  }

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
      throw new Error(`Failed to fetch branches: ${error}`);
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
      throw new Error(`Failed to generate employee ID: ${error}`);
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
```

### Email Service: `backend/src/services/email.service.ts`

```typescript
import nodemailer from 'nodemailer';
import { config } from '../config/env';

export interface WelcomeEmailData {
  to: string;
  name: string;
  employeeId: string;
  password: string;
  position: string;
  department: string;
}

export class EmailService {
  private static transporter = nodemailer.createTransporter({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });

  static async sendWelcomeEmail(data: WelcomeEmailData) {
    try {
      const mailOptions = {
        from: config.SMTP_FROM,
        to: data.to,
        subject: 'Welcome to Agrivet - Your Account Details',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c5aa0;">Welcome to Agrivet, ${data.name}!</h2>
            
            <p>Your staff account has been successfully created. Here are your login details:</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c5aa0; margin-top: 0;">Account Information</h3>
              <p><strong>Employee ID:</strong> ${data.employeeId}</p>
              <p><strong>Email:</strong> ${data.to}</p>
              <p><strong>Temporary Password:</strong> ${data.password}</p>
              <p><strong>Position:</strong> ${data.position}</p>
              <p><strong>Department:</strong> ${data.department}</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="color: #856404; margin-top: 0;">Important Security Notice</h4>
              <p>For security reasons, please change your password immediately after your first login.</p>
            </div>
            
            <p>You can now log in to the system using your email and the temporary password provided above.</p>
            
            <p>If you have any questions or need assistance, please contact the HR department.</p>
            
            <p>Best regards,<br>Agrivet HR Team</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send welcome email');
    }
  }
}
```

### File Upload Service: `backend/src/services/fileUpload.service.ts`

```typescript
import { supabaseAdmin } from '../config/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export class FileUploadService {
  static async uploadProfilePicture(file: any, staffId: string) {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `profile_${staffId}_${uuidv4()}.${fileExtension}`;
      const filePath = `staff-profiles/${fileName}`;

      const { data, error } = await supabaseAdmin.storage
        .from('staff-files')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('staff-files')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      throw new Error(`Failed to upload profile picture: ${error}`);
    }
  }
}
```

---

## Authentication & Authorization

### Middleware Usage Examples

```typescript
// Example route with multiple middleware layers
router.post('/employees',
  authenticateToken,                    // 1. Verify JWT token
  requireRole(['super_admin', 'hr_admin']), // 2. Check user has required role
  requirePermission('staff.create'),    // 3. Check user has staff.create permission
  upload.single('profile_picture'),     // 4. Handle file upload
  StaffController.createStaff           // 5. Execute controller
);
```

### Permission Requirements

| Endpoint | Required Role | Required Permission |
|----------|---------------|-------------------|
| POST /employees | super_admin, hr_admin | staff.create |
| GET /employees | super_admin, hr_admin, hr | staff.read |
| GET /employees/:id | super_admin, hr_admin, hr | staff.read |
| PUT /employees/:id | super_admin, hr_admin | staff.update |
| DELETE /employees/:id | super_admin, hr_admin | staff.delete |
| GET /roles | super_admin, hr_admin | roles.read |
| GET /departments | super_admin, hr_admin, hr | departments.read |
| GET /branches | super_admin, hr_admin, hr | branches.read |

---

## Frontend Integration

### API Service: `frontend/src/services/staffService.ts`

```typescript
import { apiClient } from './apiClient';

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
```

### React Hook: `frontend/src/hooks/useStaff.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { StaffService, StaffFormData, StaffFilters } from '../services/staffService';

export const useStaff = (filters: StaffFilters = {}) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await StaffService.getStaff(filters);
      setStaff(response.data.staff);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const createStaff = async (formData: StaffFormData) => {
    try {
      setLoading(true);
      const response = await StaffService.createStaff(formData);
      await fetchStaff(); // Refresh the list
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create staff');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateStaff = async (id: string, formData: Partial<StaffFormData>) => {
    try {
      setLoading(true);
      const response = await StaffService.updateStaff(id, formData);
      await fetchStaff(); // Refresh the list
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update staff');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      setLoading(true);
      await StaffService.deleteStaff(id);
      await fetchStaff(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete staff');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    staff,
    loading,
    error,
    pagination,
    fetchStaff,
    createStaff,
    updateStaff,
    deleteStaff
  };
};
```

---

## Implementation Steps

### Step 1: Database Setup
1. Run the SQL migrations to update the staff table
2. Create the employee ID generation function
3. Create the audit logging functions
4. Test the database functions

### Step 2: Backend Implementation
1. Create the `StaffService` class
2. Create the `StaffController` class
3. Create the `EmailService` and `FileUploadService` classes
4. Create the `staff.routes.ts` file
5. Add the routes to your main router
6. Test all endpoints

### Step 3: Frontend Integration
1. Create the `staffService.ts` API service
2. Create the `useStaff.ts` React hook
3. Update your `AddStaff.tsx` component to use the new service
4. Add form validation and error handling
5. Add file upload functionality

### Step 4: Testing
1. Test staff creation with all fields
2. Test file upload functionality
3. Test email validation
4. Test role assignment
5. Test audit logging

### Step 5: Security & Performance
1. Add rate limiting for file uploads
2. Add file type validation
3. Add file size limits
4. Test with different user roles
5. Add proper error handling

---

## Additional Considerations

### File Upload Security
- Validate file types (images only)
- Limit file sizes (5MB max)
- Scan for malware (if needed)
- Store files in secure storage

### Email Configuration
- Configure SMTP settings
- Use email templates
- Handle email failures gracefully
- Add email delivery tracking

### Performance Optimization
- Add database indexes
- Implement caching for roles/departments
- Use database transactions
- Optimize file upload handling

### Security Enhancements
- Validate all input data
- Sanitize file names
- Use secure password generation
- Add audit logging for all actions

This implementation provides a complete staff creation system with automatic user account creation, email notifications, and file upload capabilities.
