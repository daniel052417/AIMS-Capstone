import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  RefreshCw,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

// TODO: Replace with actual API calls
const mockLeaveRequests: LeaveRequest[] = [
  {
    id: '1',
    staff_id: 'STF001',
    staff_name: 'Maria Santos',
    position: 'Sales Manager',
    department: 'Sales',
    leave_type: 'annual',
    start_date: '2024-01-20',
    end_date: '2024-01-25',
    days_requested: 5,
    reason: 'Family vacation',
    status: 'pending',
    approved_by: null,
    approved_date: null,
    emergency_contact: '+63 912 345 6789',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    staff_id: 'STF002',
    staff_name: 'Juan Dela Cruz',
    position: 'Cashier',
    department: 'POS',
    leave_type: 'sick',
    start_date: '2024-01-16',
    end_date: '2024-01-16',
    days_requested: 1,
    reason: 'Fever and cold',
    status: 'approved',
    approved_by: 'HR Manager',
    approved_date: '2024-01-15T14:30:00Z',
    emergency_contact: '+63 923 456 7890',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T14:30:00Z'
  },
  {
    id: '3',
    staff_id: 'STF003',
    staff_name: 'Ana Garcia',
    position: 'Inventory Clerk',
    department: 'Inventory',
    leave_type: 'personal',
    start_date: '2024-01-22',
    end_date: '2024-01-22',
    days_requested: 1,
    reason: 'Personal appointment',
    status: 'rejected',
    approved_by: 'HR Manager',
    approved_date: '2024-01-15T16:00:00Z',
    emergency_contact: '+63 934 567 8901',
    created_at: '2024-01-15T09:30:00Z',
    updated_at: '2024-01-15T16:00:00Z'
  },
  {
    id: '4',
    staff_id: 'STF004',
    staff_name: 'Carlos Martinez',
    position: 'Veterinarian',
    department: 'Veterinary',
    leave_type: 'maternity',
    start_date: '2024-02-01',
    end_date: '2024-05-01',
    days_requested: 90,
    reason: 'Maternity leave',
    status: 'approved',
    approved_by: 'HR Manager',
    approved_date: '2024-01-10T11:00:00Z',
    emergency_contact: '+63 945 678 9012',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T11:00:00Z'
  }
];

const mockLeaveBalances: LeaveBalance[] = [
  {
    staff_id: 'STF001',
    staff_name: 'Maria Santos',
    annual_leave: 15,
    sick_leave: 10,
    personal_leave: 5,
    used_annual: 3,
    used_sick: 1,
    used_personal: 0
  },
  {
    staff_id: 'STF002',
    staff_name: 'Juan Dela Cruz',
    annual_leave: 15,
    sick_leave: 10,
    personal_leave: 5,
    used_annual: 2,
    used_sick: 2,
    used_personal: 1
  },
  {
    staff_id: 'STF003',
    staff_name: 'Ana Garcia',
    annual_leave: 15,
    sick_leave: 10,
    personal_leave: 5,
    used_annual: 5,
    used_sick: 0,
    used_personal: 2
  },
  {
    staff_id: 'STF004',
    staff_name: 'Carlos Martinez',
    annual_leave: 15,
    sick_leave: 10,
    personal_leave: 5,
    used_annual: 0,
    used_sick: 0,
    used_personal: 0
  }
];

const mockLeaveStats: LeaveStats = {
  totalRequests: 24,
  pendingRequests: 8,
  approvedRequests: 12,
  rejectedRequests: 4,
  averageProcessingTime: 2.5,
  upcomingLeaves: 6
};

interface LeaveRequest {
  id: string;
  staff_id: string;
  staff_name: string;
  position: string;
  department: string;
  leave_type: 'annual' | 'sick' | 'personal' | 'emergency' | 'maternity' | 'paternity' | 'study' | 'bereavement';
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by: string | null;
  approved_date: string | null;
  emergency_contact: string | null;
  created_at: string;
  updated_at: string;
}

interface LeaveBalance {
  staff_id: string;
  staff_name: string;
  annual_leave: number;
  sick_leave: number;
  personal_leave: number;
  used_annual: number;
  used_sick: number;
  used_personal: number;
}

interface LeaveStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  averageProcessingTime: number;
  upcomingLeaves: number;
}

