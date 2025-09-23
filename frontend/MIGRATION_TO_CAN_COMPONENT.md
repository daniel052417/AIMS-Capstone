# Migration Guide: Unified Can Component

This guide shows how to migrate from the old permission components (`DynamicButton`, `PermissionWrapper`, `ConditionalRender`) to the new unified `Can` component.

## Overview

The new `Can` component replaces:
- `DynamicButton` - For buttons with permission checks
- `PermissionWrapper` - For wrapping sections with permission checks  
- `ConditionalRender` - For conditional rendering based on permissions

## Migration Examples

### 1. DynamicButton → Can

**Before:**
```tsx
<DynamicButton
  permission="users.create"
  className="btn-primary"
  fallback={<div>No permission</div>}
>
  Add User
</DynamicButton>
```

**After:**
```tsx
<Can
  permission="users.create"
  as="button"
  buttonProps={{ className: "btn-primary" }}
  fallback={<div>No permission</div>}
>
  Add User
</Can>
```

### 2. PermissionWrapper → Can

**Before:**
```tsx
<PermissionWrapper
  requiredPermissions={['users.read']}
  fallback={<div>No access</div>}
>
  <UserTable />
</PermissionWrapper>
```

**After:**
```tsx
<Can
  permissions={['users.read']}
  fallback={<div>No access</div>}
>
  <UserTable />
</Can>
```

### 3. ConditionalRender → Can

**Before:**
```tsx
<ConditionalRender
  permissions={['users.update', 'users.delete']}
  requireAll={true}
  fallback={<div>Limited access</div>}
>
  <AdminPanel />
</ConditionalRender>
```

**After:**
```tsx
<Can
  permissions={['users.update', 'users.delete']}
  requireAll={true}
  fallback={<div>Limited access</div>}
>
  <AdminPanel />
</Can>
```

## New Features

### 1. Multiple Permission Types
```tsx
// Single permission
<Can permission="users.create">...</Can>

// Multiple permissions (any)
<Can permissions={['users.update', 'users.delete']}>...</Can>

// Multiple permissions (all required)
<Can permissions={['users.update', 'users.delete']} requireAll={true}>...</Can>

// Role + permission combination
<Can roles={['admin']} permissions={['settings.read']}>...</Can>
```

### 2. Different Element Types
```tsx
// As a button
<Can as="button" buttonProps={{ onClick: handleClick }}>
  Click me
</Can>

// As a span
<Can as="span" buttonProps={{ className: "text-blue-500" }}>
  Inline content
</Can>

// As a div (default)
<Can>
  Block content
</Can>
```

### 3. Hook Usage
```tsx
const { can: canCreate } = useCan('users.create');
const { can: canManage } = useCan(['users.update', 'users.delete'], [], [], true);

return (
  <div>
    {canCreate && <CreateButton />}
    {canManage && <ManagePanel />}
  </div>
);
```

### 4. HOC Usage
```tsx
const ProtectedUserManagement = withCan(UserManagement, {
  permissions: ['users.read'],
  fallback: <UnauthorizedPage />
});
```

## Migration Steps

1. **Replace imports:**
   ```tsx
   // Remove
   import { DynamicButton } from '../../components/DynamicButton';
   import { PermissionWrapper } from '../../components/PermissionWrapper';
   import { ConditionalRender } from '../../components/ConditionalRender';
   
   // Add
   import { Can } from '../../components/Can';
   ```

2. **Update component usage:**
   - `DynamicButton` → `Can` with `as="button"`
   - `PermissionWrapper` → `Can` with `permissions` prop
   - `ConditionalRender` → `Can` with same props

3. **Update prop names:**
   - `requiredPermissions` → `permissions`
   - `requiredRoles` → `roles`
   - Button props go in `buttonProps` when using `as="button"`

4. **Test permission checks:**
   - Verify all permission checks work correctly
   - Test fallback content displays properly
   - Ensure loading states work as expected

## Benefits

- **Unified API**: Single component for all permission-based rendering
- **Better TypeScript**: Improved type safety and IntelliSense
- **Consistent Behavior**: Same logic across all permission checks
- **Easier Maintenance**: One component to maintain instead of three
- **More Flexible**: Support for different element types and complex permission logic






