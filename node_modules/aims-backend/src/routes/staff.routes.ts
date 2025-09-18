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
// Supporting Routes (static paths first)
router.get('/roles',
    requireRole(['super_admin', 'hr_admin']),
    requirePermission('roles.read'),
    StaffController.getRoles
  );
  
//   router.get('/departments',
//     requireRole(['super_admin', 'hr_admin', 'hr']),
//     requirePermission('departments.read'),
//     StaffController.getDepartments
//   );
  
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
  
  // Employee CRUD routes
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
  
  // Dynamic employee routes (by ID)
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
  
export default router;