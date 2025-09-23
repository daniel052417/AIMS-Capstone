# Dynamic UI Rendering Based on Roles & Permissions

## Overview
This guide covers the implementation of dynamic UI component rendering based on user roles and permissions after successful authentication. This includes frontend permission checks, component-level access control, and dynamic navigation.

## Table of Contents
1. [Frontend Permission System](#frontend-permission-system)
2. [Dynamic Component Rendering](#dynamic-component-rendering)
3. [Navigation & Route Protection](#navigation--route-protection)
4. [Permission Hooks & Context](#permission-hooks--context)
5. [Component-Level Access Control](#component-level-access-control)
6. [Dynamic Menu Generation](#dynamic-menu-generation)
7. [API Integration](#api-integration)
8. [Testing & Implementation](#testing--implementation)

---

## Frontend Permission System

### 1. Permission Context Provider

```typescript
// File: frontend/src/contexts/PermissionContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserPermissionsService } from '../services/userPermissionsService';
import { RBACService } from '../services/rbacService';

export interface PermissionContextType {
  permissions: string[];
  roles: string[];
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  canAccess: (requiredPermissions: string[], requiredRoles?: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

interface PermissionProviderProps {
  children: React.ReactNode;
  userId: string;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children, userId }) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserPermissions = async () => {
    try {
      setIsLoading(true);
      
      // Get effective permissions
      const effectivePermissions = await UserPermissionsService.getEffectiveUserPermissions(userId);
      setPermissions(effectivePermissions);

      // Get user roles
      const userRoles = await RBACService.getUserRoles(userId);
      setRoles(userRoles.map(role => role.role_name));
    } catch (error) {
      console.error('Failed to load user permissions:', error);
      setPermissions([]);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadUserPermissions();
    }
  }, [userId]);

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => permissions.includes(permission));
  };

  const hasAnyRole = (roleList: string[]): boolean => {
    return roleList.some(role => roles.includes(role));
  };

  const canAccess = (requiredPermissions: string[], requiredRoles?: string[]): boolean => {
    const hasRequiredPermissions = requiredPermissions.length === 0 || 
      hasAnyPermission(requiredPermissions);
    
    const hasRequiredRoles = !requiredRoles || requiredRoles.length === 0 || 
      hasAnyRole(requiredRoles);
    
    return hasRequiredPermissions && hasRequiredRoles;
  };

  const refreshPermissions = async () => {
    await loadUserPermissions();
  };

  const value: PermissionContextType = {
    permissions,
    roles,
    isLoading,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAnyRole,
    canAccess,
    refreshPermissions
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};
```

### 2. Permission Hooks

```typescript
// File: frontend/src/hooks/usePermission.ts
import { usePermissions } from '../contexts/PermissionContext';

export const usePermission = (permission: string) => {
  const { hasPermission, isLoading } = usePermissions();
  
  return {
    hasPermission: hasPermission(permission),
    isLoading
  };
};

export const useRole = (role: string) => {
  const { hasRole, isLoading } = usePermissions();
  
  return {
    hasRole: hasRole(role),
    isLoading
  };
};

export const useAccess = (requiredPermissions: string[], requiredRoles?: string[]) => {
  const { canAccess, isLoading } = usePermissions();
  
  return {
    canAccess: canAccess(requiredPermissions, requiredRoles),
    isLoading
  };
};

export const useAnyPermission = (permissions: string[]) => {
  const { hasAnyPermission, isLoading } = usePermissions();
  
  return {
    hasAnyPermission: hasAnyPermission(permissions),
    isLoading
  };
};

export const useAnyRole = (roles: string[]) => {
  const { hasAnyRole, isLoading } = usePermissions();
  
  return {
    hasAnyRole: hasAnyRole(roles),
    isLoading
  };
};
```

---

## Dynamic Component Rendering

### 1. Permission-Based Component Wrapper

```typescript
// File: frontend/src/components/PermissionWrapper.tsx
import React from 'react';
import { useAccess } from '../hooks/usePermission';

interface PermissionWrapperProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallback?: React.ReactNode;
  showLoading?: boolean;
  loadingComponent?: React.ReactNode;
}

export const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallback = null,
  showLoading = true,
  loadingComponent = <div>Loading...</div>
}) => {
  const { canAccess, isLoading } = useAccess(requiredPermissions, requiredRoles);

  if (isLoading && showLoading) {
    return <>{loadingComponent}</>;
  }

  if (!canAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Higher-order component for easier usage
export const withPermission = (
  WrappedComponent: React.ComponentType<any>,
  requiredPermissions: string[] = [],
  requiredRoles: string[] = []
) => {
  return (props: any) => (
    <PermissionWrapper
      requiredPermissions={requiredPermissions}
      requiredRoles={requiredRoles}
    >
      <WrappedComponent {...props} />
    </PermissionWrapper>
  );
};
```

### 2. Conditional Rendering Components

```typescript
// File: frontend/src/components/ConditionalRender.tsx
import React from 'react';
import { usePermission, useRole, useAccess } from '../hooks/usePermission';

interface ConditionalRenderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Render based on single permission
export const IfHasPermission: React.FC<ConditionalRenderProps & { permission: string }> = ({
  children,
  permission,
  fallback = null
}) => {
  const { hasPermission } = usePermission(permission);
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

// Render based on single role
export const IfHasRole: React.FC<ConditionalRenderProps & { role: string }> = ({
  children,
  role,
  fallback = null
}) => {
  const { hasRole } = useRole(role);
  return hasRole ? <>{children}</> : <>{fallback}</>;
};

// Render based on multiple permissions (any)
export const IfHasAnyPermission: React.FC<ConditionalRenderProps & { permissions: string[] }> = ({
  children,
  permissions,
  fallback = null
}) => {
  const { hasAnyPermission } = useAnyPermission(permissions);
  return hasAnyPermission ? <>{children}</> : <>{fallback}</>;
};

// Render based on multiple roles (any)
export const IfHasAnyRole: React.FC<ConditionalRenderProps & { roles: string[] }> = ({
  children,
  roles,
  fallback = null
}) => {
  const { hasAnyRole } = useAnyRole(roles);
  return hasAnyRole ? <>{children}</> : <>{fallback}</>;
};

// Render based on complex access requirements
export const IfCanAccess: React.FC<ConditionalRenderProps & {
  requiredPermissions: string[];
  requiredRoles?: string[];
}> = ({
  children,
  requiredPermissions,
  requiredRoles,
  fallback = null
}) => {
  const { canAccess } = useAccess(requiredPermissions, requiredRoles);
  return canAccess ? <>{children}</> : <>{fallback}</>;
};
```

---

## Navigation & Route Protection

### 1. Protected Route Component

```typescript
// File: frontend/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAccess } from '../hooks/usePermission';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  redirectTo = '/unauthorized',
  fallback = <div>Loading...</div>
}) => {
  const { canAccess, isLoading } = useAccess(requiredPermissions, requiredRoles);
  const location = useLocation();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!canAccess) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

### 2. Dynamic Route Configuration

```typescript
// File: frontend/src/config/routes.ts
import { lazy } from 'react';

// Lazy load components
const Dashboard = lazy(() => import('../pages/Dashboard'));
const UserManagement = lazy(() => import('../pages/super-admin/UserAccounts'));
const RolesPermissions = lazy(() => import('../pages/super-admin/RolesPermissions'));
const UserPermissions = lazy(() => import('../pages/super-admin/UserPermissions'));
const InventoryManagement = lazy(() => import('../pages/super-admin/InventoryManagement'));
const SalesManagement = lazy(() => import('../pages/super-admin/SalesDashboard'));
const MarketingDashboard = lazy(() => import('../pages/super-admin/MarketingDashboard'));
const ReportsAnalytics = lazy(() => import('../pages/super-admin/ReportsAnalytics'));
const Settings = lazy(() => import('../pages/super-admin/Settings'));

export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  title: string;
  icon?: string;
  children?: RouteConfig[];
}

export const routes: RouteConfig[] = [
  {
    path: '/dashboard',
    component: Dashboard,
    requiredPermissions: ['dashboard.read'],
    title: 'Dashboard',
    icon: 'home'
  },
  {
    path: '/admin',
    title: 'Administration',
    icon: 'settings',
    requiredRoles: ['admin', 'hr_manager'],
    children: [
      {
        path: '/admin/users',
        component: UserManagement,
        requiredPermissions: ['users.read'],
        title: 'User Management',
        icon: 'users'
      },
      {
        path: '/admin/roles',
        component: RolesPermissions,
        requiredPermissions: ['roles.read'],
        requiredRoles: ['admin'],
        title: 'Roles & Permissions',
        icon: 'shield'
      },
      {
        path: '/admin/user-permissions',
        component: UserPermissions,
        requiredPermissions: ['permissions.read'],
        requiredRoles: ['admin'],
        title: 'User Permissions',
        icon: 'key'
      }
    ]
  },
  {
    path: '/inventory',
    component: InventoryManagement,
    requiredPermissions: ['inventory.read'],
    title: 'Inventory',
    icon: 'package'
  },
  {
    path: '/sales',
    component: SalesManagement,
    requiredPermissions: ['sales.read'],
    title: 'Sales',
    icon: 'trending-up'
  },
  {
    path: '/marketing',
    component: MarketingDashboard,
    requiredPermissions: ['marketing.read'],
    title: 'Marketing',
    icon: 'megaphone'
  },
  {
    path: '/reports',
    component: ReportsAnalytics,
    requiredPermissions: ['reports.read'],
    title: 'Reports',
    icon: 'bar-chart'
  },
  {
    path: '/settings',
    component: Settings,
    requiredPermissions: ['settings.read'],
    requiredRoles: ['admin'],
    title: 'Settings',
    icon: 'settings'
  }
];
```

### 3. Dynamic Router Setup

```typescript
// File: frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PermissionProvider } from './contexts/PermissionContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { routes } from './config/routes';
import { useAuth } from './hooks/useAuth';

const App: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <div>Please log in</div>;
  }

  return (
    <PermissionProvider userId={user.id}>
      <Router>
        <Routes>
          {routes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <ProtectedRoute
                  requiredPermissions={route.requiredPermissions}
                  requiredRoles={route.requiredRoles}
                >
                  <route.component />
                </ProtectedRoute>
              }
            />
          ))}
        </Routes>
      </Router>
    </PermissionProvider>
  );
};

export default App;
```

---

## Component-Level Access Control

### 1. Dynamic Button Rendering

```typescript
// File: frontend/src/components/DynamicButton.tsx
import React from 'react';
import { usePermission } from '../hooks/usePermission';

interface DynamicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission?: string;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const DynamicButton: React.FC<DynamicButtonProps> = ({
  permission,
  requiredPermissions = [],
  requiredRoles = [],
  fallback = null,
  children,
  ...props
}) => {
  const { hasPermission } = usePermission(permission || '');
  const { hasAnyPermission } = useAnyPermission(requiredPermissions);
  const { hasAnyRole } = useAnyRole(requiredRoles);

  const canShow = permission ? hasPermission : 
    (requiredPermissions.length > 0 ? hasAnyPermission : true) &&
    (requiredRoles.length > 0 ? hasAnyRole : true);

  if (!canShow) {
    return <>{fallback}</>;
  }

  return <button {...props}>{children}</button>;
};
```

### 2. Dynamic Menu Item

```typescript
// File: frontend/src/components/DynamicMenuItem.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAccess } from '../hooks/usePermission';

interface DynamicMenuItemProps {
  to: string;
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  icon?: React.ReactNode;
  className?: string;
}

export const DynamicMenuItem: React.FC<DynamicMenuItemProps> = ({
  to,
  children,
  requiredPermissions = [],
  requiredRoles = [],
  icon,
  className = ''
}) => {
  const { canAccess } = useAccess(requiredPermissions, requiredRoles);

  if (!canAccess) {
    return null;
  }

  return (
    <Link to={to} className={className}>
      {icon}
      {children}
    </Link>
  );
};
```

### 3. Dynamic Table Actions

```typescript
// File: frontend/src/components/DynamicTableActions.tsx
import React from 'react';
import { Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import { usePermission } from '../hooks/usePermission';

interface DynamicTableActionsProps {
  itemId: string;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  viewPermission?: string;
  editPermission?: string;
  deletePermission?: string;
  className?: string;
}

export const DynamicTableActions: React.FC<DynamicTableActionsProps> = ({
  itemId,
  onView,
  onEdit,
  onDelete,
  viewPermission = 'read',
  editPermission = 'update',
  deletePermission = 'delete',
  className = ''
}) => {
  const { hasPermission: canView } = usePermission(viewPermission);
  const { hasPermission: canEdit } = usePermission(editPermission);
  const { hasPermission: canDelete } = usePermission(deletePermission);

  const actions = [];

  if (canView && onView) {
    actions.push(
      <button
        key="view"
        onClick={() => onView(itemId)}
        className="text-blue-600 hover:text-blue-800 p-1"
        title="View"
      >
        <Eye className="w-4 h-4" />
      </button>
    );
  }

  if (canEdit && onEdit) {
    actions.push(
      <button
        key="edit"
        onClick={() => onEdit(itemId)}
        className="text-green-600 hover:text-green-800 p-1"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
    );
  }

  if (canDelete && onDelete) {
    actions.push(
      <button
        key="delete"
        onClick={() => onDelete(itemId)}
        className="text-red-600 hover:text-red-800 p-1"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    );
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {actions}
    </div>
  );
};
```

---

## Dynamic Menu Generation

### 1. Dynamic Sidebar Component

```typescript
// File: frontend/src/components/DynamicSidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useAccess } from '../hooks/usePermission';
import { routes } from '../config/routes';

interface DynamicSidebarProps {
  className?: string;
}

export const DynamicSidebar: React.FC<DynamicSidebarProps> = ({ className = '' }) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path) 
        ? prev.filter(item => item !== path)
        : [...prev, path]
    );
  };

  const renderMenuItem = (route: any, level: number = 0) => {
    const { canAccess } = useAccess(
      route.requiredPermissions || [],
      route.requiredRoles || []
    );

    if (!canAccess) {
      return null;
    }

    const isActive = location.pathname === route.path;
    const hasChildren = route.children && route.children.length > 0;
    const isExpanded = expandedItems.includes(route.path);

    if (hasChildren) {
      return (
        <div key={route.path} className="mb-2">
          <button
            onClick={() => toggleExpanded(route.path)}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
              isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center space-x-2">
              {route.icon && <span className="text-lg">{route.icon}</span>}
              <span>{route.title}</span>
            </span>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-2 space-y-1">
              {route.children.map((child: any) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={route.path}
        to={route.path}
        className={`block p-3 rounded-lg transition-colors ${
          isActive 
            ? 'bg-blue-100 text-blue-700' 
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center space-x-2">
          {route.icon && <span className="text-lg">{route.icon}</span>}
          <span>{route.title}</span>
        </div>
      </Link>
    );
  };

  return (
    <div className={`bg-white shadow-sm border-r border-gray-200 ${className}`}>
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Navigation</h2>
        <nav className="space-y-2">
          {routes.map(route => renderMenuItem(route))}
        </nav>
      </div>
    </div>
  );
};
```

### 2. Dynamic Top Navigation

```typescript
// File: frontend/src/components/DynamicTopNav.tsx
import React from 'react';
import { useAccess } from '../hooks/usePermission';
import { Bell, Settings, User, LogOut } from 'lucide-react';

interface DynamicTopNavProps {
  onLogout: () => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onNotificationsClick: () => void;
}

export const DynamicTopNav: React.FC<DynamicTopNavProps> = ({
  onLogout,
  onProfileClick,
  onSettingsClick,
  onNotificationsClick
}) => {
  const { canAccess: canViewSettings } = useAccess(['settings.read'], ['admin']);
  const { canAccess: canViewNotifications } = useAccess(['notifications.read']);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-800">AIMS</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {canViewNotifications && (
            <button
              onClick={onNotificationsClick}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              <Bell className="w-5 h-5" />
            </button>
          )}
          
          {canViewSettings && (
            <button
              onClick={onSettingsClick}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          
          <button
            onClick={onProfileClick}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <User className="w-5 h-5" />
          </button>
          
          <button
            onClick={onLogout}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};
```

---

## API Integration

### 1. Enhanced User Service

```typescript
// File: frontend/src/services/userService.ts
import { apiClient } from '../api/apiClient';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
  permissions: string[];
  is_active: boolean;
  last_login?: string;
}

export class UserService {
  static async getCurrentUser(): Promise<User> {
    const response = await apiClient.get('/v1/auth/me');
    return response.data;
  }

  static async getUserRoles(userId: string): Promise<string[]> {
    const response = await apiClient.get(`/v1/users/${userId}/roles`);
    return response.data.map((role: any) => role.role_name);
  }

  static async getUserPermissions(userId: string): Promise<string[]> {
    const response = await apiClient.get(`/v1/permissions/user/${userId}`);
    return response.data;
  }

  static async getEffectivePermissions(userId: string): Promise<string[]> {
    const response = await apiClient.get(`/v1/permissions/user/${userId}`);
    return response.data;
  }
}
```

### 2. Permission Cache Service

```typescript
// File: frontend/src/services/permissionCache.ts
class PermissionCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  clearUserData(userId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(userId)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

export const permissionCache = new PermissionCache();
```

---

## Testing & Implementation

### 1. Permission Testing Utilities

```typescript
// File: frontend/src/utils/permissionTestUtils.ts
import { render, screen } from '@testing-library/react';
import { PermissionProvider } from '../contexts/PermissionContext';

export const renderWithPermissions = (
  component: React.ReactElement,
  permissions: string[] = [],
  roles: string[] = [],
  userId: string = 'test-user'
) => {
  return render(
    <PermissionProvider userId={userId}>
      {component}
    </PermissionProvider>
  );
};

export const mockPermissions = (permissions: string[]) => {
  jest.mock('../services/userPermissionsService', () => ({
    UserPermissionsService: {
      getEffectiveUserPermissions: jest.fn().mockResolvedValue(permissions)
    }
  }));
};

export const mockRoles = (roles: string[]) => {
  jest.mock('../services/rbacService', () => ({
    RBACService: {
      getUserRoles: jest.fn().mockResolvedValue(roles.map(role => ({ role_name: role })))
    }
  }));
};
```

### 2. Component Testing Examples

```typescript
// File: frontend/src/components/__tests__/PermissionWrapper.test.tsx
import React from 'react';
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
```

### 3. Implementation Steps

```bash
# 1. Install required dependencies
npm install react-router-dom @types/react-router-dom

# 2. Create the permission context and hooks
mkdir -p frontend/src/contexts
mkdir -p frontend/src/hooks
mkdir -p frontend/src/components
mkdir -p frontend/src/config

# 3. Update your main App component
# File: frontend/src/App.tsx
# Wrap your app with PermissionProvider

# 4. Update your authentication flow
# File: frontend/src/hooks/useAuth.ts
# Add user ID to the auth context

# 5. Test the implementation
npm run test
npm run dev
```

---

## Summary

This implementation provides:

✅ **Dynamic UI Rendering** - Components render based on user permissions  
✅ **Route Protection** - Routes are protected by permissions and roles  
✅ **Component-Level Access Control** - Individual components check permissions  
✅ **Dynamic Navigation** - Menus and navigation adapt to user permissions  
✅ **Permission Caching** - Efficient permission checking with caching  
✅ **Testing Utilities** - Tools for testing permission-based components  
✅ **TypeScript Support** - Full type safety throughout  
✅ **Performance Optimized** - Minimal re-renders and efficient permission checks  

## Key Benefits

1. **Security**: UI components are protected at the component level
2. **User Experience**: Users only see what they can access
3. **Maintainability**: Centralized permission logic
4. **Performance**: Cached permissions and optimized rendering
5. **Flexibility**: Easy to add new permissions and roles
6. **Testing**: Comprehensive testing utilities for permission-based components

This dynamic UI rendering system ensures that your application's interface adapts seamlessly to each user's role and permissions, providing a secure and personalized experience.







