import React, { useState } from 'react';
import { Calendar, Plus, Search, Filter, MapPin, Clock, Users, Eye, Edit, Trash2, CheckCircle, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';

const EventCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const eventCategories = [
    { id: 'meeting', name: 'Meetings', color: 'bg-blue-100 text-blue-800', icon: Users },
    { id: 'training', name: 'Training', color: 'bg-green-100 text-green-800', icon: Users },
    { id: 'conference', name: 'Conferences', color: 'bg-purple-100 text-purple-800', icon: Users },
    { id: 'social', name: 'Social Events', color: 'bg-pink-100 text-pink-800', icon: Users },
    { id: 'maintenance', name: 'Maintenance', color: 'bg-orange-100 text-orange-800', icon: Users },
    { id: 'other', name: 'Other', color: 'bg-gray-100 text-gray-800', icon: Users }
  ];

  const events = [
    {
      id: '1',
      title: 'Monthly Sales Review Meeting',
      description: 'Review monthly sales performance and discuss strategies for next month',
      category: 'meeting',
      startDate: '2024-01-20',
      endDate: '2024-01-20',
      startTime: '10:00',
      endTime: '11:30',
      location: 'Conference Room A',
      attendees: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'],
      status: 'confirmed',
      priority: 'high',
      organizer: 'John Doe',
      createdBy: 'Admin',
      createdAt: '2024-01-15',
      notes: 'Please prepare sales reports beforehand',
      recurring: false,
      reminder: '15 minutes before'
    },
    {
      id: '2',
      title: 'Staff Training: New POS System',
      description: 'Training session for all staff on the new point-of-sale system',
      category: 'training',
      startDate: '2024-01-22',
      endDate: '2024-01-22',
      startTime: '09:00',
      endTime: '17:00',
      location: 'Training Room',
      attendees: ['All Staff'],
      status: 'confirmed',
      priority: 'high',
      organizer: 'IT Department',
      createdBy: 'Admin',
      createdAt: '2024-01-10',
      notes: 'Lunch will be provided',
      recurring: false,
      reminder: '1 hour before'
    },
    {
      id: '3',
      title: 'Inventory Audit',
      description: 'Quarterly inventory audit and stock verification',
      category: 'maintenance',
      startDate: '2024-01-25',
      endDate: '2024-01-26',
      startTime: '08:00',
      endTime: '18:00',
      location: 'Warehouse',
      attendees: ['Inventory Team', 'Supervisor'],
      status: 'pending',
      priority: 'medium',
      organizer: 'Inventory Manager',
      createdBy: 'Admin',
      createdAt: '2024-01-12',
      notes: 'Bring counting equipment',
      recurring: true,
      reminder: '1 day before'
    },
    {
      id: '4',
      title: 'Team Building Activity',
      description: 'Monthly team building event to boost morale and collaboration',
      category: 'social',
      startDate: '2024-01-28',
      endDate: '2024-01-28',
      startTime: '14:00',
      endTime: '18:00',
      location: 'Company Recreation Area',
      attendees: ['All Employees'],
      status: 'confirmed',
      priority: 'low',
      organizer: 'HR Department',
      createdBy: 'Admin',
      createdAt: '2024-01-08',
      notes: 'Dress code: Casual',
      recurring: true,
      reminder: '2 hours before'
    },
    {
      id: '5',
      title: 'Client Presentation',
      description: 'Present new product line to key clients',
      category: 'meeting',
      startDate: '2024-01-30',
      endDate: '2024-01-30',
      startTime: '14:00',
      endTime: '16:00',
      location: 'Client Meeting Room',
      attendees: ['Sales Team', 'Marketing Team', 'Clients'],
      status: 'tentative',
      priority: 'high',
      organizer: 'Sales Manager',
      createdBy: 'Admin',
      createdAt: '2024-01-14',
      notes: 'Prepare presentation materials',
      recurring: false,
      reminder: '30 minutes before'
    }
  ];

  const upcomingEvents = events.filter(event => 
    new Date(event.startDate) >= new Date() && 
    (searchTerm === '' || event.title.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'all' || event.status === filterStatus)
  );

  const pastEvents = events.filter(event => 
    new Date(event.startDate) < new Date() && 
    (searchTerm === '' || event.title.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'all' || event.status === filterStatus)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</span>;
      case 'tentative':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><AlertCircle className="w-3 h-3 mr-1" />Tentative</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" />Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">High</span>;
      case 'medium':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Medium</span>;
      case 'low':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Low</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">Normal</span>;
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return eventCategories.find(cat => cat.id === categoryId) || eventCategories[eventCategories.length - 1];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const EventCard = ({ event, isPast = false }: { event: any, isPast?: boolean }) => {
    const categoryInfo = getCategoryInfo(event.category);
    const CategoryIcon = categoryInfo.icon;

    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${isPast ? 'opacity-75' : ''}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${categoryInfo.color.replace('text-', 'bg-').replace('-800', '-100')}`}>
              <CategoryIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
              <p className="text-sm text-gray-600">{event.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(event.status)}
            {getPriorityBadge(event.priority)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(event.startDate)}</span>
            {event.endDate !== event.startDate && <span> - {formatDate(event.endDate)}</span>}
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{event.attendees.length} attendees</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${categoryInfo.color}`}>
              {categoryInfo.name}
            </span>
            {event.recurring && (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                Recurring
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button className="text-blue-600 hover:text-blue-800 transition-colors" title="View Details">
              <Eye className="w-4 h-4" />
            </button>
            <button className="text-green-600 hover:text-green-800 transition-colors" title="Edit">
              <Edit className="w-4 h-4" />
            </button>
            <button className="text-red-600 hover:text-red-800 transition-colors" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CreateEventForm = () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      category: 'meeting',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      location: '',
      attendees: '',
      priority: 'medium',
      notes: '',
      recurring: false,
      reminder: '15 minutes before'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // TODO: Implement event creation
      alert('Event creation functionality will be implemented');
      setShowCreateForm(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Create New Event</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {eventCategories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attendees (comma-separated)</label>
              <input
                type="text"
                value={formData.attendees}
                onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                placeholder="John Doe, Jane Smith, Mike Johnson"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.recurring}
                    onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Recurring Event</span>
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Event
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Event Center</h2>
          <p className="text-gray-600 mt-1">Manage and track all company events, meetings, and activities</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Calendar View</span>
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Events</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="tentative">Tentative</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category Filter</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="all">All Categories</option>
              {eventCategories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Event Categories Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {eventCategories.map((category) => {
          const Icon = category.icon;
          const count = events.filter(event => event.category === category.id).length;
          return (
            <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-lg ${category.color.replace('text-', 'bg-').replace('-800', '-100')} flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-900">{category.name}</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Event Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'upcoming', label: 'Upcoming Events', count: upcomingEvents.length },
              { id: 'past', label: 'Past Events', count: pastEvents.length },
              { id: 'all', label: 'All Events', count: events.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'upcoming' && (
            <div className="space-y-4">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming events</h3>
                  <p className="text-gray-600 mb-4">Create your first event to get started</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Event</span>
                  </button>
                </div>
              ) : (
                upcomingEvents.map(event => <EventCard key={event.id} event={event} />)
              )}
            </div>
          )}

          {activeTab === 'past' && (
            <div className="space-y-4">
              {pastEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No past events</h3>
                  <p className="text-gray-600">Past events will appear here</p>
                </div>
              ) : (
                pastEvents.map(event => <EventCard key={event.id} event={event} isPast={true} />)
              )}
            </div>
          )}

          {activeTab === 'all' && (
            <div className="space-y-4">
              {events.map(event => <EventCard key={event.id} event={event} isPast={new Date(event.startDate) < new Date()} />)}
            </div>
          )}
        </div>
      </div>

      {showCreateForm && <CreateEventForm />}
    </div>
  );
};

export default EventCenter;