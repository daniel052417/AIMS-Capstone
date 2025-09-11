# AIMS Shared Library

This directory contains shared types, constants, utilities, and schemas that are used across both the frontend and backend of the AIMS project.

## Project Structure

```
shared/
├── README.md                # This file
├── index.ts                 # Main export file
├── types/                   # TypeScript type definitions
│   ├── index.ts            # Type exports
│   ├── user.ts             # User-related types
│   ├── role.ts             # Role and permission types
│   ├── department.ts       # Department types
│   └── auth.ts             # Authentication types
├── constants/               # Application constants
│   ├── roles.ts            # Role definitions
│   ├── permissions.ts      # Permission definitions
│   └── departments.ts      # Department configurations
├── utils/                   # Utility functions
│   ├── rbac.ts             # Role-based access control utilities
│   └── validators.ts       # Validation utilities
└── schemas/                 # Validation schemas
    ├── roleSchema.ts       # Role validation schemas
    └── userSchema.ts       # User validation schemas
```

## Features

- **Type Safety**: Comprehensive TypeScript type definitions
- **Constants**: Centralized application constants
- **Validation**: Input validation schemas and utilities
- **RBAC**: Role-based access control utilities
- **Reusability**: Shared code between frontend and backend

## Types

### User Types
- `User` - Basic user interface
- `UserProfile` - Extended user profile with permissions
- `CreateUserRequest` - User creation request
- `UpdateUserRequest` - User update request
- `UserFilters` - User filtering options

### Role Types
- `Role` - Role interface
- `Permission` - Permission interface
- `RolePermission` - Role-permission relationship
- `CreateRoleRequest` - Role creation request
- `UpdateRoleRequest` - Role update request

### Department Types
- `Department` - Department interface
- `CreateDepartmentRequest` - Department creation request
- `UpdateDepartmentRequest` - Department update request
- `DepartmentType` - Department type enum

### Authentication Types
- `LoginRequest` - Login request
- `LoginResponse` - Login response
- `RegisterRequest` - Registration request
- `RefreshTokenRequest` - Token refresh request
- `AuthUser` - Authenticated user interface
- `JWTPayload` - JWT token payload

## Constants

### Roles
- `SUPER_ADMIN` - Full system access
- `HR_ADMIN` - HR management access
- `HR_STAFF` - HR staff operations
- `MARKETING_ADMIN` - Marketing management access
- `MARKETING_STAFF` - Marketing staff operations
- `CASHIER` - POS operations
- `INVENTORY_CLERK` - Inventory management
- `CUSTOMER` - Customer operations

### Permissions
- `USERS_READ` - View user accounts
- `USERS_CREATE` - Create user accounts
- `USERS_UPDATE` - Update user accounts
- `USERS_DELETE` - Delete user accounts
- `HR_EMPLOYEES_READ` - View employee information
- `HR_EMPLOYEES_CREATE` - Create employee records
- `MARKETING_CAMPAIGNS_READ` - View marketing campaigns
- `MARKETING_CAMPAIGNS_CREATE` - Create marketing campaigns
- `POS_TRANSACTIONS_READ` - View POS transactions
- `POS_TRANSACTIONS_CREATE` - Create POS transactions
- `INVENTORY_PRODUCTS_READ` - View inventory products
- `INVENTORY_PRODUCTS_CREATE` - Create inventory products
- And many more...

### Departments
- `ADMIN` - Administration
- `HR` - Human Resources
- `MARKETING` - Marketing
- `SALES` - Sales
- `INVENTORY` - Inventory
- `FINANCE` - Finance
- `IT` - Information Technology
- `CUSTOMER_SERVICE` - Customer Service

## Utilities

### RBAC Utilities
- `hasPermission()` - Check if user has specific permission
- `hasAnyPermission()` - Check if user has any of the specified permissions
- `hasAllPermissions()` - Check if user has all specified permissions
- `hasRole()` - Check if user has specific role
- `hasAnyRole()` - Check if user has any of the specified roles
- `hasHigherRole()` - Check if user has higher role than target
- `canAccessResource()` - Check if user can access specific resource
- `canManageUser()` - Check if user can manage another user
- `canAccessDepartment()` - Check if user can access specific department
- `getAccessibleDepartments()` - Get departments user can access
- `validatePermission()` - Validate user permission
- `validateRole()` - Validate user role

### Validation Utilities
- `isValidEmail()` - Email validation
- `isValidPassword()` - Password validation
- `isValidPhoneNumber()` - Phone number validation
- `isValidUUID()` - UUID validation
- `isValidDate()` - Date validation
- `isValidURL()` - URL validation
- `sanitizeString()` - String sanitization
- `validateRequired()` - Required field validation
- `validateMinLength()` - Minimum length validation
- `validateMaxLength()` - Maximum length validation
- `validateRange()` - Range validation
- `validateEnum()` - Enum validation
- `validateArray()` - Array validation
- `validateObject()` - Object validation

## Schemas

### Role Schema
- `createRoleSchema` - Role creation validation
- `updateRoleSchema` - Role update validation
- `roleIdSchema` - Role ID validation

### User Schema
- `createUserSchema` - User creation validation
- `updateUserSchema` - User update validation
- `userIdSchema` - User ID validation
- `loginSchema` - Login validation
- `changePasswordSchema` - Password change validation
- `resetPasswordSchema` - Password reset validation

## Usage

### Frontend Usage
```typescript
import { User, ROLES, PERMISSIONS, hasPermission } from '@shared';

// Use types
const user: User = {
  id: '1',
  email: 'user@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role: ROLES.ADMIN,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Use constants
if (user.role === ROLES.SUPER_ADMIN) {
  // Super admin logic
}

// Use utilities
if (hasPermission(user, PERMISSIONS.USERS_CREATE)) {
  // User can create users
}
```

### Backend Usage
```typescript
import { User, ROLES, PERMISSIONS, hasPermission } from '@shared';

// Use types in controllers
export const createUser = async (req: Request, res: Response) => {
  const userData: CreateUserRequest = req.body;
  // Implementation
};

// Use constants in middleware
if (user.role === ROLES.SUPER_ADMIN) {
  // Allow access
}

// Use utilities in services
if (hasPermission(user, PERMISSIONS.USERS_CREATE)) {
  // Proceed with user creation
}
```

## Validation

The shared library includes comprehensive validation schemas using Joi:

```typescript
import { createUserSchema } from '@shared/schemas/userSchema';

// Validate user creation data
const { error, value } = createUserSchema.validate(userData);
if (error) {
  return res.status(400).json({
    success: false,
    message: 'Validation error',
    errors: error.details
  });
}
```

## Type Safety

All types are properly exported and can be used across the application:

```typescript
import type { User, Role, Permission } from '@shared/types';
import type { ROLES, PERMISSIONS } from '@shared/constants';
```

## Contributing

When adding new types, constants, or utilities:

1. Follow the existing naming conventions
2. Add proper TypeScript types
3. Include JSDoc comments
4. Update the main index.ts file
5. Add validation schemas if needed
6. Update this README

## License

This project is licensed under the MIT License.

