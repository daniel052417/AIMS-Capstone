import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Calendar,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Target
} from 'lucide-react';

const HRAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attendanceStats = {
    totalStaff: 25,
    averageAttendance: 94.2,
    lateArrivals: 8,
    earlyDepartures: 3,
    overtimeHours: 45.5,
    absentDays: 12,
    presentDays: 188
  };

  const leaveStats = {
    totalRequests: 24,
    approvedRequests: 18,
    rejectedRequests: 4,
    pendingRequests: 2,
    averageProcessingTime: 2.5,
    mostCommonLeaveType: 'Annual Leave',
    peakLeavePeriod: 'December'
  };

  const departmentStats = [
    { department: 'Sales', staffCount: 8, averageAttendance: 96.5, totalOvertime: 15.5, leaveRequests: 6 },
    { department: 'POS', staffCount: 5, averageAttendance: 92.8, totalOvertime: 8.2, leaveRequests: 4 },
    { department: 'Inventory', staffCount: 4, averageAttendance: 95.1, totalOvertime: 12.3, leaveRequests: 3 },
    { department: 'Veterinary', staffCount: 6, averageAttendance: 93.7, totalOvertime: 9.5, leaveRequests: 8 },
    { department: 'HR', staffCount: 2, averageAttendance: 98.0, totalOvertime: 0, leaveRequests: 3 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HR Analytics</h1>
            <p className="text-gray-600">Comprehensive insights into attendance, leave, and workforce analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Overview */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-600" />
            Attendance Overview
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{attendanceStats.totalStaff}</p>
              <p className="text-sm text-gray-600">Total Staff</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{attendanceStats.averageAttendance}%</p>
              <p className="text-sm text-gray-600">Avg Attendance</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{attendanceStats.lateArrivals}</p>
              <p className="text-sm text-gray-600">Late Arrivals</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{attendanceStats.earlyDepartures}</p>
              <p className="text-sm text-gray-600">Early Departures</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{attendanceStats.overtimeHours}h</p>
              <p className="text-sm text-gray-600">Overtime Hours</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">{attendanceStats.absentDays}</p>
              <p className="text-sm text-gray-600">Absent Days</p>
            </div>
            <div className="text-center p-4 bg-cyan-50 rounded-lg">
              <Target className="h-8 w-8 text-cyan-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-cyan-600">{attendanceStats.presentDays}</p>
              <p className="text-sm text-gray-600">Present Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Analytics */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-green-600" />
            Leave Analytics
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{leaveStats.totalRequests}</p>
              <p className="text-sm text-gray-600">Total Requests</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{leaveStats.approvedRequests}</p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{leaveStats.rejectedRequests}</p>
              <p className="text-sm text-gray-600">Rejected</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{leaveStats.pendingRequests}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{leaveStats.averageProcessingTime}d</p>
              <p className="text-sm text-gray-600">Avg Processing</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <BarChart3 className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-lg font-bold text-orange-600">{leaveStats.mostCommonLeaveType}</p>
              <p className="text-sm text-gray-600">Most Common</p>
            </div>
            <div className="text-center p-4 bg-cyan-50 rounded-lg">
              <Calendar className="h-8 w-8 text-cyan-600 mx-auto mb-2" />
              <p className="text-lg font-bold text-cyan-600">{leaveStats.peakLeavePeriod}</p>
              <p className="text-sm text-gray-600">Peak Period</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Performance */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            Department Performance
          </h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Department</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Staff Count</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Avg Attendance</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Overtime Hours</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Leave Requests</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {departmentStats.map((dept, index) => (
                  <tr key={dept.department} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{dept.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{dept.staffCount}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{dept.averageAttendance}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">{dept.totalOvertime}h</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{dept.leaveRequests}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRAnalytics;