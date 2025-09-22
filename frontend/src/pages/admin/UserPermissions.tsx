import React, { useState, useEffect } from 'react';
import { Shield, User as UserIcon, Edit, Save, X, CheckCircle, XCircle } from 'lucide-react';
import { UserPermissionsService } from '../../services/userPermissionsService';
import type { MergedUserPermission } from '../../services/userPermissionsService';
import type { User } from '../../services/userService';

// Dynamic components
import { Can } from '../../components/Can';
import { FallbackUI, LoadingSkeleton } from '../../components/FallbackUI';
// TODO: Replace with actual API calls when backend is connected

const UserPermissions: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingPermissions, setEditingPermissions] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [userPermissions, setUserPermissions] = useState<MergedUserPermission[]>([]);
  const [permissionCategories, setPermissionCategories] = useState<Record<string, MergedUserPermission[]>>({});
  const [loading, setLoading] = useState(true);

  // Load permission categories on component mount
  useEffect(() => {
    loadPermissionCategories();
  }, []);

  // Load user permissions when user is selected
  useEffect(() => {
    if (selectedUser) {
      loadUserPermissions();
    }
  }, [selectedUser]);
  const [users] = useState<User[]>([]); // User is your type

  const loadPermissionCategories = async () => {
    try {
      setLoading(true);
      const categories = await UserPermissionsService.getPermissionsByCategories();
  
      // Transform Permission[] to MergedUserPermission[]
      const mergedCategories: Record<string, MergedUserPermission[]> = {};
      Object.entries(categories).forEach(([categoryName, perms]) => {
        mergedCategories[categoryName] = perms.map(perm => ({
          ...perm,
          permission_id: perm.id, // or whatever maps to permission_id
          granted: false,
          source: 'role',
        }));
      });
  
      setPermissionCategories(mergedCategories);
    } catch (error) {
      console.error('Failed to load permission categories:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const loadUserPermissions = async () => {
    try {
      setLoading(true);
      const permissions = await UserPermissionsService.getUserPermissions(selectedUser?.id || '', true);
      setUserPermissions(permissions);
      
      // Initialize editing state with current permissions
      const permissionMap: Record<string, boolean> = {};
      permissions.forEach(perm => {
        permissionMap[perm.permission_id] = perm.granted;
      });
      setPermissions(permissionMap);
    } catch (error) {
      console.error('Failed to load user permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }));
  };

  const handleSavePermissions = async () => {
    try {
      setLoading(true);
      
      // Convert permissions to the format expected by the API
      const permissionUpdates = Object.entries(permissions).map(([permissionId, granted]) => ({
        permission_id: permissionId,
        granted,
        notes: 'Updated via UserPermissions UI'
      }));

      await UserPermissionsService.updateUserPermissions(selectedUser?.id || '', permissionUpdates);
      
      // Reload permissions to get updated data
      await loadUserPermissions();
      setEditingPermissions(false);
    } catch (error) {
      console.error('Failed to save permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setPermissions({});
    setEditingPermissions(false);
  };

  // const getPermissionSource = (permissionId: string) => {
  //   const permission = userPermissions.find(p => p.permission_id === permissionId);
  //   return permission?.source || 'role';
  // };

  // const getPermissionRole = (permissionId: string) => {
  //   const permission = userPermissions.find(p => p.permission_id === permissionId);
  //   return permission?.role_name;
  // };


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
    <Can
      permissions={['permissions.read']}
      fallback={
        <div className="p-6">
          <FallbackUI 
            type="permission" 
            message="You don't have permission to manage user permissions" 
            size="lg"
          />
        </div>
      }
      loadingComponent={
        <div className="p-6 space-y-6">
          <LoadingSkeleton className="h-8 w-1/3" />
          <LoadingSkeleton className="h-4 w-1/2" />
        </div>
      }
    >
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
                onClick={() => setSelectedUser(user)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedUser?.id === user.id
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{user.first_name}</h4>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.roles.map(role => role.name).join(', '))}`}>
                      {user.roles.map(role => role.name).join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Permissions */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {selectedUser && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{selectedUser.first_name + ' ' + selectedUser.last_name}</h3>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
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
              {Object.entries(permissionCategories).map(([categoryName, categoryPermissions]) => (
  <div key={categoryName}>
    <h4 className="text-sm font-semibold text-gray-800 mb-3">{categoryName}</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {categoryPermissions.map((permission) => {
        // Use the permissions state (Record<string, boolean>) for the toggle status
        const hasPermission = editingPermissions
          ? permissions[permission.permission_id] ?? false
          : userPermissions.find(p => p.permission_id === permission.permission_id)?.granted ?? false;

        return (
          <div
            key={permission.permission_id}
            className={`p-3 rounded-lg border ${
              hasPermission ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium text-gray-900">{permission.permission_name}</h5>
                <p className="text-xs text-gray-500">{permission.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                {hasPermission ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
                {editingPermissions && (
                  <button
                    onClick={() => handlePermissionToggle(permission.permission_id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      hasPermission ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}
                  >
                    {hasPermission && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
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
    </Can>
  );
};

export default UserPermissions;