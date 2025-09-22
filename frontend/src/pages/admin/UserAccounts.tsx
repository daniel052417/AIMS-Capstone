import React, { useState, useEffect } from 'react';
// value imports (icons)
import { Search, Filter, Plus, Edit, Trash2, Eye, User as UserIcon, Phone, Shield } from 'lucide-react';

// service (value) + types
import { UserService } from '../../services/userService';
import type { User, UserStats } from '../../services/userService';

// Dynamic components
import { Can } from '../../components/Can';
import { FallbackUI, TableSkeleton } from '../../components/FallbackUI';

const UserAccounts: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Static data for demonstration
  // Load users and stats
  useEffect(() => {
    loadUsers();
    loadStats();
  }, [searchTerm, selectedRole, selectedStatus, pagination.page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await UserService.getUsers({
        search: searchTerm,
        role: selectedRole === 'all' ? '' : selectedRole,
        status: selectedStatus === 'all' ? '' : selectedStatus,
        page: pagination.page,
        limit: pagination.limit
      });
      
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await UserService.getUserStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // const handleActivateUser = async (id: string) => {
  //   try {
  //     await UserService.activateUser(id);
  //     loadUsers();
  //     loadStats();
  //   } catch (error) {
  //     console.error('Failed to activate user:', error);
  //   }
  // };

  // const handleDeactivateUser = async (id: string) => {
  //   try {
  //     await UserService.deactivateUser(id);
  //     loadUsers();
  //     loadStats();
  //   } catch (error) {
  //     console.error('Failed to deactivate user:', error);
  //   }
  // };

  const roles = ['all', 'admin', 'hr', 'marketing', 'cashier', 'inventory'];
  const statuses = ['all', 'active', 'inactive'];

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
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'inactive':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.roles.some(role => role.role_name === selectedRole);
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Accounts</h1>
          <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
        </div>
        <Can
          permission="users.create"
          as="button"
          buttonProps={{
            className: "flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          }}
          fallback={
            <FallbackUI 
              type="permission" 
              message="You need permission to add users" 
              size="sm"
            />
          }
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </Can>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users by name or email..."
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

      {/* Users Table */}
      <Can
        permissions={['users.read']}
        fallback={
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <FallbackUI 
              type="permission" 
              message="You don't have permission to view users" 
              size="lg"
            />
          </div>
        }
        loadingComponent={
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <TableSkeleton rows={5} columns={6} />
          </div>
        }
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.first_name + ' ' + user.last_name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.first_name + ' ' + user.last_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.roles.map(role => role.name).join(', '))}`}>
                      {user.roles.map(role => role.name).join(', ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status || '')}`}>
                    {(user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Unknown')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{user.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.last_login}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Can
                        permission="users.read"
                        as="button"
                        buttonProps={{
                          className: "text-blue-600 hover:text-blue-900"
                        }}
                        fallback={null}
                      >
                        <Eye className="w-4 h-4" />
                      </Can>
                      <Can
                        permission="users.update"
                        as="button"
                        buttonProps={{
                          className: "text-green-600 hover:text-green-900"
                        }}
                        fallback={null}
                      >
                        <Edit className="w-4 h-4" />
                      </Can>
                      <Can
                        permission="users.manage_roles"
                        as="button"
                        buttonProps={{
                          className: "text-purple-600 hover:text-purple-900"
                        }}
                        fallback={null}
                      >
                        <Shield className="w-4 h-4" />
                      </Can>
                      <Can
                        permission="users.delete"
                        as="button"
                        buttonProps={{
                          className: "text-red-600 hover:text-red-900"
                        }}
                        fallback={null}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Can>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </Can>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{users.filter(u => u.status === 'active').length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <UserIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Admins</p>
              <p className="text-2xl font-bold text-red-600">{users.filter(u => u.roles.some(role => role.name === 'admin')).length}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Staff Members</p>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.roles.some(role => role.name !== 'admin')).length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <UserIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAccounts;