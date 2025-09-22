import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Upload as Publish, 
  Download as Unpublish,
  BarChart3,
  Calendar,
  Users,
  Globe,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Megaphone as Campaign
} from 'lucide-react';
import { CreateCampaignModal } from '../../components/modals';
import type { CampaignFormData, CampaignTemplate } from '../../types/marketing';

const CampaignManagement: React.FC = () => {
  const [campaigns, setCampaigns] = useState([
    {
      id: '1',
      campaign_name: 'Summer Sale 2024',
      template_type: 'hero_banner',
      title: 'Up to 50% Off on All Products',
      description: 'Don\'t miss our biggest sale of the year!',
      content: 'Get amazing discounts on all our products',
      background_color: '#FF6B6B',
      text_color: '#FFFFFF',
      image_url: 'https://via.placeholder.com/400x200',
      image_alt_text: 'Summer Sale Banner',
      cta_text: 'Shop Now',
      cta_url: '/shop',
      cta_button_color: '#4ECDC4',
      cta_text_color: '#FFFFFF',
      target_audience: ['All Customers'],
      target_channels: ['Website', 'Email', 'Social Media'],
      is_active: true,
      is_published: true,
      publish_date: '2024-01-01',
      unpublish_date: '2024-01-31',
      views_count: 1250,
      clicks_count: 89,
      conversions_count: 23,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      campaign_name: 'New Product Launch',
      template_type: 'promo_card',
      title: 'Introducing Organic Fertilizers',
      description: 'Revolutionary organic fertilizers for better yields',
      content: 'Discover our new line of organic fertilizers',
      background_color: '#4ECDC4',
      text_color: '#FFFFFF',
      image_url: 'https://via.placeholder.com/300x200',
      image_alt_text: 'Organic Fertilizers',
      cta_text: 'Learn More',
      cta_url: '/products/organic-fertilizers',
      cta_button_color: '#FF6B6B',
      cta_text_color: '#FFFFFF',
      target_audience: ['Farmers'],
      target_channels: ['Website', 'Email'],
      is_active: true,
      is_published: false,
      publish_date: '2024-01-20',
      unpublish_date: '2024-02-20',
      views_count: 0,
      clicks_count: 0,
      conversions_count: 0,
      created_at: '2024-01-15T14:00:00Z',
      updated_at: '2024-01-15T14:00:00Z'
    },
    {
      id: '3',
      campaign_name: 'Veterinary Services',
      template_type: 'popup',
      title: 'Expert Veterinary Care',
      description: 'Professional veterinary services for your animals',
      content: 'Book an appointment with our experienced veterinarians',
      background_color: '#45B7D1',
      text_color: '#FFFFFF',
      image_url: 'https://via.placeholder.com/250x150',
      image_alt_text: 'Veterinary Services',
      cta_text: 'Book Appointment',
      cta_url: '/services/veterinary',
      cta_button_color: '#96CEB4',
      cta_text_color: '#FFFFFF',
      target_audience: ['Pet Owners'],
      target_channels: ['Website'],
      is_active: false,
      is_published: false,
      publish_date: '2024-01-25',
      unpublish_date: '2024-02-25',
      views_count: 0,
      clicks_count: 0,
      conversions_count: 0,
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-01-10T09:00:00Z'
    }
  ]);

  const [templates] = useState<CampaignTemplate[]>([
    { 
      id: '1', 
      template_name: 'Hero Banner', 
      template_type: 'hero_banner',
      description: 'Full-width banner for homepage and landing pages',
      default_styles: {},
      required_fields: ['title', 'cta_text'],
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    { 
      id: '2', 
      template_name: 'Promo Card', 
      template_type: 'promo_card',
      description: 'Compact card for product promotions and offers',
      default_styles: {},
      required_fields: ['title', 'description'],
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    { 
      id: '3', 
      template_name: 'Popup Modal', 
      template_type: 'popup',
      description: 'Overlay popup for announcements and special offers',
      default_styles: {},
      required_fields: ['title', 'cta_text'],
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  
  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  const getStatusBadge = (campaign: any) => {
    if (campaign.is_published) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Published
        </span>
      );
    } else if (campaign.is_active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Play className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Pause className="w-3 h-3 mr-1" />
          Draft
        </span>
      );
    }
  };

  const getTemplateIcon = (templateType: string) => {
    switch (templateType) {
      case 'hero_banner':
        return <Globe className="w-4 h-4" />;
      case 'promo_card':
        return <ImageIcon className="w-4 h-4" />;
      case 'popup':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'published' && campaign.is_published) ||
                         (statusFilter === 'active' && campaign.is_active && !campaign.is_published) ||
                         (statusFilter === 'draft' && !campaign.is_active && !campaign.is_published);
    const matchesTemplate = templateFilter === 'all' || campaign.template_type === templateFilter;
    return matchesSearch && matchesStatus && matchesTemplate;
  });

  const handleCreateCampaign = () => {
    setEditingCampaign(null);
    setModalMode('add');
    setIsCreateModalOpen(true);
  };

  const handleEditCampaign = (campaign: any) => {
    setEditingCampaign(campaign);
    setModalMode('edit');
    setIsCreateModalOpen(true);
  };

  const handlePreviewCampaign = (campaign: any) => {
    // TODO: Implement preview campaign
    console.log('Preview campaign:', campaign.id);
  };

  const handleDeleteCampaign = (campaignId: string) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    }
  };

  const handleToggleStatus = (campaignId: string) => {
    setCampaigns(prev => prev.map(c => 
      c.id === campaignId ? { ...c, is_active: !c.is_active } : c
    ));
  };

  const handlePublishCampaign = (campaignId: string) => {
    setCampaigns(prev => prev.map(c => 
      c.id === campaignId ? { ...c, is_published: true, is_active: true } : c
    ));
  };

  const handleUnpublishCampaign = (campaignId: string) => {
    setCampaigns(prev => prev.map(c => 
      c.id === campaignId ? { ...c, is_published: false } : c
    ));
  };

  const handleSaveCampaign = async (formData: CampaignFormData) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call when backend is connected
      console.log('Saving campaign:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (modalMode === 'add') {
        const newCampaign = {
          id: Date.now().toString(),
          ...formData,
          views_count: 0,
          clicks_count: 0,
          conversions_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setCampaigns(prev => [newCampaign, ...prev]);
      } else if (editingCampaign) {
        setCampaigns(prev => prev.map(c => 
          c.id === editingCampaign.id 
            ? { ...c, ...formData, updated_at: new Date().toISOString() }
            : c
        ));
      }
      
      setIsCreateModalOpen(false);
      setEditingCampaign(null);
    } catch (error) {
      console.error('Error saving campaign:', error);
      setError('Failed to save campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewFormData = (formData: CampaignFormData) => {
    // TODO: Implement preview functionality
    console.log('Preview campaign form data:', formData);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Campaign Management</h2>
          <p className="text-gray-600 mt-1">Create and manage marketing campaigns</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button 
            onClick={handleCreateCampaign}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search campaigns..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
            <select
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Templates</option>
              {templates.map(template => (
                <option key={template.id} value={template.template_type}>
                  {template.template_name}
                </option>
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

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Campaigns ({filteredCampaigns.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first campaign</p>
            <button
              onClick={handleCreateCampaign}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Campaign</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {campaign.campaign_name}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {campaign.title}
                        </div>
                        {campaign.image_url && (
                          <div className="mt-2">
                            <img
                              src={campaign.image_url}
                              alt={campaign.image_alt_text || campaign.title}
                              className="w-16 h-12 object-cover rounded border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getTemplateIcon(campaign.template_type)}
                        <span className="text-sm text-gray-900">
                          {templates.find(t => t.template_type === campaign.template_type)?.template_name || campaign.template_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(campaign)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4 text-blue-600" />
                            <span>{campaign.views_count}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BarChart3 className="w-4 h-4 text-green-600" />
                            <span>{campaign.clicks_count}</span>
                          </div>
                        </div>
                        {campaign.views_count > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            CTR: {((campaign.clicks_count / campaign.views_count) * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePreviewCampaign(campaign)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditCampaign(campaign)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {campaign.is_published ? (
                          <button
                            onClick={() => handleUnpublishCampaign(campaign.id)}
                            className="text-orange-600 hover:text-orange-900 transition-colors"
                            title="Unpublish"
                          >
                            <Unpublish className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePublishCampaign(campaign.id)}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Publish"
                          >
                            <Publish className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleStatus(campaign.id)}
                          className={`transition-colors ${
                            campaign.is_active
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={campaign.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {campaign.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingCampaign(null);
        }}
        onSave={handleSaveCampaign}
        onPreview={handlePreviewFormData}
        campaign={editingCampaign}
        templates={templates}
        mode={modalMode}
        isLoading={isLoading}
      />
    </div>
  );
};

export default CampaignManagement;