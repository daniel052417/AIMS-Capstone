import React, { useState } from 'react';
import { AlertTriangle, Search, Filter, RefreshCw, Package, TrendingDown } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected

const LowStockAlerts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Static data for demonstration
  const lowStockItems = [
    {
      id: '1',
      name: 'Premium Chicken Feed',
      category: 'Feeds',
      sku: 'PCF-001',
      currentStock: 5,
      minimumStock: 20,
      unit: 'bags',
      priority: 'high',
      lastUpdated: '2 hours ago',
      supplier: 'ABC Feeds Inc.',
      reorderPoint: 15,
      estimatedDays: 2
    },
    {
      id: '2',
      name: 'Antibiotic Solution',
      category: 'Medicine',
      sku: 'AS-002',
      currentStock: 8,
      minimumStock: 15,
      unit: 'bottles',
      priority: 'high',
      lastUpdated: '1 hour ago',
      supplier: 'VetMed Supplies',
      reorderPoint: 10,
      estimatedDays: 3
    },
    {
      id: '3',
      name: 'Garden Tools Set',
      category: 'Tools',
      sku: 'GTS-003',
      currentStock: 12,
      minimumStock: 25,
      unit: 'sets',
      priority: 'medium',
      lastUpdated: '3 hours ago',
      supplier: 'ToolMaster Corp',
      reorderPoint: 20,
      estimatedDays: 5
    },
    {
      id: '4',
      name: 'Vitamin Supplements',
      category: 'Supplements',
      sku: 'VS-004',
      currentStock: 18,
      minimumStock: 30,
      unit: 'bottles',
      priority: 'medium',
      lastUpdated: '4 hours ago',
      supplier: 'NutriSupplies',
      reorderPoint: 25,
      estimatedDays: 7
    },
    {
      id: '5',
      name: 'Fertilizer Mix',
      category: 'Agriculture',
      sku: 'FM-005',
      currentStock: 22,
      minimumStock: 40,
      unit: 'kg',
      priority: 'low',
      lastUpdated: '5 hours ago',
      supplier: 'AgriGrow Ltd',
      reorderPoint: 35,
      estimatedDays: 10
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <TrendingDown className="w-4 h-4" />;
      case 'low':
        return <Package className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getStockPercentage = (current: number, minimum: number) => {
    return Math.min((current / minimum) * 100, 100);
  };

  const filteredItems = lowStockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = selectedPriority === 'all' || item.priority === selectedPriority;
    return matchesSearch && matchesPriority;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    // TODO: Replace with actual API call
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Low Stock Alerts</h1>
          <p className="text-gray-600">Monitor and manage low stock inventory items</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{lowStockItems.length}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">High Priority</p>
              <p className="text-2xl font-bold text-red-600">{lowStockItems.filter(item => item.priority === 'high').length}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Medium Priority</p>
              <p className="text-2xl font-bold text-orange-600">{lowStockItems.filter(item => item.priority === 'medium').length}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Low Priority</p>
              <p className="text-2xl font-bold text-yellow-600">{lowStockItems.filter(item => item.priority === 'low').length}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Items */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <div key={item.id} className={`p-6 rounded-xl border ${getPriorityColor(item.priority)}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getPriorityIcon(item.priority)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.category} • {item.sku}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(item.priority)}`}>
                  {item.priority.toUpperCase()} PRIORITY
                </span>
                <p className="text-xs text-gray-500 mt-1">Updated {item.lastUpdated}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Current Stock</p>
                <p className="text-lg font-semibold text-gray-900">{item.currentStock} {item.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Minimum Required</p>
                <p className="text-lg font-semibold text-gray-900">{item.minimumStock} {item.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estimated Days Left</p>
                <p className="text-lg font-semibold text-gray-900">{item.estimatedDays} days</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Stock Level</span>
                <span>{getStockPercentage(item.currentStock, item.minimumStock).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    item.priority === 'high' ? 'bg-red-500' : 
                    item.priority === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${getStockPercentage(item.currentStock, item.minimumStock)}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>Supplier: <span className="font-medium">{item.supplier}</span></p>
                <p>Reorder Point: <span className="font-medium">{item.reorderPoint} {item.unit}</span></p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium">
                  View Details
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Reorder Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No low stock items found</h3>
          <p className="text-gray-600">All products are well stocked or adjust your filters.</p>
        </div>
      )}
    </div>
  );
};

export default LowStockAlerts;