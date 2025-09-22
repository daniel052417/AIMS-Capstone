import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Can } from './Can';
import { usePermissions } from '../context/PermissionContext';
import { routes } from '../config/routes';

interface NavigationItemProps {
  route: {
    path: string;
    title: string;
    icon?: string;
    requiredPermissions?: string[];
    requiredRoles?: string[];
    children?: any[];
  };
  isActive: boolean;
}

const NavigationItem: React.FC<NavigationItemProps> = ({ route, isActive }) => {
  const { hasPermission, hasRole } = usePermissions();

  // Check if user has access to this route
  const hasAccess = () => {
    const hasRequiredPermissions = !route.requiredPermissions || 
      route.requiredPermissions.length === 0 || 
      route.requiredPermissions.some(permission => hasPermission(permission));
    
    const hasRequiredRoles = !route.requiredRoles || 
      route.requiredRoles.length === 0 || 
      route.requiredRoles.some(role => hasRole(role));
    
    return hasRequiredPermissions && hasRequiredRoles;
  };

  if (!hasAccess()) {
    return null;
  }

  return (
    <Link
      to={route.path}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {route.icon && (
        <div className="w-5 h-5 flex items-center justify-center">
          {/* You can replace this with actual icons */}
          <span className="text-lg">📊</span>
        </div>
      )}
      <span className="font-medium">{route.title}</span>
    </Link>
  );
};

interface DynamicNavigationProps {
  className?: string;
}

export const DynamicNavigation: React.FC<DynamicNavigationProps> = ({ className = '' }) => {
  const location = useLocation();

  const renderRoute = (route: any, level = 0) => {
    const isActive = location.pathname === route.path || 
      (route.children && route.children.some((child: any) => location.pathname === child.path));

    return (
      <div key={route.path} className={level > 0 ? 'ml-4' : ''}>
        <NavigationItem route={route} isActive={isActive} />
        
        {/* Render children if they exist and user has access */}
        {route.children && (
          <div className="mt-2 space-y-1">
            {route.children.map((child: any) => renderRoute(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className={`space-y-2 ${className}`}>
      {routes.map(route => renderRoute(route))}
    </nav>
  );
};

/**
 * Hook for checking if a route is accessible
 */
export const useRouteAccess = (path: string) => {
  const { hasPermission, hasRole } = usePermissions();
  
  const findRoute = (routes: any[], targetPath: string): any => {
    for (const route of routes) {
      if (route.path === targetPath) {
        return route;
      }
      if (route.children) {
        const found = findRoute(route.children, targetPath);
        if (found) return found;
      }
    }
    return null;
  };

  const route = findRoute(routes, path);
  
  if (!route) {
    return { hasAccess: false, isLoading: false };
  }

  const hasRequiredPermissions = !route.requiredPermissions || 
    route.requiredPermissions.length === 0 || 
    route.requiredPermissions.some(permission => hasPermission(permission));
  
  const hasRequiredRoles = !route.requiredRoles || 
    route.requiredRoles.length === 0 || 
    route.requiredRoles.some(role => hasRole(role));
  
  return {
    hasAccess: hasRequiredPermissions && hasRequiredRoles,
    isLoading: false
  };
};
