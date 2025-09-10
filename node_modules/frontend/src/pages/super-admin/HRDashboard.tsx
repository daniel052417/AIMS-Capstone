import React, { useState } from 'react';
import { Users, UserPlus, Calendar, FileText, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected

const HRDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  // Static data for demonstration
  const hrMetrics = [
    {
      title: 'Total Employees',
      value: '156',
      change: '+8.2%',
      isPositive: true,
      icon: Users,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Active Employees',
      value: '142',
      change: '+3.1%',
      isPositive: true,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50'
    },
    {
      title: 'New Hires This Month',
      value: '12',
      change: '+50%',
      isPositive: true,
      icon: UserPlus,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      title: 'Attendance Rate',
      value: '94.2%',
      change: '+2.1%',
      isPositive: true,
      icon: Clock,
      color: 'text-orange-600 bg-orange-50'
    }
  ];

  const recentHires = [
    {
      id: 1,
      name: 'Maria Santos',
      position: 'Sales Associate',
      department: 'Sales',
      startDate: '2024-01-15',
      status: 'active',
      avatar: ''
    },
    {
      id: 2,
      name: 'John Dela Cruz',
      position: 'Inventory Clerk',
      department: 'Inventory',
      startDate: '2024-01-12',
      status: 'active',
      avatar: ''
    },
    {
      id: 3,
      name: 'Ana Rodriguez',
      position: 'Marketing Specialist',
      department: 'Marketing',
      startDate: '2024-01-10',
      status: 'active',
      avatar: ''
    },
    {
      id: 4,
      name: 'Carlos Mendoza',
      position: 'POS Cashier',
      department: 'POS',
      startDate: '2024-01-08',
      status: 'active',
      avatar: ''
    }
  ];

  const leaveRequests = [
    {
      id: 1,
      employee: 'Sarah Johnson',
      type: 'Vacation',
      startDate: '2024-01-20',
      endDate: '2024-01-25',
      days: 5,
      status: 'pending',
      reason: 'Family vacation'
    },
    {
      id: 2,
      employee: 'Michael Brown',
      type: 'Sick Leave',
      startDate: '2024-01-18',
      endDate: '2024-01-19',
      days: 2,
      status: 'approved',
      reason: 'Medical appointment'
    },
    {
      id: 3,
      employee: 'Lisa Garcia',
      type: 'Personal',
      startDate: '2024-01-22',
      endDate: '2024-01-22',
      days: 1,
      status: 'pending',
      reason: 'Personal matters'
    },
    {
      id: 4,
      employee: 'David Wilson',
      type: 'Vacation',
      startDate: '2024-01-25',
      endDate: '2024-01-30',
      days: 5,
      status: 'rejected',
      reason: 'Holiday trip'
    }
  ];

  const attendanceSummary = [
    {
      department: 'Sales',
      total: 25,
      present: 23,
      absent: 2,
      late: 3,
      attendanceRate: 92
    },
    {
      department: 'Inventory',
      total: 15,
      present: 15,
      absent: 0,
      late: 1,
      attendanceRate: 100
    },
    {
      department: 'Marketing',
      total: 12,
      present: 11,
      absent: 1,
      late: 2,
      attendanceRate: 91.7
    },
    {
      department: 'POS',
      total: 20,
      present: 19,
      absent: 1,
      late: 4,
      attendanceRate: 95
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'inactive':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'Vacation':
        return 'text-blue-600 bg-blue-50';
      case 'Sick Leave':
        return 'text-red-600 bg-red-50';
      case 'Personal':
        return 'text-purple-600 bg-purple-50';
      case 'Emergency':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
          <p className="text-gray-600">Human resources management and employee analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {hrMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${metric.color}`}>
                <metric.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-600">
                  {metric.change}
                </span>
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">{metric.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{metric.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Hires and Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Hires */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Hires</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {recentHires.map((hire) => (
              <div key={hire.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {hire.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{hire.name}</p>
                    <p className="text-xs text-gray-500">{hire.position} • {hire.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(hire.status)}`}>
                    {hire.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Started {hire.startDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Leave Requests</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {leaveRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{request.employee}</p>
                    <p className="text-xs text-gray-500">{request.startDate} - {request.endDate} ({request.days} days)</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLeaveTypeColor(request.type)}`}>
                    {request.type}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Attendance Summary by Department</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View Details</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Present
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Absent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Late
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceSummary.map((dept, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {dept.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dept.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dept.present}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dept.absent}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dept.late}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${dept.attendanceRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{dept.attendanceRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <UserPlus className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-900">Add Employee</p>
          </button>
          <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-900">Manage Leave</p>
          </button>
          <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-purple-900">Generate Report</p>
          </button>
          <button className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-orange-900">View Attendance</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;