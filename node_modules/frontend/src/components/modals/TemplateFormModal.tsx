import React, { useState, useEffect } from 'react';
import { X, Palette, Code, Settings, AlertCircle, Save } from 'lucide-react';

interface CampaignTemplate {
  id?: string;
  template_name: string;
  template_type: 'hero_banner' | 'promo_card' | 'popup';
  description: string;
  default_styles: Record<string, any>;
  required_fields: string[];
  is_active: boolean;
}

interface TemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: CampaignTemplate) => void;
  template?: CampaignTemplate | null;
  mode: 'add' | 'edit';
  isLoading?: boolean;
}

const TemplateFormModal: React.FC<TemplateFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  template,
  mode,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CampaignTemplate>({
    template_name: '',
    template_type: 'hero_banner',
    description: '',
    default_styles: {},
    required_fields: [],
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requiredFieldsInput, setRequiredFieldsInput] = useState('');

  useEffect(() => {
    if (template && mode === 'edit') {
      setFormData(template);
      setRequiredFieldsInput(template.required_fields.join(', '));
    } else {
      setFormData({
        template_name: '',
        template_type: 'hero_banner',
        description: '',
        default_styles: {},
        required_fields: [],
        is_active: true
      });
      setRequiredFieldsInput('');
    }
    setErrors({});
  }, [template, mode, isOpen]);

  const handleInputChange = (field: keyof CampaignTemplate, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRequiredFieldsChange = (value: string) => {
    setRequiredFieldsInput(value);
    const fields = value.split(',').map(field => field.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, required_fields: fields }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.template_name.trim()) {
      newErrors.template_name = 'Template name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
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

  const getTemplateIcon = (templateType: string) => {
    switch (templateType) {
      case 'hero_banner':
        return <Palette className="w-5 h-5 text-blue-600" />;
      case 'promo_card':
        return <Code className="w-5 h-5 text-green-600" />;
      case 'popup':
        return <Settings className="w-5 h-5 text-purple-600" />;
      default:
        return <Palette className="w-5 h-5 text-gray-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                {getTemplateIcon(formData.template_type)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {mode === 'add' ? 'Create New Template' : 'Edit Template'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                value={formData.template_name}
                onChange={(e) => handleInputChange('template_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.template_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter template name"
                required
              />
              {errors.template_name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.template_name}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="hero_banner">Hero Banner</option>
                <option value="promo_card">Promo Card</option>
                <option value="popup">Popup Modal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter template description"
              rows={3}
              required
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.description}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Fields (comma-separated)
            </label>
            <input
              type="text"
              value={requiredFieldsInput}
              onChange={(e) => handleRequiredFieldsChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., title, description, cta_text, cta_url"
            />
            <p className="mt-1 text-xs text-gray-500">
              List the fields that are required when using this template
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Default Styles</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Background Color
                </label>
                <input
                  type="color"
                  value={formData.default_styles.backgroundColor || '#ffffff'}
                  onChange={(e) => {
                    const newStyles = { ...formData.default_styles, backgroundColor: e.target.value };
                    setFormData(prev => ({ ...prev, default_styles: newStyles }));
                  }}
                  className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text Color
                </label>
                <input
                  type="color"
                  value={formData.default_styles.textColor || '#000000'}
                  onChange={(e) => {
                    const newStyles = { ...formData.default_styles, textColor: e.target.value };
                    setFormData(prev => ({ ...prev, default_styles: newStyles }));
                  }}
                  className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Button Color
                </label>
                <input
                  type="color"
                  value={formData.default_styles.buttonColor || '#3b82f6'}
                  onChange={(e) => {
                    const newStyles = { ...formData.default_styles, buttonColor: e.target.value };
                    setFormData(prev => ({ ...prev, default_styles: newStyles }));
                  }}
                  className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Button Text Color
                </label>
                <input
                  type="color"
                  value={formData.default_styles.buttonTextColor || '#ffffff'}
                  onChange={(e) => {
                    const newStyles = { ...formData.default_styles, buttonTextColor: e.target.value };
                    setFormData(prev => ({ ...prev, default_styles: newStyles }));
                  }}
                  className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Template is active
            </label>
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
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
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : mode === 'add' ? 'Create Template' : 'Update Template'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateFormModal;






