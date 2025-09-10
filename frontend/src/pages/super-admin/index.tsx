import { useState } from 'react';
import Sidebar from '../../components/layouts/Sidebar';
import Header from '../../components/layouts/Header';
import Overview from './Overview';
import SalesValue from './SalesValue';
import AllSalesRecords from './AllSalesRecords';
import SalesDashboard from './SalesDashboard';
import DailySalesSummary from './DailySalesSummary';
import ProductSalesReport from './ProductSalesReport';
import InventorySummaryPage from './InventorySummaryPage';
import InventoryManagement from './InventoryManagement';
import AttendanceTimesheet from './AttendanceTimesheet';
import RolesPermissions from './RolesPermissions';
import LeaveRequest from './LeaveRequest';
import MarketingDashboard from './MarketingDashboard';
import CampaignManagement from './CampaignManagement';
import TemplateManagement from './TemplateManagement';
import CampaignAnalytics from './CampaignAnalytics';
import ClientNotifications from './ClientNotifications';
import EventCenter from './EventCenter';
import ReportsAnalytics from './ReportsAnalytics';
import SettingsPage from './SettingsPage';
import LowStockAlerts from './LowStockAlerts';
import Categories from './Categories';
import ActiveUsers from './ActiveUsers';
import UserAccounts from './UserAccounts';
import UserActivity from './UserActivity';
import AddStaff from './AddStaff';
import UserPermissions from './UserPermissions';
import HRDashboard from './HRDashboard';
import AttendanceDashboard from './AttendanceDashboard';
import LeaveManagement from './LeaveManagement';
import HRAnalytics from './HRAnalytics';
import PayrollCompensation from './PayrollCompensation';
import type { UserProfile } from '../../lib/supabase'; // ✅

interface AdminDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

function AdminDashboard({ onLogout }: AdminDashboardProps) {
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
      case 'user-activity':
        return <UserActivity />;
      case 'user-permissions':
        return <UserPermissions />;
      
      // Additional sections from original AdminDashboard
      case 'exports':
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Exports & Reports</h2>
              <p className="text-gray-600">Export data and generate reports</p>
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                <span className="text-sm">🚧 Under Development</span>
              </div>
            </div>
          </div>
        );
      case 'claims':
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Claims Management</h2>
              <p className="text-gray-600">Manage customer claims and returns</p>
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                <span className="text-sm">🚧 Under Development</span>
              </div>
            </div>
          </div>
        );
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
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
        onLogout={onLogout} 
      />
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
