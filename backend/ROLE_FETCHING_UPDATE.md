# Role Fetching Update for Authentication Service

## Overview
Updated the backend authentication service to properly fetch user roles from the `user_roles` and `roles` tables instead of relying on the default `role` column in the `users` table.

## Changes Made

### 1. Updated User Interface (`backend/src/types/auth.ts`)
```typescript
export interface User {
  // ... existing fields ...
  roles?: string[];        // Array of all assigned role names
  role?: string;           // For backward compatibility - first role if only one exists
}
```

### 2. Updated Auth Service (`backend/src/services/auth.service.ts`)
- **Login method**: Now fetches roles from `user_roles` joined with `roles` table
- **Register method**: Also fetches roles (typically empty for new users)
- **RefreshToken method**: Includes role fetching for consistency

### 3. Database Queries Added
```sql
-- Fetch user roles
SELECT roles.name 
FROM user_roles 
JOIN roles ON user_roles.role_id = roles.id 
WHERE user_roles.user_id = ?
```

## API Response Format

### Before (Old Format)
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
      "role": "user"  // Default role from users table
    },
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

### After (New Format)
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
      "roles": ["super_admin", "hr_manager"],  // Actual roles from RBAC system
      "role": "super_admin"  // First role for backward compatibility
    },
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

## Frontend Usage

The frontend can now use either:
- `user.roles` - Array of all assigned roles
- `user.role` - Single role (first one if multiple exist, undefined if none)

### Example Frontend Code
```typescript
// Check if user has specific role
if (user.roles?.includes('super_admin')) {
  // Show super admin features
}

// Backward compatible check
if (user.role === 'super_admin') {
  // Show super admin features
}

// Check multiple roles
if (user.roles?.some(role => ['admin', 'manager'].includes(role))) {
  // Show admin/manager features
}
```

## Database Tables Involved

1. **`users`** - User profile data
2. **`user_roles`** - Mapping between users and roles
3. **`roles`** - Role definitions with names

## Testing

Updated the integration test to verify that:
- `user.roles` is defined
- `user.roles` is an array
- Role fetching doesn't cause errors

## Backward Compatibility

- Added `role` property for backward compatibility
- Existing frontend code using `user.role` will continue to work
- New frontend code should use `user.roles` for full RBAC support




