import React, { useState } from 'react';
import { BookOpen, Play, Users, Award, Calendar, Filter, Download, Plus } from 'lucide-react';
// TODO: Replace with actual API calls when backend is connected

const Training: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Static data for demonstration
  const trainingMetrics = [
    {
      title: 'Total Courses',
      value: '24',
      change: '+3 this month',
      isPositive: true,
      icon: BookOpen,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Active Learners',
      value: '89',
      change: '+12 this week',
      isPositive: true,
      icon: Users,
      color: 'text-green-600 bg-green-50'
    },
    {
      title: 'Completed Courses',
      value: '156',
      change: '+28 this month',
      isPositive: true,
      icon: Award,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      title: 'Average Score',
      value: '87.5%',
      change: '+2.1% this month',
      isPositive: true,
      icon: Play,
      color: 'text-orange-600 bg-orange-50'
    }
  ];

  const courses = [
    {
      id: 1,
      title: 'Customer Service Excellence',
      category: 'Customer Service',
      duration: '2 hours',
      difficulty: 'Beginner',
      enrolled: 45,
      completed: 32,
      averageScore: 89,
      status: 'active',
      instructor: 'Sarah Johnson',
      lastUpdated: '2024-01-10'
    },
    {
      id: 2,
      title: 'Inventory Management Basics',
      category: 'Inventory',
      duration: '3 hours',
      difficulty: 'Intermediate',
      enrolled: 28,
      completed: 18,
      averageScore: 85,
      status: 'active',
      instructor: 'Michael Brown',
      lastUpdated: '2024-01-08'
    },
    {
      id: 3,
      title: 'Sales Techniques & Strategies',
      category: 'Sales',
      duration: '4 hours',
      difficulty: 'Advanced',
      enrolled: 35,
      completed: 22,
      averageScore: 92,
      status: 'active',
      instructor: 'Lisa Garcia',
      lastUpdated: '2024-01-12'
    },
    {
      id: 4,
      title: 'POS System Training',
      category: 'POS',
      duration: '1.5 hours',
      difficulty: 'Beginner',
      enrolled: 52,
      completed: 48,
      averageScore: 94,
      status: 'active',
      instructor: 'David Wilson',
      lastUpdated: '2024-01-15'
    },
    {
      id: 5,
      title: 'Marketing Fundamentals',
      category: 'Marketing',
      duration: '2.5 hours',
      difficulty: 'Intermediate',
      enrolled: 31,
      completed: 25,
      averageScore: 88,
      status: 'active',
      instructor: 'Ana Rodriguez',
      lastUpdated: '2024-01-09'
    },
    {
      id: 6,
      title: 'Workplace Safety',
      category: 'Safety',
      duration: '1 hour',
      difficulty: 'Beginner',
      enrolled: 67,
      completed: 67,
      averageScore: 96,
      status: 'completed',
      instructor: 'Carlos Mendoza',
      lastUpdated: '2024-01-05'
    }
  ];

  const recentCompletions = [
    {
      id: 1,
      employee: 'Maria Santos',
      course: 'Customer Service Excellence',
      completedDate: '2024-01-15',
      score: 92,
      certificate: true
    },
    {
      id: 2,
      employee: 'John Dela Cruz',
      course: 'Inventory Management Basics',
      completedDate: '2024-01-14',
      score: 88,
      certificate: true
    },
    {
      id: 3,
      employee: 'Ana Rodriguez',
      course: 'Sales Techniques & Strategies',
      completedDate: '2024-01-13',
      score: 95,
      certificate: true
    },
    {
      id: 4,
      employee: 'Carlos Mendoza',
      course: 'POS System Training',
      completedDate: '2024-01-12',
      score: 91,
      certificate: true
    }
  ];

  const upcomingSessions = [
    {
      id: 1,
      title: 'Customer Service Excellence',
      date: '2024-01-20',
      time: '10:00 AM',
      duration: '2 hours',
      instructor: 'Sarah Johnson',
      enrolled: 15,
      maxCapacity: 20,
      location: 'Training Room A'
    },
    {
      id: 2,
      title: 'Inventory Management Basics',
      date: '2024-01-22',
      time: '2:00 PM',
      duration: '3 hours',
      instructor: 'Michael Brown',
      enrolled: 12,
      maxCapacity: 15,
      location: 'Training Room B'
    },
    {
      id: 3,
      title: 'Sales Techniques & Strategies',
      date: '2024-01-25',
      time: '9:00 AM',
      duration: '4 hours',
      instructor: 'Lisa Garcia',
      enrolled: 18,
      maxCapacity: 25,
      location: 'Conference Room'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'text-green-600 bg-green-50';
      case 'Intermediate':
        return 'text-yellow-600 bg-yellow-50';
      case 'Advanced':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'completed':
        return 'text-blue-600 bg-blue-50';
      case 'draft':
        return 'text-gray-600 bg-gray-50';
      case 'archived':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training & Development</h1>
          <p className="text-gray-600">Manage employee training programs and development</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {trainingMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${metric.color}`}>
                <metric.icon className="w-6 h-6" />
              </div>
              <div className="text-sm text-gray-500">
                {metric.change}
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">{metric.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{metric.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="Customer Service">Customer Service</option>
              <option value="Inventory">Inventory</option>
              <option value="Sales">Sales</option>
              <option value="POS">POS</option>
              <option value="Marketing">Marketing</option>
              <option value="Safety">Safety</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Training Courses</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrolled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{course.title}</div>
                      <div className="text-sm text-gray-500">by {course.instructor}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {course.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {course.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(course.difficulty)}`}>
                      {course.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {course.enrolled}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {course.completed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`font-medium ${getScoreColor(course.averageScore)}`}>
                      {course.averageScore}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}>
                      {course.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Completions and Upcoming Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Completions</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {recentCompletions.map((completion) => (
              <div key={completion.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{completion.employee}</p>
                    <p className="text-xs text-gray-500">{completion.course}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${getScoreColor(completion.score)}`}>
                    {completion.score}%
                  </p>
                  <p className="text-xs text-gray-500">{completion.completedDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Upcoming Sessions</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{session.title}</h4>
                  <span className="text-sm text-gray-500">{session.enrolled}/{session.maxCapacity}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{session.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Play className="w-4 h-4" />
                    <span>{session.time}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{session.location}</span>
                  </div>
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
            <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-900">Create Course</p>
          </button>
          <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-900">Assign Training</p>
          </button>
          <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-purple-900">View Certificates</p>
          </button>
          <button className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <Download className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-orange-900">Export Reports</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Training;

