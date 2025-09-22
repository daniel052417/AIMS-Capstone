# Role-Based UI Refactoring Guide

## Overview
This guide shows how to use the new role-based UI system that eliminates the need to duplicate pages for different roles. Instead, we use a single set of shared pages with conditional rendering based on user permissions and roles.

## Architecture

### 1. Shared Pages
- All pages are now located in `pages/shared/`
- Single page component serves all roles
- UI elements are conditionally rendered based on permissions

### 2. Permission Guards
- `RequirePermission` - HOC for conditional rendering
- `withPagePermissions` - Wraps entire pages with permission checks
- `ConditionalRender` - Component for showing/hiding UI elements

### 3. Route Protection
- Routes are automatically protected based on permissions
- Users are redirected to `/unauthorized` if they lack required permissions

## Usage Examples

### 1. Page-Level Protection

```typescript
// In routes.ts
const ProtectedUserManagement = withPagePermissions(UserManagement, {
  permissions: ['users.read']
});

// In the route config
{
  path: '/admin/users',
  component: ProtectedUserManagement,
  requiredPermissions: ['users.read'],
  title: 'User Management',
  icon: 'users'
}
```

### 2. Conditional Rendering in Components

```typescript
import { ConditionalRender } from '../components/ConditionalRender';
import { usePermissions } from '../context/PermissionContext';

const UserAccounts: React.FC = () => {
  const { hasPermission, hasRole } = usePermissions();

  return (
    <div>
      {/* Show add button only if user can create users */}
      <ConditionalRender permissions={['users.create']}>
        <button className="btn-primary">
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </ConditionalRender>

      {/* Show admin section only for admin role */}
      <ConditionalRender roles={['admin']}>
        <div className="admin-panel">
          <h3>Admin Controls</h3>
          {/* Admin-only content */}
        </div>
      </ConditionalRender>

      {/* Show different content based on permissions */}
      <ConditionalRender 
        permissions={['users.update', 'users.delete']} 
        requireAll={true}
      >
        <div className="full-controls">
          {/* User has both update AND delete permissions */}
        </div>
      </ConditionalRender>

      <ConditionalRender 
        permissions={['users.update', 'users.delete']} 
        requireAll={false}
        fallback={<div>Limited access</div>}
      >
        <div className="partial-controls">
          {/* User has at least one of the permissions */}
        </div>
      </ConditionalRender>
    </div>
  );
};
```

### 3. Using Hooks for Complex Logic

```typescript
import { useConditionalRender } from '../components/ConditionalRender';

const MyComponent = () => {
  const { shouldRender: canEdit } = useConditionalRender(['users.update']);
  const { shouldRender: canDelete } = useConditionalRender(['users.delete']);
  const { shouldRender: isAdmin } = useConditionalRender([], ['admin']);

  return (
    <div>
      {canEdit && <EditButton />}
      {canDelete && <DeleteButton />}
      {isAdmin && <AdminPanel />}
    </div>
  );
};
```

### 4. Existing DynamicButton Integration

The existing `DynamicButton` component continues to work:

```typescript
<DynamicButton
  permission="users.create"
  className="btn-primary"
  fallback={<div>No permission</div>}
>
  <Plus className="w-4 h-4" />
  Add User
</DynamicButton>
```

## Permission Examples

### User Management Page
- **Super Admin**: Sees all features (create, read, update, delete, manage roles)
- **HR Manager**: Sees read, update features only
- **Regular User**: Sees read-only features
- **No Permission**: Redirected to unauthorized page

### Inventory Management Page
- **Inventory Manager**: Full access to all inventory features
- **Inventory Clerk**: Read and update access only
- **Sales Staff**: Read-only access to inventory levels
- **No Permission**: Redirected to unauthorized page

## Migration Steps

### 1. Move Pages to Shared
```bash
# Copy pages from role-specific folders to shared
cp pages/super-admin/UserAccounts.tsx pages/shared/
cp pages/super-admin/InventoryManagement.tsx pages/shared/
# ... etc
```

### 2. Update Routes
```typescript
// Before
const UserManagement = lazy(() => import('../pages/super-admin/UserAccounts'));

// After
const UserManagement = lazy(() => import('../pages/shared/UserAccounts'));
const ProtectedUserManagement = withPagePermissions(UserManagement, {
  permissions: ['users.read']
});
```

### 3. Add Conditional Rendering
```typescript
// Add to component imports
import { ConditionalRender } from '../components/ConditionalRender';
import { usePermissions } from '../context/PermissionContext';

// Add to component
const { hasPermission, hasRole } = usePermissions();

// Wrap UI elements
<ConditionalRender permissions={['users.create']}>
  <button>Add User</button>
</ConditionalRender>
```

## Benefits

1. **No Code Duplication**: Single page serves all roles
2. **Centralized Logic**: All permission logic in one place
3. **Easy Maintenance**: Update once, affects all roles
4. **Flexible**: Easy to add new roles or permissions
5. **Type Safe**: Full TypeScript support
6. **Performance**: Only loads components user can access

## Best Practices

1. **Use Specific Permissions**: `users.create` instead of generic `admin`
2. **Provide Fallbacks**: Always provide meaningful fallback content
3. **Group Related Permissions**: Use `requireAll` for dependent features
4. **Test All Roles**: Ensure each role sees appropriate content
5. **Document Permissions**: Keep permission requirements documented

## Common Patterns

### Show/Hide Buttons
```typescript
<ConditionalRender permissions={['users.create']}>
  <button>Add User</button>
</ConditionalRender>
```

### Role-Based Sections
```typescript
<ConditionalRender roles={['admin']}>
  <AdminPanel />
</ConditionalRender>
```

### Multiple Permission Checks
```typescript
<ConditionalRender 
  permissions={['users.update', 'users.delete']} 
  requireAll={true}
>
  <FullControlPanel />
</ConditionalRender>
```

### Fallback Content
```typescript
<ConditionalRender 
  permissions={['users.create']}
  fallback={<div className="text-gray-500">Contact admin to add users</div>}
>
  <button>Add User</button>
</ConditionalRender>
```




