import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Mail, Eye, MousePointer , Share, Calendar, Target } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected

const MarketingDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  // Static data for demonstration
  const marketingMetrics = [
    {
      title: 'Total Campaigns',
      value: '24',
      change: '+12.5%',
      isPositive: true,
      icon: BarChart3,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Active Campaigns',
      value: '8',
      change: '+2.1%',
      isPositive: true,
      icon: Target,
      color: 'text-green-600 bg-green-50'
    },
    {
      title: 'Total Reach',
      value: '12.5K',
      change: '+18.3%',
      isPositive: true,
      icon: Users,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      title: 'Engagement Rate',
      value: '4.2%',
      change: '+0.8%',
      isPositive: true,
      icon: TrendingUp,
      color: 'text-orange-600 bg-orange-50'
    }
  ];

  const campaignPerformance = [
    {
      name: 'Summer Sale 2024',
      status: 'active',
      reach: 2500,
      engagement: 4.8,
      clicks: 120,
      conversions: 45,
      budget: 5000,
      spent: 3200,
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    },
    {
      name: 'New Product Launch',
      status: 'active',
      reach: 1800,
      engagement: 3.2,
      clicks: 85,
      conversions: 28,
      budget: 3000,
      spent: 1800,
      startDate: '2024-01-10',
      endDate: '2024-01-25'
    },
    {
      name: 'Holiday Promotion',
      status: 'completed',
      reach: 3200,
      engagement: 5.1,
      clicks: 165,
      conversions: 62,
      budget: 4000,
      spent: 4000,
      startDate: '2023-12-01',
      endDate: '2023-12-31'
    },
    {
      name: 'Customer Retention',
      status: 'paused',
      reach: 1200,
      engagement: 2.8,
      clicks: 45,
      conversions: 15,
      budget: 2000,
      spent: 800,
      startDate: '2024-01-05',
      endDate: '2024-01-20'
    }
  ];

  const channelPerformance = [
    { channel: 'Email', campaigns: 8, reach: 4500, engagement: 4.2, cost: 1200 },
    { channel: 'Social Media', campaigns: 6, reach: 3200, engagement: 3.8, cost: 800 },
    { channel: 'SMS', campaigns: 4, reach: 2800, engagement: 5.1, cost: 600 },
    { channel: 'Display Ads', campaigns: 3, reach: 2000, engagement: 2.9, cost: 1500 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'completed':
        return 'text-blue-600 bg-blue-50';
      case 'paused':
        return 'text-yellow-600 bg-yellow-50';
      case 'draft':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Dashboard</h1>
          <p className="text-gray-600">Campaign performance and marketing analytics</p>
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
        {marketingMetrics.map((metric, index) => (
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

      {/* Campaign Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Campaign Performance</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reach
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spent
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaignPerformance.map((campaign, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-sm text-gray-500">{campaign.startDate} - {campaign.endDate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.reach.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.engagement}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.clicks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.conversions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(campaign.budget)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(campaign.spent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Channel Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Channel Performance</h3>
          <div className="space-y-4">
            {channelPerformance.map((channel, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{channel.channel}</p>
                    <p className="text-xs text-gray-500">{channel.campaigns} campaigns</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{channel.reach.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{channel.engagement}% engagement</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Campaign Launched</p>
                <p className="text-xs text-gray-500">Summer Sale 2024 started</p>
                <p className="text-xs text-gray-400">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Email Sent</p>
                <p className="text-xs text-gray-500">Newsletter to 2,500 subscribers</p>
                <p className="text-xs text-gray-400">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Audience Updated</p>
                <p className="text-xs text-gray-500">Customer segments refreshed</p>
                <p className="text-xs text-gray-400">1 day ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Campaign Scheduled</p>
                <p className="text-xs text-gray-500">Holiday promotion planned</p>
                <p className="text-xs text-gray-400">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">Total ROI</p>
            <p className="text-2xl font-bold text-green-600">285%</p>
            <p className="text-xs text-gray-500">+15% vs last month</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Average CTR</p>
            <p className="text-2xl font-bold text-blue-600">3.8%</p>
            <p className="text-xs text-gray-500">+0.5% vs last month</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Cost per Lead</p>
            <p className="text-2xl font-bold text-purple-600">₱45</p>
            <p className="text-xs text-gray-500">-₱8 vs last month</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingDashboard;