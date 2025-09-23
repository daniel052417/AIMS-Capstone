import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, BarChart3, Package, TrendingUp, AlertTriangle, ShoppingCart, 
  Users, FileText, Settings, Bell, Shield,
  Megaphone, Calendar, DollarSign,
  Archive, Warehouse, ChevronDown,
  Menu, X, LogOut, UserCheck,
  Clock, Key,  UserPlus,
  Grid3X3,  BookOpen,  Download
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
  const { hasPermission, hasRole } = usePermissions();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Default']);

  // Updated menu items based on your actual permissions from the database
 // Replace your menuItems array with this properly categorized version:

const menuItems: MenuItem[] = [
  // Dashboard - Standalone
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: Home, 
    category: 'Dashboard',
    path: '/dashboard',
  },
  
  // Inventory Management
  { 
    id: 'inventory-management', 
    label: 'Inventory Management', 
    icon: Warehouse, 
    category: 'Inventory Management',
    requiredPermissions: ['inventory.read'],
    children: [
      { 
        id: 'inventory-overview', 
        label: 'Inventory Overview', 
        icon: Package, 
        category: 'Inventory Management',
        path: '/inventory',
        requiredPermissions: ['inventory.read']
      },
      { 
        id: 'inventory-summary', 
        label: 'Inventory Summary', 
        icon: Archive, 
        category: 'Inventory Management',
        path: '/inventory/summary',
        requiredPermissions: ['products.read']
      },
      { 
        id: 'categories', 
        label: 'Categories', 
        icon: Grid3X3, 
        category: 'Inventory Management',
        path: '/inventory/categories',
        requiredPermissions: ['products.read']
      },
      { 
        id: 'low-stock', 
        label: 'Low Stock Alerts', 
        icon: AlertTriangle, 
        category: 'Inventory Management',
        path: '/inventory/low-stock',
        requiredPermissions: ['inventory.read']
      },
    ]
  },

  // Sales & POS
  { 
    id: 'sales-pos', 
    label: 'Sales & POS', 
    icon: ShoppingCart, 
    category: 'Sales & POS',
    requiredPermissions: ['sales.read', 'pos.access'],
    children: [
      // Sales Section
      { 
        id: 'sales-dashboard', 
        label: 'Sales Dashboard', 
        icon: TrendingUp, 
        category: 'Sales & POS',
        path: '/sales',
        requiredPermissions: ['sales.read']
      },
      { 
        id: 'all-sales-records', 
        label: 'All Sales Records', 
        icon: FileText, 
        category: 'Sales & POS',
        path: '/sales/records',
        requiredPermissions: ['sales.read']
      },
      { 
        id: 'product-sales', 
        label: 'Product Sales Report', 
        icon: BarChart3, 
        category: 'Sales & POS',
        path: '/sales/product-report',
        requiredPermissions: ['sales.read']
      },
      { 
        id: 'sales-value', 
        label: 'Sales Value', 
        icon: DollarSign, 
        category: 'Sales & POS',
        path: '/sales/value',
        requiredPermissions: ['sales.read']
      },
    ]
  },

  // Staff & User Management
  { 
    id: 'staff-user-management',
    label: 'Staff & User Management',
    icon: Shield, 
    category: 'Staff & User Management',
    requiredPermissions: ['users.read', 'roles.read', 'admin.overview'],
    children: [
      
      { 
        id: 'user-management', 
        label: 'User Management', 
        icon: Users, 
        category: 'Staff & User Management',
        path: '/admin/users',
        requiredPermissions: ['users.read']
      },
      { 
        id: 'roles-permissions', 
        label: 'Roles & Permissions', 
        icon: Shield, 
        category: 'Staff & User Management',
        path: '/admin/roles',
        requiredPermissions: ['roles.read']
      },
      { 
        id: 'user-permissions', 
        label: 'User Permissions', 
        icon: Key, 
        category: 'Staff & User Management',
        path: '/admin/user-permissions',
        requiredPermissions: ['users.read', 'roles.read']
      },
      { 
        id: 'active-users', 
        label: 'Active Users', 
        icon: UserCheck, 
        category: 'Staff & User Management',
        path: '/admin/active-users',
        requiredPermissions: ['admin.active_users']
      },
      { 
        id: 'user-activity', 
        label: 'User Activity', 
        icon: Clock, 
        category: 'Staff & User Management',
        path: '/admin/user-activity',
        requiredPermissions: ['admin.user_activity']
      },
    ] 
  },

  // HR Management
  { 
    id: 'hr-management',
    label: 'HR Management',
    icon: Users, 
    category: 'HR Management',
    requiredPermissions: ['hr.staff_read'],
    children: [
      { 
        id: 'hr-dashboard', 
        label: 'HR Dashboard', 
        icon: Home, 
        category: 'HR Management',
        path: '/hr',
        requiredPermissions: ['hr.staff_read']
      },
      { 
        id: 'add-staff', 
        label: 'Add Staff', 
        icon: UserPlus, 
        category: 'HR Management',
        path: '/hr/add-staff',
        requiredPermissions: ['hr.staff_create']
      },
      { 
        id: 'attendance-dashboard', 
        label: 'Attendance Dashboard', 
        icon: Clock, 
        category: 'HR Management',
        path: '/hr/attendance',
        requiredPermissions: ['hr.attendance_read']
      },
      { 
        id: 'attendance-timesheet', 
        label: 'Attendance Timesheet', 
        icon: FileText, 
        category: 'HR Management',
        path: '/hr/timesheet',
        requiredPermissions: ['hr.timesheet_manage']
      },
      { 
        id: 'hr-analytics', 
        label: 'HR Analytics', 
        icon: BarChart3, 
        category: 'HR Management',
        path: '/hr/analytics',
        requiredPermissions: ['hr.analytics']
      },
      { 
        id: 'leave-management', 
        label: 'Leave Management', 
        icon: Calendar, 
        category: 'HR Management',
        path: '/hr/leave-management',
        requiredPermissions: ['hr.leave_requests']
      },
      { 
        id: 'payroll', 
        label: 'Payroll & Compensation', 
        icon: DollarSign, 
        category: 'HR Management',
        path: '/hr/payroll',
        requiredPermissions: ['hr.payroll_read']
      },
      { 
        id: 'performance', 
        label: 'Performance Management', 
        icon: TrendingUp, 
        category: 'HR Management',
        path: '/hr/performance',
        requiredPermissions: ['hr.performance_read']
      },
      { 
        id: 'training', 
        label: 'Training Management', 
        icon: BookOpen, 
        category: 'HR Management',
        path: '/hr/training',
        requiredPermissions: ['hr.training_read']
      },
    ] 
  },

  // Marketing Management
  { 
    id: 'marketing-management', 
    label: 'Marketing Management', 
    icon: Megaphone, 
    category: 'Marketing Management',
    requiredPermissions: ['campaigns.read'],
    children: [
      { 
        id: 'marketing-dashboard', 
        label: 'Marketing Dashboard', 
        icon: BarChart3, 
        category: 'Marketing Management',
        path: '/marketing',
        requiredPermissions: ['campaigns.read']
      },
      { 
        id: 'campaign-management', 
        label: 'Campaign Management', 
        icon: Megaphone, 
        category: 'Marketing Management',
        path: '/marketing/campaigns',
        requiredPermissions: ['campaigns.read']
      },
      { 
        id: 'campaign-analytics', 
        label: 'Campaign Analytics', 
        icon: BarChart3, 
        category: 'Marketing Management',
        path: '/marketing/analytics',
        requiredPermissions: ['campaigns.analytics']
      },
      { 
        id: 'client-notifications', 
        label: 'Client Notifications', 
        icon: Bell, 
        category: 'Marketing Management',
        path: '/marketing/notifications',
        requiredPermissions: ['notifications.send']
      },
      { 
        id: 'template-management', 
        label: 'Template Management', 
        icon: FileText, 
        category: 'Marketing Management',
        path: '/marketing/templates',
        requiredPermissions: ['templates.read']
      },
    ]
  },
    
  // Reports & Analytics
  { 
    id: 'reports-analytics', 
    label: 'Reports & Analytics', 
    icon: FileText, 
    category: 'Reports & Analytics',
    children: [
      { 
        id: 'reports-dashboard', 
        label: 'Reports Dashboard', 
        icon: Home, 
        category: 'Reports & Analytics',
        path: '/reports',
        requiredPermissions: ['reports.read']
      },
      { 
        id: 'reports-analytics-detail', 
        label: 'Reports Analytics', 
        icon: BarChart3, 
        category: 'Reports & Analytics',
        path: '/reports/analytics',
        requiredPermissions: ['reports.analytics']
      },
      { 
        id: 'event-center', 
        label: 'Event Center', 
        icon: Calendar, 
        category: 'Reports & Analytics',
        path: '/reports/events',
        requiredPermissions: ['reports.events']
      },
      { 
        id: 'exports', 
        label: 'Export Reports', 
        icon: Download, 
        category: 'Reports & Analytics',
        path: '/reports/exports',
        requiredPermissions: ['reports.export']
      },
      { 
        id: 'claims', 
        label: 'Claims Management', 
        icon: FileText, 
        category: 'Reports & Analytics',
        path: '/claims',
        requiredPermissions: ['claims.read']
      },
    ]
  },

  // Settings - Standalone
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: Settings, 
    category: 'Settings',
    path: '/settings',
    requiredPermissions: ['settings.read']
  },
];

// Don't forget to add the missing icons at the top:
// import { Search, BookOpen, Eye, Download } from 'lucide-react';

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

  // Fallback: If no items are visible, show at least the dashboard
  const finalVisibleMenuItems = visibleMenuItems.length > 0 ? visibleMenuItems : [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Home, 
      category: 'Dashboard',
      path: '/dashboard',
    }
  ];

  // Group items by category, only including categories that have visible items
  const categories = [
    { name: 'Dashboard', items: finalVisibleMenuItems.filter(item => item.category === 'Dashboard') },
    { name: 'Inventory Management', items: finalVisibleMenuItems.filter(item => item.category === 'Inventory Management') },
    { name: 'Sales & POS', items: finalVisibleMenuItems.filter(item => item.category === 'Sales & POS') },
    { name: 'Staff & User Management', items: finalVisibleMenuItems.filter(item => item.category === 'Staff & User Management') },
    { name: 'HR Management', items: finalVisibleMenuItems.filter(item => item.category === 'HR Management') },
    { name: 'Marketing Management', items: finalVisibleMenuItems.filter(item => item.category === 'Marketing Management') },
    { name: 'Reports & Analytics', items: finalVisibleMenuItems.filter(item => item.category === 'Reports & Analytics') },
    { name: 'Settings', items: finalVisibleMenuItems.filter(item => item.category === 'Settings') },
  ].filter(category => category.items.length > 0); // Only show categories with items

  // Debug logging to help identify issues
  console.log('=== SIDEBAR DEBUG ===');
  console.log('User:', user);
  console.log('User permissions:', user?.permissions);
  console.log('User roles:', user?.roles);
  console.log('Total menu items:', menuItems.length);
  console.log('Visible menu items:', visibleMenuItems.length);
  console.log('Final visible items:', finalVisibleMenuItems.length);
  console.log('Categories:', categories);
  console.log('==================');

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
          {categories.length > 0 ? (
            categories.map(category => (
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
            ))
          ) : (
            // Fallback if no categories are found
            <div className="px-6 py-4 text-center text-gray-500">
              <p className="text-sm">No menu items available</p>
              <p className="text-xs mt-1">Check your permissions</p>
            </div>
          )}
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