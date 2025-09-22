import React from 'react';
import { usePermissions } from '../context/PermissionContext';

/**
 * Test component to verify PermissionContext is working correctly
 * This component displays the current user's permissions and roles
 */
export const PermissionTest: React.FC = () => {
  const { permissions, roles, isLoading, hasPermission, hasRole } = usePermissions();

  if (isLoading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Permission Test Component</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Permissions:</strong>
          <ul className="ml-4 list-disc">
            {permissions.length > 0 ? (
              permissions.map(permission => (
                <li key={permission} className="text-sm">
                  {permission} {hasPermission(permission) ? '✅' : '❌'}
                </li>
              ))
            ) : (
              <li className="text-sm text-gray-500">No permissions</li>
            )}
          </ul>
        </div>
        
        <div>
          <strong>Roles:</strong>
          <ul className="ml-4 list-disc">
            {roles.length > 0 ? (
              roles.map(role => (
                <li key={role} className="text-sm">
                  {role} {hasRole(role) ? '✅' : '❌'}
                </li>
              ))
            ) : (
              <li className="text-sm text-gray-500">No roles</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PermissionTest;




