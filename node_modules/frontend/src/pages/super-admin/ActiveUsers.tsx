import React, { useState } from 'react';
import { Search, Filter, Eye, User, Clock, Activity, MapPin, Monitor } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected

const ActiveUsers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Static data for demonstration
  const activeUsers = [
    {
      id: '1',
      name: 'Maria Santos',
      email: 'maria.santos@agrivet.com',
      role: 'admin',
      status: 'online',
      lastActivity: '2 minutes ago',
      currentPage: 'Dashboard',
      ipAddress: '192.168.1.100',
      location: 'Office - Main Branch',
      device: 'Windows 10 - Chrome',
      sessionDuration: '2h 15m',
      loginTime: '2024-01-15 08:30 AM'
    },
    {
      id: '2',
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@agrivet.com',
      role: 'hr',
      status: 'online',
      lastActivity: '5 minutes ago',
      currentPage: 'User Management',
      ipAddress: '192.168.1.101',
      location: 'Office - Main Branch',
      device: 'Windows 10 - Firefox',
      sessionDuration: '1h 45m',
      loginTime: '2024-01-15 09:00 AM'
    },
    {
      id: '3',
      name: 'Ana Rodriguez',
      email: 'ana.rodriguez@agrivet.com',
      role: 'marketing',
      status: 'online',
      lastActivity: '1 minute ago',
      currentPage: 'Campaign Management',
      ipAddress: '192.168.1.102',
      location: 'Remote - Home Office',
      device: 'MacOS - Safari',
      sessionDuration: '3h 20m',
      loginTime: '2024-01-15 07:45 AM'
    },
    {
      id: '4',
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@agrivet.com',
      role: 'cashier',
      status: 'online',
      lastActivity: '30 seconds ago',
      currentPage: 'POS System',
      ipAddress: '192.168.1.103',
      location: 'Store - Downtown Branch',
      device: 'Windows 10 - Chrome',
      sessionDuration: '4h 10m',
      loginTime: '2024-01-15 06:30 AM'
    },
    {
      id: '5',
      name: 'Elena Garcia',
      email: 'elena.garcia@agrivet.com',
      role: 'inventory',
      status: 'away',
      lastActivity: '15 minutes ago',
      currentPage: 'Inventory Management',
      ipAddress: '192.168.1.104',
      location: 'Office - Main Branch',
      device: 'Windows 10 - Edge',
      sessionDuration: '2h 30m',
      loginTime: '2024-01-15 08:15 AM'
    },
    {
      id: '6',
      name: 'Pedro Santos',
      email: 'pedro.santos@agrivet.com',
      role: 'staff',
      status: 'offline',
      lastActivity: '2 hours ago',
      currentPage: 'Reports',
      ipAddress: '192.168.1.105',
      location: 'Office - Main Branch',
      device: 'Windows 10 - Chrome',
      sessionDuration: '0m',
      loginTime: '2024-01-15 06:00 AM'
    }
  ];

  const roles = ['all', 'admin', 'hr', 'marketing', 'cashier', 'inventory', 'staff'];
  const statuses = ['all', 'online', 'away', 'offline'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-50';
      case 'away':
        return 'text-yellow-600 bg-yellow-50';
      case 'offline':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'away':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      case 'offline':
        return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-600 bg-red-50';
      case 'hr':
        return 'text-blue-600 bg-blue-50';
      case 'marketing':
        return 'text-green-600 bg-green-50';
      case 'cashier':
        return 'text-purple-600 bg-purple-50';
      case 'inventory':
        return 'text-orange-600 bg-orange-50';
      case 'staff':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredUsers = activeUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Users</h1>
          <p className="text-gray-600">Monitor currently active and recently active users</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Activity className="w-4 h-4" />
          <span>Live monitoring</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{activeUsers.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Online Now</p>
              <p className="text-2xl font-bold text-green-600">{activeUsers.filter(u => u.status === 'online').length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Away</p>
              <p className="text-2xl font-bold text-yellow-600">{activeUsers.filter(u => u.status === 'away').length}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Offline</p>
              <p className="text-2xl font-bold text-gray-600">{activeUsers.filter(u => u.status === 'offline').length}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {roles.map(role => (
                <option key={role} value={role}>
                  {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(user.status)}
                      <span className={`text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-700">
                <Eye className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Current Page</span>
                <span className="text-sm font-medium text-gray-900">{user.currentPage}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Last Activity</span>
                <span className="text-sm font-medium text-gray-900">{user.lastActivity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Session Duration</span>
                <span className="text-sm font-medium text-gray-900">{user.sessionDuration}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Login Time</span>
                <span className="text-sm font-medium text-gray-900">{user.loginTime}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{user.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Monitor className="w-3 h-3" />
                  <span>{user.device}</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                IP: {user.ipAddress}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
        </div>
      )}
    </div>
  );
};

export default ActiveUsers;