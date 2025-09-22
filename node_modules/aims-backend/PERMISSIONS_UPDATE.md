# Permissions Update for Authentication Service

## Overview
Extended the backend authentication service to fetch and include user permissions in the login response, in addition to the existing roles functionality.

## Changes Made

### 1. Updated User Interface (`backend/src/types/auth.ts`)
```typescript
export interface User {
  // ... existing fields ...
  roles?: string[];        // Array of all assigned role names
  role?: string;           // For backward compatibility - first role if only one exists
  permissions?: string[];  // All permissions assigned to user's roles
}
```

### 2. Added Permission Fetching Helper (`backend/src/services/auth.service.ts`)
```typescript
private static async fetchPermissionsForRoles(roleIds: string[]): Promise<string[]> {
  // Fetches permissions from role_permissions joined with permissions table
  // Returns deduplicated array of permission names
}
```

### 3. Updated All Auth Methods
- **Login method**: Now fetches both roles and permissions
- **Register method**: Also fetches permissions (typically empty for new users)
- **RefreshToken method**: Includes permission fetching for consistency

### 4. Database Queries Added
```sql
-- Fetch user roles with IDs
SELECT role_id, roles.id, roles.name 
FROM user_roles 
JOIN roles ON user_roles.role_id = roles.id 
WHERE user_roles.user_id = ?

-- Fetch permissions for role IDs
SELECT permissions.name 
FROM role_permissions 
JOIN permissions ON role_permissions.permission_id = permissions.id 
WHERE role_permissions.role_id IN (?)
```

## API Response Format

### Before (Roles Only)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "roles": ["super_admin", "hr_manager"],
      "role": "super_admin"
    },
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

### After (Roles + Permissions)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "roles": ["super_admin", "hr_manager"],
      "role": "super_admin",
      "permissions": [
        "user.create",
        "user.read",
        "user.update",
        "user.delete",
        "role.manage",
        "permission.assign"
      ]
    },
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

## Frontend Usage

The frontend can now access both roles and permissions:

### Example Frontend Code
```typescript
// Check if user has specific role
if (user.roles?.includes('super_admin')) {
  // Show super admin features
}

// Check if user has specific permission
if (user.permissions?.includes('user.create')) {
  // Show create user button
}

// Check multiple permissions
if (user.permissions?.some(permission => 
  ['user.create', 'user.update'].includes(permission)
)) {
  // Show user management features
}

// Check if user has any admin permissions
const adminPermissions = user.permissions?.filter(permission => 
  permission.startsWith('admin.')
) || [];
```

## Database Tables Involved

1. **`users`** - User profile data
2. **`user_roles`** - Mapping between users and roles
3. **`roles`** - Role definitions with names
4. **`role_permissions`** - Mapping between roles and permissions
5. **`permissions`** - Permission definitions with names

## Key Features

- **Deduplication**: Permissions are automatically deduplicated across multiple roles
- **Error Handling**: Graceful handling if permission fetching fails
- **Consistency**: All auth methods (login, register, refresh) include permissions
- **Performance**: Single query to fetch all permissions for all user roles
- **Type Safety**: Updated TypeScript interfaces

## Testing

Updated the integration test to verify that:
- `user.roles` is defined and is an array
- `user.permissions` is defined and is an array
- Permission fetching doesn't cause errors

## Backward Compatibility

- All existing functionality remains unchanged
- New `permissions` property is optional
- Existing frontend code using `user.roles` continues to work
- New frontend code can use `user.permissions` for fine-grained access control




