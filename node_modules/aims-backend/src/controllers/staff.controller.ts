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
      'department', 'hire_date', 'salary', 'role', 'branch_id', 'address'
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
//   static getDepartments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
//     const departments = await StaffService.getDepartments();
    
//     res.json({
//       success: true,
//       data: departments
//     });
//   });

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