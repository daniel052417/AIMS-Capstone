import { useState } from 'react';
import Sidebar from '../components/layouts/Sidebar';
import Header from '../components/layouts/Header';
import Overview from '../pages/super-admin/Overview';
import SalesValue from '../pages/super-admin/SalesValue';
import AllSalesRecords from '../pages/super-admin/AllSalesRecords';
import SalesDashboard from '../pages/super-admin/SalesDashboard';
import DailySalesSummary from '../pages/super-admin/DailySalesSummary';
import ProductSalesReport from '../pages/super-admin/ProductSalesReport';
import InventorySummaryPage from '../pages/super-admin/InventorySummaryPage';
import InventoryManagement from '../pages/super-admin/InventoryManagement';
import AttendanceTimesheet from '../pages/super-admin/AttendanceTimesheet';
import RolesPermissions from '../pages/super-admin/RolesPermissions';
import LeaveRequest from '../pages/super-admin/LeaveRequest';
import MarketingDashboard from '../pages/super-admin/MarketingDashboard';
import CampaignManagement from '../pages/super-admin/CampaignManagement';
import TemplateManagement from '../pages/super-admin/TemplateManagement';
import CampaignAnalytics from '../pages/super-admin/CampaignAnalytics';
import ClientNotifications from '../pages/super-admin/ClientNotifications';
import EventCenter from '../pages/super-admin/EventCenter';
import ReportsAnalytics from '../pages/super-admin/ReportsAnalytics';
import SettingsPage from '../pages/super-admin/SettingsPage';
import LowStockAlerts from '../pages/super-admin/LowStockAlerts';
import Categories from '../pages/super-admin/Categories';
import ActiveUsers from '../pages/super-admin/ActiveUsers';
import UserAccounts from '../pages/super-admin/UserAccounts';
import UserActivity from '../pages/super-admin/UserActivity';
import AddStaff from '../pages/super-admin/AddStaff';
import UserPermissions from '../pages/super-admin/UserPermissions';
import HRDashboard from '../pages/super-admin/HRDashboard';
import AttendanceDashboard from '../pages/super-admin/AttendanceDashboard';
import LeaveManagement from '../pages/super-admin/LeaveManagement';
import HRAnalytics from '../pages/super-admin/HRAnalytics';
import PayrollCompensation from '../pages/super-admin/PayrollCompensation';
import { UserProfile } from '../lib/supabase';

interface AdminDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

function AdminDashboard({onLogout}: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

   const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <Overview />;
      case 'sales-value':
        return <SalesValue />;
      case 'sales-records':
        return <AllSalesRecords />;
      case 'sales-dashboard':
        return <SalesDashboard />;
      case 'daily-sales':
        return <DailySalesSummary />;
      case 'product-sales':
        return <ProductSalesReport />;
      case 'inventory-summary':
        return <InventorySummaryPage />;
      case 'inventory-management':
      case 'all-products':
        return <InventoryManagement />;
      case 'categories':
        return <Categories />;
      case 'feeds':
      case 'medicine':
      case 'agriculture':
      case 'tools':
        return <InventoryManagement />;
      case 'low-stock':
        return <LowStockAlerts />;
      
      // Staff & User Management Section
      case 'staff-user-management':
        return <UserAccounts />;
      case 'user-accounts':
        return <UserAccounts />;
      case 'add-staff':
        return <AddStaff onBack={() => setActiveSection('user-accounts')} />;
      case 'roles-permissions':
        return <RolesPermissions />;
      case 'activity-logs':
        return <UserActivity />;
      
      // Legacy staff management routes (for backward compatibility)
      case 'staff':
      case 'staff-management':
        return <UserAccounts />;
      case 'attendance':
        return <AttendanceTimesheet />;
      case 'leave':
        return <LeaveRequest />;
      case 'marketing':
      case 'marketing-dashboard':
        return <MarketingDashboard />;
      case 'campaigns':
        return <CampaignManagement />;
      case 'templates':
        return <TemplateManagement />;
      case 'analytics':
        return <CampaignAnalytics />;
      case 'notifications':
        return <ClientNotifications />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'event-center':
        return <EventCenter />;
      case 'settings':
        return <SettingsPage />;
      
      // HR Section (Simplified)
      case 'hr':
        return <HRDashboard />;
      case 'hr-dashboard':
        return <HRDashboard />;
      case 'attendance-dashboard':
        return <AttendanceDashboard />;
      case 'leave-management':
        return <LeaveManagement />;
      case 'hr-analytics':
        return <HRAnalytics />;
      case 'attendance-leave':
        return <AttendanceDashboard />;
      case 'payroll':
        return <PayrollCompensation />;
      
      // Legacy HR routes (for backward compatibility)
      case 'hr-dashboard':
        return <HRDashboard />;
      case 'employees':
        return <UserAccounts />;
      case 'performance':
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Performance Management</h2>
              <p className="text-gray-600">Coming soon - Performance tracking and reviews</p>
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                <span className="text-sm">🚧 Under Development</span>
              </div>
            </div>
          </div>
        );
      case 'training':
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Training & Development</h2>
              <p className="text-gray-600">Coming soon - Learning management system</p>
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                <span className="text-sm">🚧 Under Development</span>
              </div>
            </div>
          </div>
        );
      case 'active-users':
        return <ActiveUsers />;
      case 'user-accounts':
        return <UserAccounts />;
      case 'user-activity':
        return <UserActivity />;
      case 'user-permissions':
        return <UserPermissions />;
      default:
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {activeSection.replace('-', ' ').toUpperCase()}
              </h2>
              <p className="text-gray-600">This section is under development.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} onLogout={onLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;

