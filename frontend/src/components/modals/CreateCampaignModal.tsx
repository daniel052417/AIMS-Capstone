import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  Upload, 
  Eye, 
  Palette, 
  Link, 
  Users, 
  Globe,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import type { CampaignFormData, CampaignTemplate, CampaignTemplateType } from '../../types/marketing';
// TODO: Replace with actual API calls when backend is connected
// import { uploadImage } from '../../lib/fileUploadService';
// import { validateCampaignForm } from '../../lib/validationService';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CampaignFormData) => Promise<void>;
  onPreview?: (data: CampaignFormData) => void;
  campaign?: any;
  templates: CampaignTemplate[];
  mode: 'add' | 'edit';
  isLoading?: boolean;
}

const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onPreview,
  campaign,
  templates,
  mode,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CampaignFormData>({
    campaign_name: campaign?.campaign_name || '',
    template_type: campaign?.template_type || 'hero_banner',
    title: campaign?.title || '',
    description: campaign?.description || '',
    content: campaign?.content || '',
    background_color: campaign?.background_color || '#ffffff',
    text_color: campaign?.text_color || '#000000',
    image_alt_text: campaign?.image_alt_text || '',
    cta_text: campaign?.cta_text || '',
    cta_url: campaign?.cta_url || '',
    cta_button_color: campaign?.cta_button_color || '#007bff',
    cta_text_color: campaign?.cta_text_color || '#ffffff',
    target_audience: campaign?.target_audience || [],
    target_channels: campaign?.target_channels || [],
    is_active: campaign?.is_active || false,
    publish_date: campaign?.publish_date || '',
    unpublish_date: campaign?.unpublish_date || ''
  });

  const [errors, setErrors] = useState<any>({});
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(campaign?.image_url || null);
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(
    templates.find(t => t.template_type === formData.template_type) || null
  );

  useEffect(() => {
    if (campaign && mode === 'edit') {
      setFormData({
        campaign_name: campaign.campaign_name || '',
        template_type: campaign.template_type || 'hero_banner',
        title: campaign.title || '',
        description: campaign.description || '',
        content: campaign.content || '',
        background_color: campaign.background_color || '#ffffff',
        text_color: campaign.text_color || '#000000',
        image_alt_text: campaign.image_alt_text || '',
        cta_text: campaign.cta_text || '',
        cta_url: campaign.cta_url || '',
        cta_button_color: campaign.cta_button_color || '#007bff',
        cta_text_color: campaign.cta_text_color || '#ffffff',
        target_audience: campaign.target_audience || [],
        target_channels: campaign.target_channels || [],
        is_active: campaign.is_active || false,
        publish_date: campaign.publish_date || '',
        unpublish_date: campaign.unpublish_date || ''
      });
      setImagePreview(campaign.image_url || null);
    } else {
      setFormData({
        campaign_name: '',
        template_type: 'hero_banner',
        title: '',
        description: '',
        content: '',
        background_color: '#ffffff',
        text_color: '#000000',
        image_alt_text: '',
        cta_text: '',
        cta_url: '',
        cta_button_color: '#007bff',
        cta_text_color: '#ffffff',
        target_audience: [],
        target_channels: [],
        is_active: false,
        publish_date: '',
        unpublish_date: ''
      });
      setImagePreview(null);
    }
    setErrors({});
  }, [campaign, mode, isOpen]);

  useEffect(() => {
    const template = templates.find(t => t.template_type === formData.template_type);
    setSelectedTemplate(template || null);
  }, [formData.template_type, templates]);

  const handleInputChange = (field: keyof CampaignFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Basic file type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, image_file: 'Please select a valid image file (JPEG, PNG, WebP, or GIF)' }));
      return;
    }

    // Basic file size validation (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image_file: 'File size must be less than 5MB' }));
      return;
    }

    setIsUploading(true);
    try {
      // TODO: Implement actual image upload when backend is connected
      // const result = await uploadImage(file, {
      //   folder: 'campaigns',
      //   maxSize: 5 * 1024 * 1024, // 5MB
      //   allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      // });

      // Simulate upload for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockUrl = URL.createObjectURL(file);
      setImagePreview(mockUrl);
      setFormData(prev => ({ ...prev, image_url: mockUrl }));
      setErrors(prev => ({ ...prev, image_file: undefined }));
    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        image_file: error instanceof Error ? error.message : 'Failed to upload image' 
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    // Required fields
    if (!formData.campaign_name.trim()) {
      newErrors.campaign_name = 'Campaign name is required';
    } else if (formData.campaign_name.length > 255) {
      newErrors.campaign_name = 'Campaign name must be less than 255 characters';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 500) {
      newErrors.title = 'Title must be less than 500 characters';
    }

    // Template validation
    if (!formData.template_type) {
      newErrors.template_type = 'Template type is required';
    } else if (!['hero_banner', 'promo_card', 'popup'].includes(formData.template_type)) {
      newErrors.template_type = 'Invalid template type';
    }

    // Description validation
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    // Content validation
    if (formData.content && formData.content.length > 10000) {
      newErrors.content = 'Content must be less than 10000 characters';
    }

    // Color validation
    if (formData.background_color && !isValidHexColor(formData.background_color)) {
      newErrors.background_color = 'Please enter a valid hex color (e.g., #FF0000)';
    }

    if (formData.text_color && !isValidHexColor(formData.text_color)) {
      newErrors.text_color = 'Please enter a valid hex color (e.g., #FF0000)';
    }

    if (formData.cta_button_color && !isValidHexColor(formData.cta_button_color)) {
      newErrors.cta_button_color = 'Please enter a valid hex color (e.g., #FF0000)';
    }

    if (formData.cta_text_color && !isValidHexColor(formData.cta_text_color)) {
      newErrors.cta_text_color = 'Please enter a valid hex color (e.g., #FF0000)';
    }

    // URL validation
    if (formData.cta_url && !isValidUrl(formData.cta_url)) {
      newErrors.cta_url = 'Please enter a valid URL';
    }

    // Targeting validation
    if (formData.target_audience && formData.target_audience.length === 0) {
      newErrors.target_audience = 'At least one target audience is required';
    }

    if (formData.target_channels && formData.target_channels.length === 0) {
      newErrors.target_channels = 'At least one target channel is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidHexColor = (color: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error submitting campaign:', error);
    }
  };

  const audienceOptions = [
    { value: 'all_customers', label: 'All Customers' },
    { value: 'pet_owners', label: 'Pet Owners' },
    { value: 'farmers', label: 'Farmers' },
    { value: 'veterinarians', label: 'Veterinarians' },
    { value: 'new_customers', label: 'New Customers' },
    { value: 'loyalty_members', label: 'Loyalty Members' },
    { value: 'high_value_customers', label: 'High Value Customers' }
  ];

  const channelOptions = [
    { value: 'website', label: 'Website' },
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'mobile_app', label: 'Mobile App' },
    { value: 'pos_system', label: 'POS System' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="w-6 h-6 text-blue-600" />
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

        {Object.keys(errors).length > 0 && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-medium text-red-800">
                Please fix {Object.keys(errors).length} error{Object.keys(errors).length !== 1 ? 's' : ''}:
              </h3>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                error && (
                  <li key={field} className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    <span>{error}</span>
                  </li>
                )
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <p className="mt-1 text-sm text-red-600">{errors.campaign_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Type *
                </label>
                <select
                  value={formData.template_type}
                  onChange={(e) => handleInputChange('template_type', e.target.value as CampaignTemplateType)}
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

            {selectedTemplate && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Template Preview</h4>
                <p className="text-sm text-blue-700">{selectedTemplate.description}</p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Content
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter campaign description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.content ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter campaign content (HTML supported)"
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
            </div>
          </div>

          {/* Visual Customization */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Visual Customization
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => handleInputChange('background_color', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.background_color}
                    onChange={(e) => handleInputChange('background_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#ffffff"
                  />
                </div>
                {errors.background_color && (
                  <p className="mt-1 text-sm text-red-600">{errors.background_color}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.text_color}
                    onChange={(e) => handleInputChange('text_color', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.text_color}
                    onChange={(e) => handleInputChange('text_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#000000"
                  />
                </div>
                {errors.text_color && (
                  <p className="mt-1 text-sm text-red-600">{errors.text_color}</p>
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Image
              </label>
              <div className="space-y-4">
                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Campaign preview"
                      className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData(prev => ({ ...prev, image_url: undefined }));
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      ) : (
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      )}
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>
                
                {errors.image_file && (
                  <p className="text-sm text-red-600">{errors.image_file}</p>
                )}
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Call to Action
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CTA Text
                </label>
                <input
                  type="text"
                  value={formData.cta_text}
                  onChange={(e) => handleInputChange('cta_text', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.cta_text ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Shop Now, Learn More"
                />
                {errors.cta_text && (
                  <p className="mt-1 text-sm text-red-600">{errors.cta_text}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CTA URL
                </label>
                <input
                  type="url"
                  value={formData.cta_url}
                  onChange={(e) => handleInputChange('cta_url', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.cta_url ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com"
                />
                {errors.cta_url && (
                  <p className="mt-1 text-sm text-red-600">{errors.cta_url}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Button Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.cta_button_color}
                    onChange={(e) => handleInputChange('cta_button_color', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.cta_button_color}
                    onChange={(e) => handleInputChange('cta_button_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#007bff"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Button Text Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.cta_text_color}
                    onChange={(e) => handleInputChange('cta_text_color', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.cta_text_color}
                    onChange={(e) => handleInputChange('cta_text_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Targeting */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Targeting
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {audienceOptions.map(option => (
                    <label key={option.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.target_audience?.includes(option.value)}
                        onChange={(e) => {
                          const newAudience = e.target.checked
                            ? [...(formData.target_audience || []), option.value]
                            : (formData.target_audience || []).filter(a => a !== option.value);
                          handleInputChange('target_audience', newAudience);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.target_audience && (
                  <p className="mt-1 text-sm text-red-600">{errors.target_audience}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Channels
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {channelOptions.map(option => (
                    <label key={option.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.target_channels?.includes(option.value)}
                        onChange={(e) => {
                          const newChannels = e.target.checked
                            ? [...(formData.target_channels || []), option.value]
                            : (formData.target_channels || []).filter(c => c !== option.value);
                          handleInputChange('target_channels', newChannels);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.target_channels && (
                  <p className="mt-1 text-sm text-red-600">{errors.target_channels}</p>
                )}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Campaign Settings
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Active Campaign</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publish Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.publish_date}
                    onChange={(e) => handleInputChange('publish_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unpublish Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.unpublish_date}
                    onChange={(e) => handleInputChange('unpublish_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.unpublish_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.unpublish_date}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            {onPreview && (
              <button
                type="button"
                onClick={() => onPreview(formData)}
                disabled={isLoading}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
            )}

            <div className="flex items-center space-x-3 ml-auto">
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
                disabled={isLoading || Object.keys(errors).length > 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
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

export default CreateCampaignModal;
