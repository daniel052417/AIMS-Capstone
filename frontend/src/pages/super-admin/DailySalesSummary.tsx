import React, { useState } from 'react';
import { Calendar, TrendingUp, DollarSign, ShoppingCart, Clock, Target } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected

const DailySalesSummary: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Static data for demonstration
  const dailyMetrics = [
    {
      title: 'Total Sales',
      value: '₱45,250',
      change: '+8.5%',
      isPositive: true,
      icon: DollarSign,
      color: 'text-green-600 bg-green-50'
    },
    {
      title: 'Orders Count',
      value: '127',
      change: '+12.3%',
      isPositive: true,
      icon: ShoppingCart,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Average Order Value',
      value: '₱356',
      change: '-2.1%',
      isPositive: false,
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      title: 'Target Achievement',
      value: '90.5%',
      change: '+5.2%',
      isPositive: true,
      icon: Target,
      color: 'text-orange-600 bg-orange-50'
    }
  ];

  const hourlySales = [
    { hour: '8:00', sales: 2500, orders: 8 },
    { hour: '9:00', sales: 3200, orders: 12 },
    { hour: '10:00', sales: 4100, orders: 15 },
    { hour: '11:00', sales: 3800, orders: 14 },
    { hour: '12:00', sales: 5200, orders: 18 },
    { hour: '13:00', sales: 4800, orders: 16 },
    { hour: '14:00', sales: 3600, orders: 13 },
    { hour: '15:00', sales: 4200, orders: 15 },
    { hour: '16:00', sales: 3900, orders: 14 },
    { hour: '17:00', sales: 4500, orders: 17 },
    { hour: '18:00', sales: 3800, orders: 14 },
    { hour: '19:00', sales: 2200, orders: 8 }
  ];

  const topProducts = [
    { name: 'Premium Chicken Feed', sales: 8500, units: 25, percentage: 18.8 },
    { name: 'Antibiotic Solution', sales: 6200, units: 18, percentage: 13.7 },
    { name: 'Garden Tools Set', sales: 4800, units: 12, percentage: 10.6 },
    { name: 'Vitamin Supplements', sales: 3600, units: 15, percentage: 8.0 }
  ];

  const maxHourlySales = Math.max(...hourlySales.map(h => h.sales));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Sales Summary</h1>
          <p className="text-gray-600">Detailed daily sales performance and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Daily Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dailyMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${metric.color}`}>
                <metric.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className={`w-4 h-4 ${metric.isPositive ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
                <span className={`text-sm font-semibold ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`}>
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

      {/* Hourly Sales Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Hourly Sales Performance</h3>
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
        <div className="h-64 flex items-end space-x-1">
          {hourlySales.map((hour, index) => (
            <div key={index} className="flex-1 flex flex-col items-center space-y-1">
              <div className="w-full flex flex-col items-center space-y-1">
                <div 
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${(hour.sales / maxHourlySales) * 200}px` }}
                ></div>
                <div 
                  className="w-full bg-green-500 rounded-t"
                  style={{ height: `${(hour.orders / 20) * 200}px` }}
                ></div>
              </div>
              <span className="text-xs text-gray-600">{hour.hour}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products and Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Top Products Today</h3>
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
                  <p className="text-xs text-gray-500">{product.percentage}% of total</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Daily Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Peak Hour</p>
                  <p className="text-xs text-gray-500">Highest sales period</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">12:00 PM</p>
                <p className="text-xs text-green-600">₱5,200</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Busiest Time</p>
                  <p className="text-xs text-gray-500">Most orders placed</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">12:00 PM</p>
                <p className="text-xs text-blue-600">18 orders</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Target Status</p>
                  <p className="text-xs text-gray-500">Daily goal progress</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-purple-600">90.5%</p>
                <p className="text-xs text-purple-600">₱50,000 target</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySalesSummary;