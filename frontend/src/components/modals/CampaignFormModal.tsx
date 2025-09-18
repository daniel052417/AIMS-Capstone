import React, { useState, useEffect } from 'react';
import { X, Megaphone, Globe, Image as ImageIcon, AlertCircle, Eye, Save } from 'lucide-react';

interface CampaignTemplate {
  id: string;
  template_name: string;
  template_type: 'hero_banner' | 'promo_card' | 'popup';
  description: string;
  default_styles: Record<string, any>;
  required_fields: string[];
  is_active: boolean;
}

interface MarketingCampaign {
  id?: string;
  campaign_name: string;
  template_type: 'hero_banner' | 'promo_card' | 'popup';
  title: string;
  description: string;
  content: string;
  background_color?: string;
  text_color?: string;
  image_url?: string;
  image_alt_text?: string;
  cta_text?: string;
  cta_url?: string;
  cta_button_color?: string;
  cta_text_color?: string;
  target_audience: string[];
  target_channels: string[];
  is_active: boolean;
  is_published: boolean;
  publish_date?: string;
  unpublish_date?: string;
}

interface CampaignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaign: MarketingCampaign) => void;
  onPreview: (campaign: MarketingCampaign) => void;
  campaign?: MarketingCampaign | null;
  templates: CampaignTemplate[];
  mode: 'add' | 'edit';
  isLoading?: boolean;
}

const CampaignFormModal: React.FC<CampaignFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onPreview,
  campaign,
  templates,
  mode,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<MarketingCampaign>({
    campaign_name: '',
    template_type: 'hero_banner',
    title: '',
    description: '',
    content: '',
    background_color: '#ffffff',
    text_color: '#000000',
    image_url: '',
    image_alt_text: '',
    cta_text: '',
    cta_url: '',
    cta_button_color: '#3b82f6',
    cta_text_color: '#ffffff',
    target_audience: [],
    target_channels: [],
    is_active: true,
    is_published: false,
    publish_date: '',
    unpublish_date: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (campaign && mode === 'edit') {
      setFormData(campaign);
    } else {
      setFormData({
        campaign_name: '',
        template_type: 'hero_banner',
        title: '',
        description: '',
        content: '',
        background_color: '#ffffff',
        text_color: '#000000',
        image_url: '',
        image_alt_text: '',
        cta_text: '',
        cta_url: '',
        cta_button_color: '#3b82f6',
        cta_text_color: '#ffffff',
        target_audience: [],
        target_channels: [],
        is_active: true,
        is_published: false,
        publish_date: '',
        unpublish_date: ''
      });
    }
    setErrors({});
  }, [campaign, mode, isOpen]);

  const handleInputChange = (field: keyof MarketingCampaign, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayChange = (field: 'target_audience' | 'target_channels', value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(Boolean);
    handleInputChange(field, array);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.campaign_name.trim()) {
      newErrors.campaign_name = 'Campaign name is required';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.target_audience.length === 0) {
      newErrors.target_audience = 'At least one target audience is required';
    }
    if (formData.target_channels.length === 0) {
      newErrors.target_channels = 'At least one target channel is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handlePreview = () => {
    if (validateForm()) {
      onPreview(formData);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Megaphone className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              {mode === 'add' ? 'Create New Campaign' : 'Edit Campaign'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Basic Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={formData.campaign_name}
                  onChange={(e) => handleInputChange('campaign_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.campaign_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter campaign name"
                />
                {errors.campaign_name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.campaign_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Type *
                </label>
                <select
                  value={formData.template_type}
                  onChange={(e) => handleInputChange('template_type', e.target.value as 'hero_banner' | 'promo_card' | 'popup')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {templates.map(template => (
                    <option key={template.id} value={template.template_type}>
                      {template.template_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter campaign title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter campaign description"
                rows={3}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.description}
                </p>
              )}
            </div>
          </div>

          {/* Content & Styling */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Content & Styling</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter campaign content (HTML supported)"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Background Color
                </label>
                <input
                  type="color"
                  value={formData.background_color || '#ffffff'}
                  onChange={(e) => handleInputChange('background_color', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text Color
                </label>
                <input
                  type="color"
                  value={formData.text_color || '#000000'}
                  onChange={(e) => handleInputChange('text_color', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={formData.image_url || ''}
                onChange={(e) => handleInputChange('image_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Alt Text
              </label>
              <input
                type="text"
                value={formData.image_alt_text || ''}
                onChange={(e) => handleInputChange('image_alt_text', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the image for accessibility"
              />
            </div>
          </div>

          {/* Call to Action */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Call to Action</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CTA Text
                </label>
                <input
                  type="text"
                  value={formData.cta_text || ''}
                  onChange={(e) => handleInputChange('cta_text', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Shop Now, Learn More"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CTA URL
                </label>
                <input
                  type="url"
                  value={formData.cta_url || ''}
                  onChange={(e) => handleInputChange('cta_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/action"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CTA Button Color
                </label>
                <input
                  type="color"
                  value={formData.cta_button_color || '#3b82f6'}
                  onChange={(e) => handleInputChange('cta_button_color', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CTA Text Color
                </label>
                <input
                  type="color"
                  value={formData.cta_text_color || '#ffffff'}
                  onChange={(e) => handleInputChange('cta_text_color', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Targeting */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Targeting</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Audience * (comma-separated)
              </label>
              <input
                type="text"
                value={formData.target_audience.join(', ')}
                onChange={(e) => handleArrayChange('target_audience', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.target_audience ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., all_customers, new_customers, premium_customers"
              />
              {errors.target_audience && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.target_audience}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Channels * (comma-separated)
              </label>
              <input
                type="text"
                value={formData.target_channels.join(', ')}
                onChange={(e) => handleArrayChange('target_channels', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.target_channels ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., website, email, social_media"
              />
              {errors.target_channels && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.target_channels}
                </p>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Settings</h4>
            
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-900">Campaign is active</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => handleInputChange('is_published', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-900">Publish immediately</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handlePreview}
              disabled={isLoading}
              className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <Save className="w-4 h-4" />
                <span>{isLoading ? 'Saving...' : mode === 'add' ? 'Create Campaign' : 'Update Campaign'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignFormModal;








