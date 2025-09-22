import React, { useState } from 'react';
import { Download, FileText, Calendar, Filter, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected

const Exports: React.FC = () => {
  const [selectedType, setSelectedType] = useState('sales');
  const [selectedFormat, setSelectedFormat] = useState('excel');
  const [dateRange, setDateRange] = useState('monthly');

  // Static data for demonstration
  const exportTypes = [
    {
      id: 'sales',
      name: 'Sales Reports',
      description: 'Revenue, orders, and sales performance data',
      icon: FileText,
      color: 'text-blue-600 bg-blue-50',
      lastExported: '2024-01-15',
      recordCount: 1250
    },
    {
      id: 'inventory',
      name: 'Inventory Reports',
      description: 'Stock levels, movements, and valuation data',
      icon: FileText,
      color: 'text-green-600 bg-green-50',
      lastExported: '2024-01-14',
      recordCount: 890
    },
    {
      id: 'customer',
      name: 'Customer Reports',
      description: 'Customer analytics and behavior data',
      icon: FileText,
      color: 'text-purple-600 bg-purple-50',
      lastExported: '2024-01-13',
      recordCount: 2100
    },
    {
      id: 'staff',
      name: 'Staff Reports',
      description: 'Employee performance and attendance data',
      icon: FileText,
      color: 'text-orange-600 bg-orange-50',
      lastExported: '2024-01-12',
      recordCount: 156
    },
    {
      id: 'financial',
      name: 'Financial Reports',
      description: 'P&L, cash flow, and financial metrics',
      icon: FileText,
      color: 'text-red-600 bg-red-50',
      lastExported: '2024-01-11',
      recordCount: 450
    },
    {
      id: 'marketing',
      name: 'Marketing Reports',
      description: 'Campaign performance and ROI data',
      icon: FileText,
      color: 'text-pink-600 bg-pink-50',
      lastExported: '2024-01-10',
      recordCount: 320
    }
  ];

  const recentExports = [
    {
      id: 1,
      name: 'Monthly Sales Summary',
      type: 'sales',
      format: 'Excel',
      size: '2.4 MB',
      exported: '2024-01-15',
      status: 'completed',
      records: 1250
    },
    {
      id: 2,
      name: 'Inventory Valuation Report',
      type: 'inventory',
      format: 'PDF',
      size: '1.8 MB',
      exported: '2024-01-14',
      status: 'completed',
      records: 890
    },
    {
      id: 3,
      name: 'Customer Analytics Q4',
      type: 'customer',
      format: 'CSV',
      size: '3.2 MB',
      exported: '2024-01-13',
      status: 'completed',
      records: 2100
    },
    {
      id: 4,
      name: 'Staff Performance Review',
      type: 'staff',
      format: 'Excel',
      size: '1.5 MB',
      exported: '2024-01-12',
      status: 'completed',
      records: 156
    },
    {
      id: 5,
      name: 'Financial Summary',
      type: 'financial',
      format: 'PDF',
      size: '2.1 MB',
      exported: '2024-01-11',
      status: 'processing',
      records: 450
    },
    {
      id: 6,
      name: 'Marketing Campaign ROI',
      type: 'marketing',
      format: 'Excel',
      size: '1.9 MB',
      exported: '2024-01-10',
      status: 'failed',
      records: 320
    }
  ];

  const scheduledExports = [
    {
      id: 1,
      name: 'Weekly Sales Report',
      type: 'sales',
      frequency: 'Weekly',
      nextRun: '2024-01-22',
      format: 'Excel',
      status: 'active',
      recipients: 5
    },
    {
      id: 2,
      name: 'Monthly Inventory Report',
      type: 'inventory',
      frequency: 'Monthly',
      nextRun: '2024-02-01',
      format: 'PDF',
      status: 'active',
      recipients: 3
    },
    {
      id: 3,
      name: 'Quarterly Financial Summary',
      type: 'financial',
      frequency: 'Quarterly',
      nextRun: '2024-04-01',
      format: 'PDF',
      status: 'active',
      recipients: 8
    },
    {
      id: 4,
      name: 'Daily Sales Summary',
      type: 'sales',
      frequency: 'Daily',
      nextRun: '2024-01-16',
      format: 'CSV',
      status: 'paused',
      recipients: 2
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'paused':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatFileSize = (size: string) => {
    return size;
  };

  const handleExport = () => {
    // TODO: Implement actual export functionality
    console.log('Exporting:', { selectedType, selectedFormat, dateRange });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Exports</h1>
          <p className="text-gray-600">Export and download business data in various formats</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Now</span>
          </button>
        </div>
      </div>

      {/* Export Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exportTypes.map((exportType) => (
          <div
            key={exportType.id}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow ${
              selectedType === exportType.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedType(exportType.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${exportType.color}`}>
                <exportType.icon className="w-6 h-6" />
              </div>
              <span className="text-sm text-gray-500">{exportType.recordCount} records</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{exportType.name}</h3>
              <p className="text-gray-600 text-sm mb-3">{exportType.description}</p>
              <p className="text-xs text-gray-500">Last exported: {exportType.lastExported}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Export Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Export Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {exportTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="excel">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
              <option value="pdf">PDF (.pdf)</option>
              <option value="json">JSON (.json)</option>
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
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Now</span>
          </button>
          <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Schedule Export</span>
          </button>
        </div>
      </div>

      {/* Recent Exports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Exports</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {recentExports.map((exportItem) => (
              <div key={exportItem.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{exportItem.name}</p>
                    <p className="text-xs text-gray-500">
                      {exportItem.format} • {exportItem.size} • {exportItem.records} records
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(exportItem.status)}`}>
                    <span className="flex items-center space-x-1">
                      {getStatusIcon(exportItem.status)}
                      <span>{exportItem.status}</span>
                    </span>
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
            <h3 className="text-lg font-semibold text-gray-800">Scheduled Exports</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Manage</button>
          </div>
          <div className="space-y-4">
            {scheduledExports.map((scheduled) => (
              <div key={scheduled.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{scheduled.name}</p>
                    <p className="text-xs text-gray-500">
                      {scheduled.frequency} • Next: {scheduled.nextRun} • {scheduled.recipients} recipients
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(scheduled.status)}`}>
                    {scheduled.status}
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

      {/* Export Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Export Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500">Total Exports</p>
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
              <RefreshCw className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-sm text-gray-500">Avg. Export Time</p>
            <p className="text-2xl font-bold text-gray-900">2.3s</p>
            <p className="text-xs text-gray-500">-0.5s vs last month</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exports;

