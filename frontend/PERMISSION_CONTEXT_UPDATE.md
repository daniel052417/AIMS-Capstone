# PermissionContext Update: Using Login Response Data

## Overview

The PermissionContext has been updated to use permissions and roles directly from the user data returned by the login response, instead of making separate API calls to the RBAC service.

## Changes Made

### 1. Updated UserProfile Interface
**File:** `frontend/src/lib/supabase.ts`

Added new fields to the `UserProfile` interface:
```typescript
export interface UserProfile {
  // ... existing fields
  // New fields from backend login response
  roles?: string[]
  permissions?: string[]
}
```

### 2. Updated PermissionContext
**File:** `frontend/src/context/PermissionContext.tsx`

**Key Changes:**
- Removed dependency on `RBACService`
- Added dependency on `useAuth` hook
- Removed `userId` prop requirement
- Permissions and roles are now loaded directly from user data
- No more API calls for permission checking

**Before:**
```typescript
interface PermissionProviderProps {
  children: React.ReactNode;
  userId: string; // Required userId prop
}

// Made API calls to RBAC service
const loadUserPermissions = async () => {
  const effectivePermissions = await RBACService.getUserEffectivePermissions(userId);
  const userRoles = await RBACService.getUserRoles(userId);
  // ...
};
```

**After:**
```typescript
interface PermissionProviderProps {
  children: React.ReactNode; // No userId prop needed
}

// Uses user data directly from auth context
useEffect(() => {
  if (user && isAuthenticated) {
    setPermissions(user.permissions || []);
    setRoles(user.roles || []);
  }
}, [user, isAuthenticated]);
```

### 3. Updated App.tsx
**File:** `frontend/src/App.tsx`

Removed the `userId` prop from PermissionProvider:
```typescript
// Before
<PermissionProvider userId={user.id}>

// After  
<PermissionProvider>
```

### 4. Updated Test Utilities
**File:** `frontend/src/utils/permissionTestUtils.tsx`

Updated test utilities to mock the `useAuth` hook instead of providing a `userId`:
```typescript
// Mock the useAuth hook to return test data
(useAuth as jest.Mock).mockReturnValue({
  user: {
    id: userId,
    permissions,
    roles,
    // ... other user fields
  },
  isAuthenticated: true
});
```

## Benefits

### 1. **Performance Improvement**
- No additional API calls after login
- Permissions are available immediately after authentication
- Reduced network requests and faster permission checks

### 2. **Simplified Architecture**
- Single source of truth for user data
- No need to manage separate permission state
- Automatic synchronization with user authentication state

### 3. **Better User Experience**
- Instant permission checking
- No loading states for permission checks
- Consistent permission state across the app

### 4. **Reduced Complexity**
- Fewer dependencies
- Simpler component props
- Less error handling for API failures

## How It Works

### 1. **Login Flow**
1. User submits login form
2. Backend returns user data with `permissions` and `roles` arrays
3. User data is stored in localStorage and auth context
4. PermissionContext automatically picks up the permissions/roles

### 2. **Permission Checking**
1. Components use `usePermissions()` hook
2. Hook returns current permissions/roles from user data
3. No API calls needed for permission checks
4. Permissions are always up-to-date with user state

### 3. **State Management**
- Permissions are automatically cleared when user logs out
- Permissions are automatically updated when user data changes
- No manual refresh needed

## Migration Notes

### For Existing Components
No changes needed! All existing components using `usePermissions()` will continue to work exactly the same.

### For Tests
Update test utilities to mock `useAuth` instead of providing `userId`:
```typescript
// Old way
renderWithPermissions(component, permissions, roles, userId);

// New way (same API, but internally uses useAuth mock)
renderWithPermissions(component, permissions, roles, userId);
```

### For New Components
Use the same patterns as before:
```typescript
const { hasPermission, hasRole, permissions, roles } = usePermissions();
```

## Testing

A test component has been created to verify the PermissionContext is working:
**File:** `frontend/src/components/PermissionTest.tsx`

This component displays the current user's permissions and roles, useful for debugging and verification.

## Backend Requirements

This update requires that your backend login response includes:
```typescript
{
  success: true,
  data: {
    user: {
      // ... other user fields
      roles: string[],
      permissions: string[]
    },
    access_token: string,
    refresh_token: string
  }
}
```

The backend should populate these arrays by:
1. Fetching user roles from `user_roles` and `roles` tables
2. Fetching permissions from `role_permissions` and `permissions` tables
3. Including both arrays in the login response

## Troubleshooting

### Permissions Not Loading
1. Check that backend login response includes `permissions` and `roles` arrays
2. Verify user data is being stored correctly in localStorage
3. Check browser console for any errors

### Permission Checks Not Working
1. Ensure PermissionProvider wraps your components
2. Check that user is authenticated
3. Verify permissions array contains the expected permission strings

### Test Failures
1. Update test mocks to use `useAuth` instead of `userId`
2. Ensure test user data includes `permissions` and `roles` arrays
3. Check that PermissionProvider is properly mocked




