"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const adminController = __importStar(require("../controllers/hr/admin.controller"));
const staffController = __importStar(require("../controllers/hr/staff.controller"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/admin/dashboard', (0, auth_1.requireRole)(['super_admin', 'hr_admin']), (0, errorHandler_1.asyncHandler)(adminController.getDashboard));
router.get('/admin/employees', (0, auth_1.requireRole)(['super_admin', 'hr_admin']), (0, errorHandler_1.asyncHandler)(adminController.getEmployees));
router.get('/admin/employees/:id', (0, auth_1.requireRole)(['super_admin', 'hr_admin']), (0, errorHandler_1.asyncHandler)(adminController.getEmployeeById));
router.post('/admin/employees', (0, auth_1.requireRole)(['super_admin', 'hr_admin']), (0, errorHandler_1.asyncHandler)(adminController.createEmployee));
router.put('/admin/employees/:id', (0, auth_1.requireRole)(['super_admin', 'hr_admin']), (0, errorHandler_1.asyncHandler)(adminController.updateEmployee));
router.delete('/admin/employees/:id', (0, auth_1.requireRole)(['super_admin', 'hr_admin']), (0, errorHandler_1.asyncHandler)(adminController.deleteEmployee));
router.get('/admin/attendance', (0, auth_1.requireRole)(['super_admin', 'hr_admin']), (0, errorHandler_1.asyncHandler)(adminController.getAttendanceRecords));
router.post('/admin/attendance', (0, auth_1.requireRole)(['super_admin', 'hr_admin']), (0, errorHandler_1.asyncHandler)(adminController.createAttendanceRecord));
router.put('/admin/attendance/:id', (0, auth_1.requireRole)(['super_admin', 'hr_admin']), (0, errorHandler_1.asyncHandler)(adminController.updateAttendanceRecord));
router.get('/admin/leaves', (0, auth_1.requireRole)(['super_admin', 'hr_admin']), (0, errorHandler_1.asyncHandler)(adminController.getLeaveRequests));
router.put('/admin/leaves/:id/approve', (0, auth_1.requireRole)(['super_admin', 'hr_admin']), (0, errorHandler_1.asyncHandler)(adminController.approveLeaveRequest));
router.put('/admin/leaves/:id/reject', (0, auth_1.requireRole)(['super_admin', 'hr_admin']), (0, errorHandler_1.asyncHandler)(adminController.rejectLeaveRequest));
router.get('/admin/payroll', (0, auth_1.requireRole)(['super_admin', 'hr_admin']), (0, errorHandler_1.asyncHandler)(adminController.getPayrollRecords));
router.post('/admin/payroll', (0, auth_1.requireRole)(['super_admin', 'hr_admin']), (0, errorHandler_1.asyncHandler)(adminController.createPayrollRecord));
router.put('/admin/payroll/:id', (0, auth_1.requireRole)(['super_admin', 'hr_admin']), (0, errorHandler_1.asyncHandler)(adminController.updatePayrollRecord));
router.get('/staff/profile', (0, auth_1.requireRole)(['staff']), (0, errorHandler_1.asyncHandler)(staffController.getProfile));
router.put('/staff/profile', (0, auth_1.requireRole)(['staff']), (0, errorHandler_1.asyncHandler)(staffController.updateProfile));
router.get('/staff/attendance', (0, auth_1.requireRole)(['staff']), (0, errorHandler_1.asyncHandler)(staffController.getMyAttendance));
router.post('/staff/attendance/clock-in', (0, auth_1.requireRole)(['staff']), (0, errorHandler_1.asyncHandler)(staffController.clockIn));
router.post('/staff/attendance/clock-out', (0, auth_1.requireRole)(['staff']), (0, errorHandler_1.asyncHandler)(staffController.clockOut));
router.get('/staff/leaves', (0, auth_1.requireRole)(['staff']), (0, errorHandler_1.asyncHandler)(staffController.getMyLeaves));
router.post('/staff/leaves', (0, auth_1.requireRole)(['staff']), (0, errorHandler_1.asyncHandler)(staffController.createLeaveRequest));
router.put('/staff/leaves/:id', (0, auth_1.requireRole)(['staff']), (0, errorHandler_1.asyncHandler)(staffController.updateLeaveRequest));
router.delete('/staff/leaves/:id', (0, auth_1.requireRole)(['staff']), (0, errorHandler_1.asyncHandler)(staffController.cancelLeaveRequest));
router.get('/staff/payroll', (0, auth_1.requireRole)(['staff']), (0, errorHandler_1.asyncHandler)(staffController.getMyPayroll));
exports.default = router;
//# sourceMappingURL=hr.routes.js.map