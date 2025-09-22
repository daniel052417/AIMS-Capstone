import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  Target, 
  Calendar,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

const CampaignAnalytics: React.FC = () => {
  const [selectedCampaign, setSelectedCampaign] = useState('1');
  const [dateRange, setDateRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const campaigns = [
    { id: '1', name: 'Summer Sale 2024', type: 'hero_banner' },
    { id: '2', name: 'New Product Launch', type: 'promo_card' },
    { id: '3', name: 'Veterinary Services', type: 'popup' }
  ];

  const analytics = {
    total_views: 1250,
    total_clicks: 89,
    total_conversions: 23,
    click_through_rate: 7.12,
    conversion_rate: 25.84,
    daily_stats: [
      { date: '2024-01-15', views: 150, clicks: 12, conversions: 3 },
      { date: '2024-01-14', views: 180, clicks: 15, conversions: 4 },
      { date: '2024-01-13', views: 120, clicks: 8, conversions: 2 },
      { date: '2024-01-12', views: 200, clicks: 18, conversions: 5 },
      { date: '2024-01-11', views: 160, clicks: 11, conversions: 3 },
      { date: '2024-01-10', views: 140, clicks: 9, conversions: 2 },
      { date: '2024-01-09', views: 170, clicks: 14, conversions: 4 }
    ]
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Campaign Analytics</h2>
          <p className="text-gray-600 mt-1">Track and analyze campaign performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          <button 
            onClick={() => setIsLoading(true)}
            className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Campaign Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Campaign
            </label>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a campaign...</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name} ({campaign.type.replace('_', ' ').toUpperCase()})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {selectedCampaign && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{formatNumber(analytics.total_views)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Total Views</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getChangeIcon(5.2)}
                  <span className="text-xs text-green-600">+5.2% vs last period</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-green-100">
                  <MousePointer className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{formatNumber(analytics.total_clicks)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Total Clicks</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getChangeIcon(12.8)}
                  <span className="text-xs text-green-600">+12.8% vs last period</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">{formatNumber(analytics.total_conversions)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Conversions</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getChangeIcon(8.4)}
                  <span className="text-xs text-green-600">+8.4% vs last period</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">{analytics.click_through_rate.toFixed(1)}%</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Click-through Rate</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getChangeIcon(2.1)}
                  <span className="text-xs text-green-600">+2.1% vs last period</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Over Time</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Performance chart will be displayed here</p>
                <p className="text-sm text-gray-400 mt-1">Integration with charting library needed</p>
              </div>
            </div>
          </div>

          {/* Daily Stats Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Daily Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.daily_stats.map((stat, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(stat.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.views.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.clicks.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.conversions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.views > 0 ? ((stat.clicks / stat.views) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!selectedCampaign && (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaign Selected</h3>
          <p className="text-gray-600">Select a campaign from the dropdown above to view analytics</p>
        </div>
      )}
    </div>
  );
};

export default CampaignAnalytics;