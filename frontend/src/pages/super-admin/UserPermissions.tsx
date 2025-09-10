import React, { useState } from 'react';
import { Shield, User, Settings, Eye, Edit, Save, X, CheckCircle, XCircle } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected

const UserPermissions: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState('maria-santos');
  const [editingPermissions, setEditingPermissions] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  // Static data for demonstration
  const users = [
    {
      id: 'maria-santos',
      name: 'Maria Santos',
      email: 'maria.santos@agrivet.com',
      role: 'admin',
      avatar: null
    },
    {
      id: 'juan-delacruz',
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@agrivet.com',
      role: 'hr',
      avatar: null
    },
    {
      id: 'ana-rodriguez',
      name: 'Ana Rodriguez',
      email: 'ana.rodriguez@agrivet.com',
      role: 'marketing',
      avatar: null
    },
    {
      id: 'carlos-mendoza',
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@agrivet.com',
      role: 'cashier',
      avatar: null
    },
    {
      id: 'elena-garcia',
      name: 'Elena Garcia',
      email: 'elena.garcia@agrivet.com',
      role: 'inventory',
      avatar: null
    }
  ];

  const permissionCategories = [
    {
      name: 'User Management',
      permissions: [
        { id: 'users.create', name: 'Create Users', description: 'Add new user accounts' },
        { id: 'users.read', name: 'View Users', description: 'View user information' },
        { id: 'users.update', name: 'Edit Users', description: 'Modify user details' },
        { id: 'users.delete', name: 'Delete Users', description: 'Remove user accounts' }
      ]
    },
    {
      name: 'Inventory Management',
      permissions: [
        { id: 'inventory.create', name: 'Add Products', description: 'Add new inventory items' },
        { id: 'inventory.read', name: 'View Inventory', description: 'View inventory levels' },
        { id: 'inventory.update', name: 'Edit Products', description: 'Modify product information' },
        { id: 'inventory.delete', name: 'Delete Products', description: 'Remove inventory items' }
      ]
    },
    {
      name: 'Sales Management',
      permissions: [
        { id: 'sales.create', name: 'Create Sales', description: 'Process new transactions' },
        { id: 'sales.read', name: 'View Sales', description: 'View sales records' },
        { id: 'sales.update', name: 'Edit Sales', description: 'Modify transaction details' },
        { id: 'sales.delete', name: 'Delete Sales', description: 'Remove transactions' }
      ]
    },
    {
      name: 'Marketing',
      permissions: [
        { id: 'marketing.create', name: 'Create Campaigns', description: 'Create marketing campaigns' },
        { id: 'marketing.read', name: 'View Campaigns', description: 'View campaign data' },
        { id: 'marketing.update', name: 'Edit Campaigns', description: 'Modify campaigns' },
        { id: 'marketing.delete', name: 'Delete Campaigns', description: 'Remove campaigns' }
      ]
    },
    {
      name: 'Reports & Analytics',
      permissions: [
        { id: 'reports.create', name: 'Generate Reports', description: 'Create new reports' },
        { id: 'reports.read', name: 'View Reports', description: 'Access report data' },
        { id: 'reports.update', name: 'Edit Reports', description: 'Modify reports' },
        { id: 'reports.delete', name: 'Delete Reports', description: 'Remove reports' }
      ]
    },
    {
      name: 'System Settings',
      permissions: [
        { id: 'settings.create', name: 'Create Settings', description: 'Add system settings' },
        { id: 'settings.read', name: 'View Settings', description: 'View system configuration' },
        { id: 'settings.update', name: 'Edit Settings', description: 'Modify system settings' },
        { id: 'settings.delete', name: 'Delete Settings', description: 'Remove settings' }
      ]
    }
  ];

  const selectedUserData = users.find(user => user.id === selectedUser);

  // Mock permissions data - in real app, this would come from API
  const userPermissions: Record<string, Record<string, boolean>> = {
    'maria-santos': {
      'users.create': true,
      'users.read': true,
      'users.update': true,
      'users.delete': true,
      'inventory.create': true,
      'inventory.read': true,
      'inventory.update': true,
      'inventory.delete': true,
      'sales.create': true,
      'sales.read': true,
      'sales.update': true,
      'sales.delete': true,
      'marketing.create': true,
      'marketing.read': true,
      'marketing.update': true,
      'marketing.delete': true,
      'reports.create': true,
      'reports.read': true,
      'reports.update': true,
      'reports.delete': true,
      'settings.create': true,
      'settings.read': true,
      'settings.update': true,
      'settings.delete': true
    },
    'juan-delacruz': {
      'users.create': true,
      'users.read': true,
      'users.update': true,
      'users.delete': false,
      'inventory.create': false,
      'inventory.read': true,
      'inventory.update': false,
      'inventory.delete': false,
      'sales.create': false,
      'sales.read': true,
      'sales.update': false,
      'sales.delete': false,
      'marketing.create': false,
      'marketing.read': true,
      'marketing.update': false,
      'marketing.delete': false,
      'reports.create': false,
      'reports.read': true,
      'reports.update': false,
      'reports.delete': false,
      'settings.create': false,
      'settings.read': true,
      'settings.update': false,
      'settings.delete': false
    },
    'ana-rodriguez': {
      'users.create': false,
      'users.read': false,
      'users.update': false,
      'users.delete': false,
      'inventory.create': false,
      'inventory.read': true,
      'inventory.update': false,
      'inventory.delete': false,
      'sales.create': false,
      'sales.read': true,
      'sales.update': false,
      'sales.delete': false,
      'marketing.create': true,
      'marketing.read': true,
      'marketing.update': true,
      'marketing.delete': true,
      'reports.create': false,
      'reports.read': true,
      'reports.update': false,
      'reports.delete': false,
      'settings.create': false,
      'settings.read': false,
      'settings.update': false,
      'settings.delete': false
    },
    'carlos-mendoza': {
      'users.create': false,
      'users.read': false,
      'users.update': false,
      'users.delete': false,
      'inventory.create': false,
      'inventory.read': true,
      'inventory.update': false,
      'inventory.delete': false,
      'sales.create': true,
      'sales.read': true,
      'sales.update': true,
      'sales.delete': false,
      'marketing.create': false,
      'marketing.read': false,
      'marketing.update': false,
      'marketing.delete': false,
      'reports.create': false,
      'reports.read': true,
      'reports.update': false,
      'reports.delete': false,
      'settings.create': false,
      'settings.read': false,
      'settings.update': false,
      'settings.delete': false
    },
    'elena-garcia': {
      'users.create': false,
      'users.read': false,
      'users.update': false,
      'users.delete': false,
      'inventory.create': true,
      'inventory.read': true,
      'inventory.update': true,
      'inventory.delete': false,
      'sales.create': false,
      'sales.read': true,
      'sales.update': false,
      'sales.delete': false,
      'marketing.create': false,
      'marketing.read': false,
      'marketing.update': false,
      'marketing.delete': false,
      'reports.create': false,
      'reports.read': true,
      'reports.update': false,
      'reports.delete': false,
      'settings.create': false,
      'settings.read': false,
      'settings.update': false,
      'settings.delete': false
    }
  };

  const currentPermissions = userPermissions[selectedUser] || {};

  const handlePermissionToggle = (permissionId: string) => {
    setPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }));
  };

  const handleSavePermissions = () => {
    // TODO: Implement save permissions logic
    console.log('Saving permissions:', permissions);
    setEditingPermissions(false);
  };

  const handleCancelEdit = () => {
    setPermissions({});
    setEditingPermissions(false);
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
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Permissions</h1>
          <p className="text-gray-600">Manage individual user permissions and access control</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Shield className="w-4 h-4" />
          <span>Granular access control</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Users List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Select User</h3>
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedUser === user.id
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{user.name}</h4>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Permissions */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {selectedUserData && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{selectedUserData.name}</h3>
                  <p className="text-sm text-gray-600">{selectedUserData.email}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingPermissions(true)}
                    className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Permissions</span>
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {permissionCategories.map((category) => (
                  <div key={category.name}>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">{category.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {category.permissions.map((permission) => {
                        const hasPermission = editingPermissions 
                          ? permissions[permission.id] !== undefined 
                            ? permissions[permission.id] 
                            : currentPermissions[permission.id]
                          : currentPermissions[permission.id];
                        
                        return (
                          <div
                            key={permission.id}
                            className={`p-3 rounded-lg border ${
                              hasPermission
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">
                                  {permission.name}
                                </h5>
                                <p className="text-xs text-gray-500">
                                  {permission.description}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {hasPermission ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-gray-400" />
                                )}
                                {editingPermissions && (
                                  <button
                                    onClick={() => handlePermissionToggle(permission.id)}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                      hasPermission
                                        ? 'bg-green-500 border-green-500'
                                        : 'border-gray-300'
                                    }`}
                                  >
                                    {hasPermission && (
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {editingPermissions && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSavePermissions}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPermissions;