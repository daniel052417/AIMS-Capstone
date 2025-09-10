import React, { useState } from 'react';
import { TrendingUp, Target, Award, Users, BarChart3, Calendar, Filter, Download } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected

const Performance: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // Static data for demonstration
  const performanceMetrics = [
    {
      title: 'Overall Performance',
      value: '87.5%',
      change: '+5.2%',
      isPositive: true,
      icon: TrendingUp,
      color: 'text-green-600 bg-green-50'
    },
    {
      title: 'Goals Achieved',
      value: '23/28',
      change: '+3 this month',
      isPositive: true,
      icon: Target,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Top Performers',
      value: '12',
      change: '+2 this month',
      isPositive: true,
      icon: Award,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      title: 'Team Satisfaction',
      value: '4.2/5',
      change: '+0.3 this month',
      isPositive: true,
      icon: Users,
      color: 'text-orange-600 bg-orange-50'
    }
  ];

  const topPerformers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      department: 'Sales',
      position: 'Sales Manager',
      performance: 95,
      goals: 8,
      achieved: 7,
      rating: 4.8,
      avatar: ''
    },
    {
      id: 2,
      name: 'Michael Brown',
      department: 'Inventory',
      position: 'Inventory Clerk',
      performance: 92,
      goals: 6,
      achieved: 6,
      rating: 4.7,
      avatar: ''
    },
    {
      id: 3,
      name: 'Lisa Garcia',
      department: 'Marketing',
      position: 'Marketing Specialist',
      performance: 89,
      goals: 5,
      achieved: 4,
      rating: 4.5,
      avatar: ''
    },
    {
      id: 4,
      name: 'David Wilson',
      department: 'POS',
      position: 'POS Cashier',
      performance: 87,
      goals: 4,
      achieved: 4,
      rating: 4.3,
      avatar: ''
    }
  ];

  const departmentPerformance = [
    {
      department: 'Sales',
      performance: 89,
      goals: 15,
      achieved: 13,
      satisfaction: 4.2,
      turnover: 5.2
    },
    {
      department: 'Inventory',
      performance: 92,
      goals: 12,
      achieved: 11,
      satisfaction: 4.5,
      turnover: 2.1
    },
    {
      department: 'Marketing',
      performance: 85,
      goals: 10,
      achieved: 8,
      satisfaction: 4.0,
      turnover: 8.3
    },
    {
      department: 'POS',
      performance: 88,
      goals: 8,
      achieved: 7,
      satisfaction: 4.1,
      turnover: 6.7
    }
  ];

  const performanceGoals = [
    {
      id: 1,
      title: 'Increase Sales by 15%',
      department: 'Sales',
      target: 15,
      current: 12.5,
      deadline: '2024-03-31',
      status: 'on-track',
      priority: 'high'
    },
    {
      id: 2,
      title: 'Reduce Inventory Waste by 10%',
      department: 'Inventory',
      target: 10,
      current: 7.2,
      deadline: '2024-02-28',
      status: 'on-track',
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Improve Customer Satisfaction to 4.5',
      department: 'Marketing',
      target: 4.5,
      current: 4.2,
      deadline: '2024-04-30',
      status: 'on-track',
      priority: 'high'
    },
    {
      id: 4,
      title: 'Reduce POS Errors by 20%',
      department: 'POS',
      target: 20,
      current: 15,
      deadline: '2024-03-15',
      status: 'behind',
      priority: 'medium'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'text-green-600 bg-green-50';
      case 'behind':
        return 'text-red-600 bg-red-50';
      case 'completed':
        return 'text-blue-600 bg-blue-50';
      case 'not-started':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600';
    if (performance >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Management</h1>
          <p className="text-gray-600">Track and manage employee performance and goals</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Departments</option>
            <option value="sales">Sales</option>
            <option value="inventory">Inventory</option>
            <option value="marketing">Marketing</option>
            <option value="pos">POS</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => (
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

      {/* Top Performers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Top Performers</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Goals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topPerformers.map((performer) => (
                <tr key={performer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-semibold text-blue-600">
                          {performer.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{performer.name}</div>
                        <div className="text-sm text-gray-500">{performer.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {performer.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${performer.performance}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium ${getPerformanceColor(performer.performance)}`}>
                        {performer.performance}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {performer.achieved}/{performer.goals}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className="text-yellow-400">★</span>
                      <span className="ml-1">{performer.rating}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Department Performance</h3>
          <div className="space-y-4">
            {departmentPerformance.map((dept, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{dept.department}</h4>
                  <span className={`text-sm font-semibold ${getPerformanceColor(dept.performance)}`}>
                    {dept.performance}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${dept.performance}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Goals: {dept.achieved}/{dept.goals}</span>
                  <span>Satisfaction: {dept.satisfaction}/5</span>
                  <span>Turnover: {dept.turnover}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Performance Goals</h3>
          <div className="space-y-4">
            {performanceGoals.map((goal) => (
              <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{goal.title}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(goal.status)}`}>
                      {goal.status.replace('-', ' ')}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(goal.priority)}`}>
                      {goal.priority}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(goal.current / goal.target) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Progress: {goal.current}/{goal.target}</span>
                  <span>Deadline: {goal.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-900">Set Goals</p>
          </button>
          <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-900">Give Recognition</p>
          </button>
          <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-purple-900">View Reports</p>
          </button>
          <button className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <Download className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-orange-900">Export Data</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Performance;

