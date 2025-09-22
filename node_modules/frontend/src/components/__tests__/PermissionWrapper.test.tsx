import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { PermissionWrapper } from '../PermissionWrapper';
import { renderWithPermissions } from '../../utils/permissionTestUtils';

describe('PermissionWrapper', () => {
  it('renders children when user has required permission', () => {
    renderWithPermissions(
      <PermissionWrapper requiredPermissions={['users.read']}>
        <div>Protected Content</div>
      </PermissionWrapper>,
      ['users.read']
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders fallback when user lacks required permission', () => {
    renderWithPermissions(
      <PermissionWrapper 
        requiredPermissions={['users.read']}
        fallback={<div>Access Denied</div>}
      >
        <div>Protected Content</div>
      </PermissionWrapper>,
      ['inventory.read'] // Different permission
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});