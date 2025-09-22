import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Calendar,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  RefreshCw,
  MapPin,
  Timer,
  LogOut,
  Coffee,
  Activity
} from 'lucide-react';

// TODO: Replace with actual API calls
const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: '1',
    staff_id: 'STF001',
    staff_name: 'Maria Santos',
    position: 'Sales Manager',
    department: 'Sales',
    attendance_date: '2024-01-15',
    time_in: '08:00:00',
    time_out: '17:00:00',
    break_start: '12:00:00',
    break_end: '13:00:00',
    total_hours: 8.0,
    overtime_hours: 0.0,
    status: 'present',
    notes: 'On time',
    location: 'Main Branch',
    created_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '2',
    staff_id: 'STF002',
    staff_name: 'Juan Dela Cruz',
    position: 'Cashier',
    department: 'POS',
    attendance_date: '2024-01-15',
    time_in: '07:45:00',
    time_out: '16:45:00',
    break_start: '12:00:00',
    break_end: '13:00:00',
    total_hours: 8.0,
    overtime_hours: 0.0,
    status: 'present',
    notes: 'Early arrival',
    location: 'Main Branch',
    created_at: '2024-01-15T07:45:00Z'
  },
  {
    id: '3',
    staff_id: 'STF003',
    staff_name: 'Ana Garcia',
    position: 'Inventory Clerk',
    department: 'Inventory',
    attendance_date: '2024-01-15',
    time_in: '08:15:00',
    time_out: '17:15:00',
    break_start: '12:00:00',
    break_end: '13:00:00',
    total_hours: 8.0,
    overtime_hours: 0.25,
    status: 'late',
    notes: 'Late arrival due to traffic',
    location: 'Main Branch',
    created_at: '2024-01-15T08:15:00Z'
  },
  {
    id: '4',
    staff_id: 'STF004',
    staff_name: 'Carlos Martinez',
    position: 'Veterinarian',
    department: 'Veterinary',
    attendance_date: '2024-01-15',
    time_in: null,
    time_out: null,
    break_start: null,
    break_end: null,
    total_hours: 0,
    overtime_hours: 0,
    status: 'absent',
    notes: 'Sick leave',
    location: null,
    created_at: '2024-01-15T00:00:00Z'
  }
];

const mockAttendanceStats: AttendanceStats = {
  totalStaff: 25,
  presentToday: 20,
  absentToday: 3,
  lateToday: 2,
  averageHours: 7.8,
  overtimeHours: 12.5
};

interface AttendanceRecord {
  id: string;
  staff_id: string;
  staff_name: string;
  position: string;
  department: string;
  attendance_date: string;
  time_in: string | null;
  time_out: string | null;
  break_start: string | null;
  break_end: string | null;
  total_hours: number | null;
  overtime_hours: number | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  notes: string | null;
  location: string | null;
  created_at: string;
}

interface AttendanceStats {
  totalStaff: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  averageHours: number;
  overtimeHours: number;
}

const AttendanceDashboard: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>(mockAttendanceStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // TODO: Replace with actual API calls
  const loadAttendanceData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAttendanceRecords(mockAttendanceRecords);
      setAttendanceStats(mockAttendanceStats);
    } catch (err) {
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async (staffId: string) => {
    try {
      // TODO: Implement actual clock in API call
      console.log('Clock in for staff:', staffId);
      await loadAttendanceData();
    } catch (err) {
      setError('Failed to clock in');
    }
  };

  const handleClockOut = async (staffId: string) => {
    try {
      // TODO: Implement actual clock out API call
      console.log('Clock out for staff:', staffId);
      await loadAttendanceData();
    } catch (err) {
      setError('Failed to clock out');
    }
  };

  const handleBreakStart = async (staffId: string) => {
    try {
      // TODO: Implement actual break start API call
      console.log('Break start for staff:', staffId);
      await loadAttendanceData();
    } catch (err) {
      setError('Failed to start break');
    }
  };

  const handleBreakEnd = async (staffId: string) => {
    try {
      // TODO: Implement actual break end API call
      console.log('Break end for staff:', staffId);
      await loadAttendanceData();
    } catch (err) {
      setError('Failed to end break');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'absent': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'late': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'half_day': return <Clock className="w-5 h-5 text-orange-600" />;
      case 'on_leave': return <Calendar className="w-5 h-5 text-blue-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'half_day': return 'bg-orange-100 text-orange-800';
      case 'on_leave': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.staff_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || record.department === departmentFilter;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  useEffect(() => {
    loadAttendanceData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Dashboard</h1>
            <p className="text-gray-600">Track and manage staff attendance</p>
            {loading && (
              <div className="flex items-center gap-2 mt-2">
                <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                <span className="text-sm text-blue-600">Loading...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={loadAttendanceData}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
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

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-blue-600">{attendanceStats.totalStaff}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Present Today</p>
              <p className="text-2xl font-bold text-green-600">{attendanceStats.presentToday}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Absent Today</p>
              <p className="text-2xl font-bold text-red-600">{attendanceStats.absentToday}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Late Today</p>
              <p className="text-2xl font-bold text-yellow-600">{attendanceStats.lateToday}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Hours</p>
              <p className="text-2xl font-bold text-purple-600">{attendanceStats.averageHours}h</p>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overtime</p>
              <p className="text-2xl font-bold text-orange-600">{attendanceStats.overtimeHours}h</p>
            </div>
            <Activity className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half_day">Half Day</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Departments</option>
              <option value="Sales">Sales</option>
              <option value="POS">POS</option>
              <option value="Inventory">Inventory</option>
              <option value="Veterinary">Veterinary</option>
              <option value="HR">HR</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Attendance Records</h3>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
              <p className="text-gray-500">Loading attendance records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No attendance records found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Staff</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Time In</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Time Out</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Break</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Hours</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{record.staff_name}</p>
                        <p className="text-sm text-gray-500">{record.position} - {record.department}</p>
                        <p className="text-xs text-gray-400">ID: {record.staff_id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {record.time_in ? (
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-green-600" />
                          <span>{record.time_in}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {record.time_out ? (
                        <div className="flex items-center gap-2">
                          <LogOut className="h-4 w-4 text-red-600" />
                          <span>{record.time_out}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {record.break_start && record.break_end ? (
                        <div className="flex items-center gap-2">
                          <Coffee className="h-4 w-4 text-orange-600" />
                          <span>{record.break_start} - {record.break_end}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      <div>
                        <span className="font-medium">{record.total_hours || 0}h</span>
                        {record.overtime_hours && record.overtime_hours > 0 && (
                          <span className="text-xs text-orange-600 ml-1">(+{record.overtime_hours}h OT)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(record.status)}`}>
                          {record.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {record.location ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{record.location}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!record.time_in && (
                          <button
                            onClick={() => handleClockIn(record.staff_id)}
                            className="text-green-600 hover:text-green-800"
                            title="Clock In"
                          >
                            <Timer className="h-4 w-4" />
                          </button>
                        )}
                        {record.time_in && !record.time_out && (
                          <button
                            onClick={() => handleClockOut(record.staff_id)}
                            className="text-red-600 hover:text-red-800"
                            title="Clock Out"
                          >
                            <LogOut className="h-4 w-4" />
                          </button>
                        )}
                        <button className="text-blue-600 hover:text-blue-800" title="View Details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-800" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard;