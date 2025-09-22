import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Download, BarChart3, PieChart, Target } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected

const SalesValue: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  // Static data for demonstration
  const salesMetrics = [
    {
      title: 'Total Sales',
      value: '₱1,245,000',
      change: '+12.5%',
      isPositive: true,
      period: 'This Month',
      color: 'text-green-600',
      icon: 'sales' as const
    },
    {
      title: 'Total Orders',
      value: '1,247',
      change: '+8.2%',
      isPositive: true,
      period: 'This Month',
      color: 'text-blue-600',
      icon: 'order' as const
    },
    {
      title: 'Daily Average',
      value: '₱41,500',
      change: '+5.3%',
      isPositive: true,
      period: 'This Month',
      color: 'text-purple-600',
      icon: 'daily' as const
    },
    {
      title: 'Target Achievement',
      value: '98.5%',
      change: '+2.1%',
      isPositive: true,
      period: 'This Month',
      color: 'text-orange-600',
      icon: 'target' as const
    }
  ];

  const salesByCategory = [
    { category: 'Feeds', value: '₱450,000', percentage: 36.1, growth: '+15.2%', color: 'bg-red-500' },
    { category: 'Medicine', value: '₱320,000', percentage: 25.7, growth: '+8.7%', color: 'bg-green-500' },
    { category: 'Tools', value: '₱280,000', percentage: 22.5, growth: '+12.3%', color: 'bg-blue-500' },
    { category: 'Supplements', value: '₱195,000', percentage: 15.7, growth: '+6.8%', color: 'bg-purple-500' }
  ];

  const monthlyTrends = [
    { month: 'Jan', sales: 980000, target: 1000000, orders: 890 },
    { month: 'Feb', sales: 1120000, target: 1000000, orders: 1020 },
    { month: 'Mar', sales: 1080000, target: 1100000, orders: 980 },
    { month: 'Apr', sales: 1245000, target: 1200000, orders: 1247 },
    { month: 'May', sales: 1180000, target: 1200000, orders: 1150 },
    { month: 'Jun', sales: 1350000, target: 1300000, orders: 1280 }
  ];

  const topProducts = [
    { name: 'Premium Chicken Feed', sales: '₱125,000', units: 450, margin: '32%' },
    { name: 'Antibiotic Solution', sales: '₱89,000', units: 320, margin: '28%' },
    { name: 'Garden Tools Set', sales: '₱67,000', units: 180, margin: '35%' },
    { name: 'Vitamin Supplements', sales: '₱45,000', units: 250, margin: '25%' }
  ];

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'sales': return <DollarSign className="w-6 h-6" />;
      case 'order': return <BarChart3 className="w-6 h-6" />;
      case 'daily': return <TrendingUp className="w-6 h-6" />;
      case 'target': return <Target className="w-6 h-6" />;
      default: return <DollarSign className="w-6 h-6" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Value Analysis</h1>
          <p className="text-gray-600">Comprehensive sales performance metrics and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {salesMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${metric.color.replace('text-', 'bg-').replace('-600', '-50')}`}>
                {getIcon(metric.icon)}
              </div>
              <div className="flex items-center space-x-1">
                {metric.isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-semibold ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.change}
                </span>
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">{metric.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{metric.value}</h3>
              <p className="text-xs text-gray-500 mt-1">{metric.period}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sales by Category */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Sales by Category</h3>
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600">Distribution</span>
          </div>
        </div>
        <div className="space-y-4">
          {salesByCategory.map((category, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${category.color}`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{category.category}</p>
                  <p className="text-xs text-gray-500">{category.percentage}% of total sales</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{category.value}</p>
                <p className="text-xs text-green-600">{category.growth}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trends Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Monthly Sales Trends</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Actual Sales</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <span className="text-sm text-gray-600">Target</span>
            </div>
          </div>
        </div>
        <div className="h-64 flex items-end space-x-2">
          {monthlyTrends.map((trend, index) => (
            <div key={index} className="flex-1 flex flex-col items-center space-y-2">
              <div className="w-full flex flex-col items-center space-y-1">
                <div 
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${(trend.sales / 1400000) * 200}px` }}
                ></div>
                <div 
                  className="w-full bg-gray-300 rounded-t"
                  style={{ height: `${(trend.target / 1400000) * 200}px` }}
                ></div>
              </div>
              <span className="text-xs text-gray-600">{trend.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Top Selling Products</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>
          <div className="space-y-4">
          {topProducts.map((product, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.units} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{product.sales}</p>
                <p className="text-xs text-gray-500">{product.margin} margin</p>
              </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SalesValue;