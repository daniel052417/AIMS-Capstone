import { Router } from 'express';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as adminController from '../controllers/hr/admin.controller';
import * as staffController from '../controllers/hr/staff.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Admin HR routes
router.get('/admin/dashboard', 
  requireRole(['super_admin', 'hr_admin']), 
  asyncHandler(adminController.getDashboard),
);

router.get('/admin/employees', 
  requireRole(['super_admin', 'hr_admin']), 
  asyncHandler(adminController.getEmployees),
);

router.get('/admin/employees/:id', 
  requireRole(['super_admin', 'hr_admin']), 
  asyncHandler(adminController.getEmployeeById),
);

router.post('/admin/employees', 
  requireRole(['super_admin', 'hr_admin']), 
  asyncHandler(adminController.createEmployee),
);

router.put('/admin/employees/:id', 
  requireRole(['super_admin', 'hr_admin']), 
  asyncHandler(adminController.updateEmployee),
);

router.delete('/admin/employees/:id', 
  requireRole(['super_admin', 'hr_admin']), 
  asyncHandler(adminController.deleteEmployee),
);

// Attendance management
router.get('/admin/attendance', 
  requireRole(['super_admin', 'hr_admin']), 
  asyncHandler(adminController.getAttendanceRecords),
);

router.post('/admin/attendance', 
  requireRole(['super_admin', 'hr_admin']), 
  asyncHandler(adminController.createAttendanceRecord),
);

router.put('/admin/attendance/:id', 
  requireRole(['super_admin', 'hr_admin']), 
  asyncHandler(adminController.updateAttendanceRecord),
);

// Leave management
router.get('/admin/leaves', 
  requireRole(['super_admin', 'hr_admin']), 
  asyncHandler(adminController.getLeaveRequests),
);

router.put('/admin/leaves/:id/approve', 
  requireRole(['super_admin', 'hr_admin']), 
  asyncHandler(adminController.approveLeaveRequest),
);

router.put('/admin/leaves/:id/reject', 
  requireRole(['super_admin', 'hr_admin']), 
  asyncHandler(adminController.rejectLeaveRequest),
);

// Payroll management
router.get('/admin/payroll', 
  requireRole(['super_admin', 'hr_admin']), 
  asyncHandler(adminController.getPayrollRecords),
);

router.post('/admin/payroll', 
  requireRole(['super_admin', 'hr_admin']), 
  asyncHandler(adminController.createPayrollRecord),
);

router.put('/admin/payroll/:id', 
  requireRole(['super_admin', 'hr_admin']), 
  asyncHandler(adminController.updatePayrollRecord),
);

// Staff HR routes
router.get('/staff/profile', 
  requireRole(['staff']), 
  asyncHandler(staffController.getProfile),
);

router.put('/staff/profile', 
  requireRole(['staff']), 
  asyncHandler(staffController.updateProfile),
);

router.get('/staff/attendance', 
  requireRole(['staff']), 
  asyncHandler(staffController.getMyAttendance),
);

router.post('/staff/attendance/clock-in', 
  requireRole(['staff']), 
  asyncHandler(staffController.clockIn),
);

router.post('/staff/attendance/clock-out', 
  requireRole(['staff']), 
  asyncHandler(staffController.clockOut),
);

router.get('/staff/leaves', 
  requireRole(['staff']), 
  asyncHandler(staffController.getMyLeaves),
);

router.post('/staff/leaves', 
  requireRole(['staff']), 
  asyncHandler(staffController.createLeaveRequest),
);

router.put('/staff/leaves/:id', 
  requireRole(['staff']), 
  asyncHandler(staffController.updateLeaveRequest),
);

router.delete('/staff/leaves/:id', 
  requireRole(['staff']), 
  asyncHandler(staffController.cancelLeaveRequest),
);

router.get('/staff/payroll', 
  requireRole(['staff']), 
  asyncHandler(staffController.getMyPayroll),
);

export default router;

