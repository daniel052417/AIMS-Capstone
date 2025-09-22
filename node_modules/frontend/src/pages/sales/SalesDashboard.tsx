import React, { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Calendar, Target } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected

const SalesDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  // Static data for demonstration
  const salesMetrics = [
    {
      title: 'Total Revenue',
      value: '₱1,245,000',
      change: '+12.5%',
      isPositive: true,
      icon: DollarSign,
      color: 'text-green-600 bg-green-50'
    },
    {
      title: 'Total Orders',
      value: '1,247',
      change: '+8.2%',
      isPositive: true,
      icon: ShoppingCart,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Average Order Value',
      value: '₱998',
      change: '+4.1%',
      isPositive: true,
      icon: BarChart3,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      title: 'Conversion Rate',
      value: '3.2%',
      change: '+0.5%',
      isPositive: true,
      icon: Target,
      color: 'text-orange-600 bg-orange-50'
    }
  ];

  const dailySales = [
    { day: 'Mon', sales: 45000, orders: 45 },
    { day: 'Tue', sales: 52000, orders: 52 },
    { day: 'Wed', sales: 48000, orders: 48 },
    { day: 'Thu', sales: 61000, orders: 61 },
    { day: 'Fri', sales: 55000, orders: 55 },
    { day: 'Sat', sales: 67000, orders: 67 },
    { day: 'Sun', sales: 72000, orders: 72 }
  ];

  const topProducts = [
    { name: 'Premium Chicken Feed', sales: 125000, units: 450, growth: 18.5 },
    { name: 'Antibiotic Solution', sales: 89000, units: 320, growth: 12.3 },
    { name: 'Garden Tools Set', sales: 67000, units: 180, growth: -5.2 },
    { name: 'Vitamin Supplements', sales: 45000, units: 250, growth: 8.7 }
  ];

  const maxSales = Math.max(...dailySales.map(d => d.sales));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-gray-600">Real-time sales performance and analytics</p>
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
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {salesMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${metric.color}`}>
                <metric.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-600">
                  {metric.change}
                </span>
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">{metric.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{metric.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Sales Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Daily Sales Performance</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Sales (₱)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Orders</span>
            </div>
          </div>
        </div>
        <div className="h-64 flex items-end space-x-2">
          {dailySales.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center space-y-2">
              <div className="w-full flex flex-col items-center space-y-1">
                <div 
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${(day.sales / maxSales) * 200}px` }}
                ></div>
                <div 
                  className="w-full bg-green-500 rounded-t"
                  style={{ height: `${(day.orders / 100) * 200}px` }}
                ></div>
              </div>
              <span className="text-xs text-gray-600">{day.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Top Selling Products</h3>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
                  <p className="text-sm font-semibold text-gray-900">₱{product.sales.toLocaleString()}</p>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className={`w-3 h-3 ${product.growth >= 0 ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
                    <span className={`text-xs ${product.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.growth >= 0 ? '+' : ''}{product.growth.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Sales Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">This Month</p>
                  <p className="text-xs text-gray-500">January 2024</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">₱1,245,000</p>
                <p className="text-xs text-green-600">+12.5% vs last month</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Target Achievement</p>
                  <p className="text-xs text-gray-500">Monthly goal</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">98.5%</p>
                <p className="text-xs text-blue-600">₱1,200,000 target</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Best Day</p>
                  <p className="text-xs text-gray-500">This week</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-purple-600">Sunday</p>
                <p className="text-xs text-purple-600">₱72,000</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;