const LeaveManagement: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>(mockLeaveBalances);
  const [leaveStats, setLeaveStats] = useState<LeaveStats>(mockLeaveStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);

  // TODO: Replace with actual API calls
  const loadLeaveData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLeaveRequests(mockLeaveRequests);
      setLeaveBalances(mockLeaveBalances);
      setLeaveStats(mockLeaveStats);
    } catch (err) {
      setError('Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      // TODO: Implement actual approve API call
      console.log('Approve request:', requestId);
      await loadLeaveData();
    } catch (err) {
      setError('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      // TODO: Implement actual reject API call
      console.log('Reject request:', requestId);
      await loadLeaveData();
    } catch (err) {
      setError('Failed to reject request');
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'annual': return 'bg-blue-100 text-blue-800';
      case 'sick': return 'bg-red-100 text-red-800';
      case 'personal': return 'bg-purple-100 text-purple-800';
      case 'emergency': return 'bg-orange-100 text-orange-800';
      case 'maternity': return 'bg-pink-100 text-pink-800';
      case 'paternity': return 'bg-cyan-100 text-cyan-800';
      case 'study': return 'bg-green-100 text-green-800';
      case 'bereavement': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = request.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.staff_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.leave_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  useEffect(() => {
    loadLeaveData();
  }, []);

  const renderRequestsTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-blue-600">{leaveStats.totalRequests}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{leaveStats.pendingRequests}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{leaveStats.approvedRequests}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{leaveStats.rejectedRequests}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Processing</p>
              <p className="text-2xl font-bold text-purple-600">{leaveStats.averageProcessingTime}d</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-orange-600">{leaveStats.upcomingLeaves}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-500" />
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="annual">Annual</option>
              <option value="sick">Sick</option>
              <option value="personal">Personal</option>
              <option value="emergency">Emergency</option>
              <option value="maternity">Maternity</option>
              <option value="paternity">Paternity</option>
              <option value="study">Study</option>
              <option value="bereavement">Bereavement</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadLeaveData}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Leave Requests</h3>
            <button 
              onClick={() => setShowNewRequestForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Request
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
              <p className="text-gray-500">Loading leave requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No leave requests found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Staff</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Leave Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Dates</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Days</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reason</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRequests.map(request => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{request.staff_name}</p>
                        <p className="text-sm text-gray-500">{request.position} - {request.department}</p>
                        <p className="text-xs text-gray-400">ID: {request.staff_id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getLeaveTypeColor(request.leave_type)}`}>
                        {request.leave_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm">{new Date(request.start_date).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">to {new Date(request.end_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      <span className="font-medium">{request.days_requested} days</span>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      <p className="text-sm max-w-xs truncate">{request.reason}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                          {request.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveRequest(request.id)}
                              className="text-green-600 hover:text-green-800"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
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

  const renderBalancesTab = () => (
    <div className="space-y-6">
      {/* Leave Balances Table */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Leave Balances</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Staff</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Annual Leave</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sick Leave</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Personal Leave</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Available</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaveBalances.map(balance => (
                <tr key={balance.staff_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{balance.staff_name}</p>
                        <p className="text-sm text-gray-500">ID: {balance.staff_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">
                        {balance.annual_leave - balance.used_annual} / {balance.annual_leave}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${((balance.annual_leave - balance.used_annual) / balance.annual_leave) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">
                        {balance.sick_leave - balance.used_sick} / {balance.sick_leave}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${((balance.sick_leave - balance.used_sick) / balance.sick_leave) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">
                        {balance.personal_leave - balance.used_personal} / {balance.personal_leave}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${((balance.personal_leave - balance.used_personal) / balance.personal_leave) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <p className="text-lg font-bold text-gray-900">
                      {(balance.annual_leave - balance.used_annual) + 
                       (balance.sick_leave - balance.used_sick) + 
                       (balance.personal_leave - balance.used_personal)}
                    </p>
                    <p className="text-xs text-gray-500">days remaining</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
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
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-gray-600">Manage staff leave requests and balances</p>
            {loading && (
              <div className="flex items-center gap-2 mt-2">
                <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                <span className="text-sm text-blue-600">Loading...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={loadLeaveData}
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

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'requests', label: 'Leave Requests', icon: FileText },
              { id: 'balances', label: 'Leave Balances', icon: Users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'requests' && renderRequestsTab()}
          {activeTab === 'balances' && renderBalancesTab()}
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;