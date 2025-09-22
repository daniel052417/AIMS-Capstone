// src/utils/permissionTestUtils.ts
import React from 'react';
import { render } from '@testing-library/react';
import { PermissionProvider } from '../context/PermissionContext';
import { useAuth } from '../hooks/useAuth';

// Mock the useAuth hook for testing
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

export const renderWithPermissions = (
  component: React.ReactElement,
  permissions: string[] = [],
  roles: string[] = [],
  userId: string = 'test-user'
) => {
  // Mock the useAuth hook to return test data
  (useAuth as jest.Mock).mockReturnValue({
    user: {
      id: userId,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'user',
      is_active: true,
      permissions,
      roles,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    isAuthenticated: true
  });

  return render(
    <PermissionProvider>
      {component}
    </PermissionProvider>
  );
};

// mocks
export const mockPermissions = (permissions: string[]) => {
  jest.mock('../services/userPermissionsService', () => ({
    UserPermissionsService: {
      getUserPermissions: jest.fn().mockResolvedValue(permissions),
    },
  }));
};

export const mockRoles = (roles: string[]) => {
  jest.mock('../services/rbacService', () => ({
    RBACService: {
      getUserRoles: jest.fn().mockResolvedValue(
        roles.map((role) => ({ role_name: role }))
      ),
    },
  }));
};
