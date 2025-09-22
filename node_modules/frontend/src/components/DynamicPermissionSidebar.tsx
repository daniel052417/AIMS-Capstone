import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, BarChart3, Package, TrendingUp, AlertTriangle, ShoppingCart, 
  Users, FileText, Settings, Bell, Shield, MessageSquare,
  Megaphone, Calendar, DollarSign,
  Archive, Warehouse, ChevronDown,
  Menu, X, LogOut, UserCheck,
  Clock, Key, Building, Truck, CreditCard, UserPlus,
  Grid3X3
} from 'lucide-react';
import { usePermissions } from '../context/PermissionContext';
import { type UserProfile } from '../lib/supabase';
import logo from '../assets/logo.png';

interface SidebarProps {
  user: UserProfile;
  onLogout: () => void;
  className?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  category: string;
  path?: string;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  children?: MenuItem[];
  indent?: boolean;
}

const DynamicPermissionSidebar: React.FC<SidebarProps> = ({ user, onLogout, className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, hasRole, canAccess } = usePermissions();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Default']);

  // Updated menu items based on your actual permissions from the database
  const menuItems: MenuItem[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Home, 
      category: 'Default',
      path: '/dashboard',
      // No specific permission required for dashboard - everyone can see it
    },
    
    { 
      id: 'inventory-management', 
      label: 'Inventory Management', 
      icon: Warehouse, 
      category: 'Inventory',
      requiredPermissions: ['inventory.read'],
      children: [
        { 
          id: 'inventory-overview', 
          label: 'Inventory Overview', 
          icon: Package, 
          category: 'Inventory',
          path: '/inventory',
          requiredPermissions: ['inventory.read']
        },
        { 
          id: 'products', 
          label: 'Products', 
          icon: Archive, 
          category: 'Inventory',
          path: '/inventory/products',
          requiredPermissions: ['products.read']
        },
        { 
          id: 'categories', 
          label: 'Categories', 
          icon: Grid3X3, 
          category: 'Inventory',
          path: '/inventory/categories',
          requiredPermissions: ['products.read']
        },
        { 
          id: 'low-stock', 
          label: 'Low Stock Alerts', 
          icon: AlertTriangle, 
          category: 'Inventory',
          path: '/inventory/low-stock',
          requiredPermissions: ['inventory.read']
        },
        // Remove suppliers and purchase-orders for now
      ]
    },
    
    // Sales & POS
    { 
      id: 'sales-pos', 
      label: 'Sales & POS', 
      icon: ShoppingCart, 
      category: 'Sales',
      requiredPermissions: ['sales.read'],
      children: [
        { 
          id: 'sales-dashboard', 
          label: 'Sales Dashboard', 
          icon: TrendingUp, 
          category: 'Sales',
          path: '/sales',
          requiredPermissions: ['sales.read']
        },
        { 
          id: 'orders', 
          label: 'Orders', 
          icon: ShoppingCart, 
          category: 'Sales',
          path: '/sales/orders',
          requiredPermissions: ['orders.read']
        },
        { 
          id: 'customers', 
          label: 'Customers', 
          icon: Users, 
          category: 'Sales',
          path: '/sales/customers',
          requiredPermissions: ['customers.read']
        },
        { 
          id: 'payments', 
          label: 'Payments', 
          icon: CreditCard, 
          category: 'Sales',
          path: '/sales/payments',
          requiredPermissions: ['payments.read']
        },
      ]
    },
    
    // Administration (User & Role Management)
    { 
      id: 'administration',
      label: 'Administration',
      icon: Shield, 
      category: 'Admin',
      requiredPermissions: ['users.read', 'roles.read'], // Show if user has any admin permissions
      children: [
        { 
          id: 'user-management', 
          label: 'User Management', 
          icon: Users, 
          category: 'Admin',
          path: '/admin/users',
          requiredPermissions: ['users.read']
        },
        { 
          id: 'roles-permissions', 
          label: 'Roles & Permissions', 
          icon: Shield, 
          category: 'Admin',
          path: '/admin/roles',
          requiredPermissions: ['roles.read']
        },
        { 
          id: 'user-permissions', 
          label: 'User Permissions', 
          icon: Key, 
          category: 'Admin',
          path: '/admin/user-permissions',
          requiredPermissions: ['users.read', 'roles.read'] // Need both to manage user permissions
        },
      ] 
    },

    // Branches (if applicable)
    { 
      id: 'branches', 
      label: 'Branch Management', 
      icon: Building, 
      category: 'Operations',
      path: '/branches',
      requiredPermissions: ['branches.read']
    },
    
    // Marketing & Campaigns
    { 
      id: 'marketing', 
      label: 'Marketing', 
      icon: Megaphone, 
      category: 'Marketing',
      requiredPermissions: ['campaigns.read'],
      children: [
        { 
          id: 'marketing-dashboard', 
          label: 'Marketing Dashboard', 
          icon: BarChart3, 
          category: 'Marketing',
          path: '/marketing',
          requiredPermissions: ['campaigns.read']
        },
        { 
          id: 'campaigns', 
          label: 'Campaign Management', 
          icon: Megaphone, 
          category: 'Marketing',
          path: '/marketing/campaigns',
          requiredPermissions: ['campaigns.read']
        },
      ]
    },
    
    // Reports & Analytics
    { 
      id: 'reports', 
      label: 'Reports & Analytics', 
      icon: FileText, 
      category: 'Reports',
      children: [
        { 
          id: 'reports-overview', 
          label: 'Reports Overview', 
          icon: FileText, 
          category: 'Reports',
          path: '/reports',
          requiredPermissions: ['reports.sales', 'reports.inventory', 'reports.financial'] // Any report permission
        },
        { 
          id: 'sales-reports', 
          label: 'Sales Reports', 
          icon: TrendingUp, 
          category: 'Reports',
          path: '/reports/sales',
          requiredPermissions: ['reports.sales']
        },
        { 
          id: 'inventory-reports', 
          label: 'Inventory Reports', 
          icon: Package, 
          category: 'Reports',
          path: '/reports/inventory',
          requiredPermissions: ['reports.inventory']
        },
        { 
          id: 'financial-reports', 
          label: 'Financial Reports', 
          icon: DollarSign, 
          category: 'Reports',
          path: '/reports/financial',
          requiredPermissions: ['reports.financial']
        },
      ]
    },
    
    // System Settings
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      category: 'System',
      path: '/settings',
      requiredPermissions: ['settings.read']
    },
  ];

  // Filter menu items based on permissions - improved logic
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items.filter(item => {
      // If no permissions required, show to everyone (like dashboard)
      if (!item.requiredPermissions && !item.requiredRoles) {
        return true;
      }

      // Check if user has required permissions (if any permission matches, show it)
      let hasRequiredPermissions = true;
      if (item.requiredPermissions && item.requiredPermissions.length > 0) {
        hasRequiredPermissions = item.requiredPermissions.some(permission => 
          hasPermission(permission)
        );
      }

      // Check if user has required roles
      let hasRequiredRoles = true;
      if (item.requiredRoles && item.requiredRoles.length > 0) {
        hasRequiredRoles = item.requiredRoles.some(role => 
          hasRole(role)
        );
      }

      const hasAccess = hasRequiredPermissions && hasRequiredRoles;

      if (!hasAccess) return false;

      // If item has children, filter them too
      if (item.children) {
        item.children = filterMenuItems(item.children);
        // Show parent if it has accessible children OR its own path and permissions
        return item.children.length > 0 || (item.path && hasAccess);
      }

      return hasAccess;
    });
  };

  const visibleMenuItems = filterMenuItems([...menuItems]);

  const toggleCategory = (category: string) => {
    if (isCollapsed) return;
    
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleItemClick = (item: MenuItem) => {
    console.log('=== SIDEBAR NAVIGATION DEBUG ===');
    console.log('Clicked item:', item);
    console.log('Item path:', item.path);
    console.log('Current location:', location.pathname);
    console.log('User permissions:', user);
    console.log('Has children:', !!item.children);
    
    if (item.children && !isCollapsed) {
      console.log('Toggling category:', item.id);
      toggleCategory(item.id);
    } else if (item.path) {
      console.log('Navigating to:', item.path);
      navigate(item.path);
      console.log('Navigation called');
    } else {
      console.log('No path found for item:', item);
    }
  };

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedCategories.includes(item.id);

    return (
      <div key={item.id}>
        <button
          onClick={() => handleItemClick(item)}
          className={`w-full flex items-center justify-between group transition-all duration-200 rounded-lg mx-2 ${
            isChild ? 'pl-10 pr-4 py-2 ml-4' : 'px-4 py-3'
          } ${
            isActive
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          } ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="flex items-center min-w-0">
            <Icon className={`flex-shrink-0 transition-colors duration-200 ${
              isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
            } ${
              isCollapsed ? 'w-5 h-5' : 'w-4 h-4 mr-3'
            }`} />
            {!isCollapsed && (
              <span className={`text-sm font-medium truncate ${item.indent ? 'ml-4' : ''}`}>
                {item.label}
              </span>
            )}
          </div>
          
          {!isCollapsed && hasChildren && (
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            } ${
              isActive ? 'text-white' : 'text-gray-400'
            }`} />
          )}
        </button>

        {/* Children */}
        {!isCollapsed && hasChildren && isExpanded && (
          <div className="bg-gray-50/50">
            {item.children?.map(child => renderMenuItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  // Group items by category, only including categories that have visible items
  const categories = [
    { name: 'Default', items: visibleMenuItems.filter(item => item.category === 'Default') },
    { name: 'Inventory', items: visibleMenuItems.filter(item => item.category === 'Inventory') },
    { name: 'Sales', items: visibleMenuItems.filter(item => item.category === 'Sales') },
    { name: 'Operations', items: visibleMenuItems.filter(item => item.category === 'Operations') },
    { name: 'Admin', items: visibleMenuItems.filter(item => item.category === 'Admin') },
    { name: 'Marketing', items: visibleMenuItems.filter(item => item.category === 'Marketing') },
    { name: 'Reports', items: visibleMenuItems.filter(item => item.category === 'Reports') },
    { name: 'System', items: visibleMenuItems.filter(item => item.category === 'System') },
  ].filter(category => category.items.length > 0); // Only show categories with items

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <div className={`${
        isCollapsed ? 'w-16' : 'w-72'
      } bg-white shadow-xl h-screen overflow-hidden transition-all duration-300 ease-in-out flex flex-col relative z-50 ${className}`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b border-gray-100 ${
          isCollapsed ? 'px-3' : 'px-6'
        }`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg">
                <img src={logo} alt="AGRIVET" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-green-800">TIONGSON</h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 ${
              isCollapsed ? 'mx-auto' : ''
            }`}
          >
            {isCollapsed ? (
              <Menu className="w-5 h-5 text-gray-600" />
            ) : (
              <X className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {categories.map(category => (
            <div key={category.name}>
              {!isCollapsed && category.items.length > 0 && (
                <div className="px-6 py-2 mb-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {category.name}
                  </h3>
                </div>
              )}
              <div className="space-y-1">
                {category.items.map(item => renderMenuItem(item))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-100">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.first_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.role || 'user'}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-200 shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DynamicPermissionSidebar;