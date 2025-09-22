import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter, BarChart3, TrendingUp, PieChart, Users } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected

const ReportsDashboard: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState('sales');
  const [dateRange, setDateRange] = useState('monthly');

  // Static data for demonstration
  const reportTypes = [
    {
      id: 'sales',
      name: 'Sales Reports',
      description: 'Revenue, orders, and sales performance',
      icon: BarChart3,
      color: 'text-blue-600 bg-blue-50',
      count: 12
    },
    {
      id: 'inventory',
      name: 'Inventory Reports',
      description: 'Stock levels, movements, and valuation',
      icon: FileText,
      color: 'text-green-600 bg-green-50',
      count: 8
    },
    {
      id: 'financial',
      name: 'Financial Reports',
      description: 'P&L, cash flow, and financial metrics',
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-50',
      count: 6
    },
    {
      id: 'customer',
      name: 'Customer Reports',
      description: 'Customer analytics and behavior',
      icon: Users,
      color: 'text-orange-600 bg-orange-50',
      count: 10
    },
    {
      id: 'staff',
      name: 'Staff Reports',
      description: 'Performance, attendance, and HR metrics',
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50',
      count: 5
    },
    {
      id: 'marketing',
      name: 'Marketing Reports',
      description: 'Campaign performance and ROI',
      icon: PieChart,
      color: 'text-pink-600 bg-pink-50',
      count: 7
    }
  ];

  const recentReports = [
    {
      id: 1,
      name: 'Monthly Sales Summary',
      type: 'sales',
      generated: '2024-01-15',
      size: '2.4 MB',
      format: 'PDF',
      status: 'completed'
    },
    {
      id: 2,
      name: 'Inventory Valuation Report',
      type: 'inventory',
      generated: '2024-01-14',
      size: '1.8 MB',
      format: 'Excel',
      status: 'completed'
    },
    {
      id: 3,
      name: 'Customer Analytics Q4',
      type: 'customer',
      generated: '2024-01-13',
      size: '3.2 MB',
      format: 'PDF',
      status: 'completed'
    },
    {
      id: 4,
      name: 'Staff Performance Review',
      type: 'staff',
      generated: '2024-01-12',
      size: '1.5 MB',
      format: 'Excel',
      status: 'completed'
    },
    {
      id: 5,
      name: 'Marketing Campaign ROI',
      type: 'marketing',
      generated: '2024-01-11',
      size: '2.1 MB',
      format: 'PDF',
      status: 'completed'
    }
  ];

  const scheduledReports = [
    {
      id: 1,
      name: 'Weekly Sales Report',
      frequency: 'Weekly',
      nextRun: '2024-01-22',
      recipients: 5,
      status: 'active'
    },
    {
      id: 2,
      name: 'Monthly Inventory Report',
      frequency: 'Monthly',
      nextRun: '2024-02-01',
      recipients: 3,
      status: 'active'
    },
    {
      id: 3,
      name: 'Quarterly Financial Summary',
      frequency: 'Quarterly',
      nextRun: '2024-04-01',
      recipients: 8,
      status: 'active'
    },
    {
      id: 4,
      name: 'Daily Sales Summary',
      frequency: 'Daily',
      nextRun: '2024-01-16',
      recipients: 2,
      status: 'paused'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'paused':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatFileSize = (size: string) => {
    return size;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports Dashboard</h1>
          <p className="text-gray-600">Generate and manage business reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => (
          <div
            key={report.id}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow ${
              selectedReport === report.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedReport(report.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${report.color}`}>
                <report.icon className="w-6 h-6" />
              </div>
              <span className="text-sm text-gray-500">{report.count} reports</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.name}</h3>
              <p className="text-gray-600 text-sm">{report.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Report Generation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Generate New Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {reportTypes.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex items-center space-x-3">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
          <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Schedule Report</span>
          </button>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Reports</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {recentReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{report.name}</p>
                    <p className="text-xs text-gray-500">
                      Generated {report.generated} • {report.size} • {report.format}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Scheduled Reports</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Manage</button>
          </div>
          <div className="space-y-4">
            {scheduledReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{report.name}</p>
                    <p className="text-xs text-gray-500">
                      {report.frequency} • Next: {report.nextRun} • {report.recipients} recipients
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Report Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Report Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500">Total Reports</p>
            <p className="text-2xl font-bold text-gray-900">48</p>
            <p className="text-xs text-gray-500">+12 this month</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-gray-500">Downloads</p>
            <p className="text-2xl font-bold text-gray-900">1,234</p>
            <p className="text-xs text-gray-500">+156 this month</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm text-gray-500">Scheduled</p>
            <p className="text-2xl font-bold text-gray-900">8</p>
            <p className="text-xs text-gray-500">4 active, 4 paused</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-sm text-gray-500">Avg. Generation Time</p>
            <p className="text-2xl font-bold text-gray-900">2.3s</p>
            <p className="text-xs text-gray-500">-0.5s vs last month</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;

