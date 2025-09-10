import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, XCircle, FileText, Search, Filter, Download } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected

const Claims: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Static data for demonstration
  const claimsMetrics = [
    {
      title: 'Total Claims',
      value: '156',
      change: '+12 this month',
      isPositive: true,
      icon: FileText,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Pending Claims',
      value: '23',
      change: '-5 this week',
      isPositive: true,
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-50'
    },
    {
      title: 'Approved Claims',
      value: '98',
      change: '+8 this month',
      isPositive: true,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50'
    },
    {
      title: 'Rejected Claims',
      value: '35',
      change: '+2 this month',
      isPositive: false,
      icon: XCircle,
      color: 'text-red-600 bg-red-50'
    }
  ];

  const claims = [
    {
      id: 1,
      customer: 'Maria Santos',
      orderNumber: 'ORD-2024-001',
      type: 'Product Defect',
      description: 'Damaged product received',
      amount: 2500,
      status: 'pending',
      submittedDate: '2024-01-15',
      priority: 'high',
      assignedTo: 'John Dela Cruz',
      resolution: null
    },
    {
      id: 2,
      customer: 'Carlos Mendoza',
      orderNumber: 'ORD-2024-002',
      type: 'Wrong Item',
      description: 'Received wrong product',
      amount: 1800,
      status: 'approved',
      submittedDate: '2024-01-14',
      priority: 'medium',
      assignedTo: 'Ana Rodriguez',
      resolution: 'Refund processed'
    },
    {
      id: 3,
      customer: 'Lisa Garcia',
      orderNumber: 'ORD-2024-003',
      type: 'Late Delivery',
      description: 'Order delivered 3 days late',
      amount: 500,
      status: 'approved',
      submittedDate: '2024-01-13',
      priority: 'low',
      assignedTo: 'Michael Brown',
      resolution: 'Compensation provided'
    },
    {
      id: 4,
      customer: 'David Wilson',
      orderNumber: 'ORD-2024-004',
      type: 'Product Defect',
      description: 'Product not working as expected',
      amount: 3200,
      status: 'rejected',
      submittedDate: '2024-01-12',
      priority: 'high',
      assignedTo: 'Sarah Johnson',
      resolution: 'Customer error - no refund'
    },
    {
      id: 5,
      customer: 'Ana Rodriguez',
      orderNumber: 'ORD-2024-005',
      type: 'Missing Item',
      description: 'One item missing from order',
      amount: 1200,
      status: 'pending',
      submittedDate: '2024-01-11',
      priority: 'medium',
      assignedTo: 'John Dela Cruz',
      resolution: null
    },
    {
      id: 6,
      customer: 'Michael Brown',
      orderNumber: 'ORD-2024-006',
      type: 'Wrong Item',
      description: 'Received different product',
      amount: 950,
      status: 'approved',
      submittedDate: '2024-01-10',
      priority: 'low',
      assignedTo: 'Ana Rodriguez',
      resolution: 'Replacement sent'
    }
  ];

  const claimTypes = [
    { type: 'Product Defect', count: 45, percentage: 28.8 },
    { type: 'Wrong Item', count: 38, percentage: 24.4 },
    { type: 'Late Delivery', count: 32, percentage: 20.5 },
    { type: 'Missing Item', count: 25, percentage: 16.0 },
    { type: 'Damaged Packaging', count: 16, percentage: 10.3 }
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Claim Approved',
      claim: 'ORD-2024-002',
      customer: 'Carlos Mendoza',
      timestamp: '2024-01-15 14:30',
      user: 'Ana Rodriguez'
    },
    {
      id: 2,
      action: 'Claim Rejected',
      claim: 'ORD-2024-004',
      customer: 'David Wilson',
      timestamp: '2024-01-15 11:15',
      user: 'Sarah Johnson'
    },
    {
      id: 3,
      action: 'New Claim Submitted',
      claim: 'ORD-2024-001',
      customer: 'Maria Santos',
      timestamp: '2024-01-15 09:45',
      user: 'System'
    },
    {
      id: 4,
      action: 'Claim Assigned',
      claim: 'ORD-2024-005',
      customer: 'Ana Rodriguez',
      timestamp: '2024-01-14 16:20',
      user: 'John Dela Cruz'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'in-progress':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'in-progress':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const filteredClaims = claims.filter(claim => {
    const matchesStatus = selectedStatus === 'all' || claim.status === selectedStatus;
    const matchesType = selectedType === 'all' || claim.type === selectedType;
    const matchesSearch = searchTerm === '' || 
      claim.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Claims Management</h1>
          <p className="text-gray-600">Manage customer claims and returns</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>New Claim</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {claimsMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${metric.color}`}>
                <metric.icon className="w-6 h-6" />
              </div>
              <div className="text-sm text-gray-500">
                {metric.change}
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">{metric.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{metric.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search claims..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="in-progress">In Progress</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="Product Defect">Product Defect</option>
              <option value="Wrong Item">Wrong Item</option>
              <option value="Late Delivery">Late Delivery</option>
              <option value="Missing Item">Missing Item</option>
              <option value="Damaged Packaging">Damaged Packaging</option>
            </select>
          </div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Claims ({filteredClaims.length})</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Export</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Claim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{claim.orderNumber}</div>
                      <div className="text-sm text-gray-500">{claim.submittedDate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {claim.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {claim.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(claim.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(claim.status)}`}>
                      <span className="flex items-center space-x-1">
                        {getStatusIcon(claim.status)}
                        <span>{claim.status}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(claim.priority)}`}>
                      {claim.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {claim.assignedTo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-700">View</button>
                      <button className="text-green-600 hover:text-green-700">Approve</button>
                      <button className="text-red-600 hover:text-red-700">Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claim Types and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Claim Types Distribution</h3>
          <div className="space-y-4">
            {claimTypes.map((type, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{type.type}</p>
                  <p className="text-xs text-gray-500">{type.count} claims</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{type.percentage}%</p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${type.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">
                    {activity.claim} • {activity.customer} • {activity.timestamp}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  {activity.user}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-900">New Claim</p>
          </button>
          <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-900">Bulk Approve</p>
          </button>
          <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <Filter className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-purple-900">Advanced Filter</p>
          </button>
          <button className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <Download className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-orange-900">Export Report</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Claims;

