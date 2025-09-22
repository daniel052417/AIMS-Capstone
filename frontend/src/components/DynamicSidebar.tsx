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