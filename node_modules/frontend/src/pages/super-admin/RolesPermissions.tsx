import React, { useState } from 'react';
import { Shield, Plus, Edit, Trash2, Save, X, User, Settings, Eye } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected

const RolesPermissions: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState('admin');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);

  // Static data for demonstration
  const roles = [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access and control',
      userCount: 2,
      permissions: [
        'users.create', 'users.read', 'users.update', 'users.delete',
        'inventory.create', 'inventory.read', 'inventory.update', 'inventory.delete',
        'sales.create', 'sales.read', 'sales.update', 'sales.delete',
        'reports.create', 'reports.read', 'reports.update', 'reports.delete',
        'settings.create', 'settings.read', 'settings.update', 'settings.delete'
      ]
    },
    {
      id: 'hr',
      name: 'HR Manager',
      description: 'Human resources management and staff oversight',
      userCount: 1,
      permissions: [
        'users.create', 'users.read', 'users.update',
        'reports.read',
        'settings.read'
      ]
    },
    {
      id: 'marketing',
      name: 'Marketing Manager',
      description: 'Marketing campaigns and customer engagement',
      userCount: 1,
      permissions: [
        'marketing.create', 'marketing.read', 'marketing.update', 'marketing.delete',
        'customers.read', 'customers.update',
        'reports.read'
      ]
    },
    {
      id: 'cashier',
      name: 'Cashier',
      description: 'Point of sale operations and transactions',
      userCount: 1,
      permissions: [
        'sales.create', 'sales.read',
        'inventory.read',
        'customers.read', 'customers.create'
      ]
    },
    {
      id: 'inventory',
      name: 'Inventory Clerk',
      description: 'Inventory management and stock control',
      userCount: 1,
      permissions: [
        'inventory.create', 'inventory.read', 'inventory.update',
        'reports.read'
      ]
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

  const selectedRoleData = roles.find(role => role.id === selectedRole);

  const handlePermissionToggle = (permissionId: string) => {
    // TODO: Implement permission toggle logic
    console.log('Toggle permission:', permissionId);
  };

  const handleSaveRole = () => {
    // TODO: Implement save role logic
    console.log('Save role:', selectedRole);
    setEditingRole(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-600">Manage user roles and system permissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Role</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">System Roles</h3>
          <div className="space-y-2">
            {roles.map((role) => (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedRole === role.id
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-500" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{role.name}</h4>
                      <p className="text-xs text-gray-500">{role.userCount} users</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingRole(role.id);
                      }}
                      className="text-green-600 hover:text-green-700 p-1"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement delete role
                      }}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Role Details */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {selectedRoleData && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{selectedRoleData.name}</h3>
                  <p className="text-sm text-gray-600">{selectedRoleData.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingRole(selectedRole)}
                    className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {permissionCategories.map((category) => (
                  <div key={category.name}>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">{category.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {category.permissions.map((permission) => {
                        const hasPermission = selectedRoleData.permissions.includes(permission.id);
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
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {editingRole === selectedRole && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => setEditingRole(null)}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSaveRole}
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

      {/* Add Role Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Role</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter role description"
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPermissions;