import React from 'react';
import { X, Eye, Edit, Play, Pause, Upload, Download, BarChart3, Calendar, Users, Globe, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface MarketingCampaign {
  id: string;
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
  views_count: number;
  clicks_count: number;
  conversions_count: number;
  created_at: string;
  updated_at: string;
}

interface CampaignTemplate {
  id: string;
  template_name: string;
  template_type: 'hero_banner' | 'promo_card' | 'popup';
  description: string;
  default_styles: Record<string, any>;
  required_fields: string[];
  is_active: boolean;
}

interface CampaignPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onToggleStatus: (isActive: boolean) => void;
  campaign: MarketingCampaign | null;
  template: CampaignTemplate | null;
  isPreview?: boolean;
  isLoading?: boolean;
}

const CampaignPreviewModal: React.FC<CampaignPreviewModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  onPublish,
  onUnpublish,
  onToggleStatus,
  campaign,
  template,
  isPreview = false,
  isLoading = false
}) => {
  if (!isOpen || !campaign || !template) return null;

  const getStatusBadge = () => {
    if (campaign.is_published) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Play className="w-3 h-3 mr-1" />
          Published
        </span>
      );
    } else if (campaign.is_active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Pause className="w-3 h-3 mr-1" />
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

  const renderCampaignPreview = () => {
    const previewStyle = {
      backgroundColor: campaign.background_color || '#ffffff',
      color: campaign.text_color || '#000000',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '24px',
      minHeight: '200px'
    };

    const ctaStyle = {
      backgroundColor: campaign.cta_button_color || '#3b82f6',
      color: campaign.cta_text_color || '#ffffff',
      padding: '8px 16px',
      borderRadius: '6px',
      textDecoration: 'none',
      display: 'inline-block',
      marginTop: '16px'
    };

    return (
      <div style={previewStyle} className="relative">
        <div className="mb-4">
          <h3 className="text-2xl font-bold mb-2">{campaign.title}</h3>
          <p className="text-lg mb-4">{campaign.description}</p>
        </div>

        {campaign.image_url && (
          <div className="mb-4">
            <img
              src={campaign.image_url}
              alt={campaign.image_alt_text || campaign.title}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}

        {campaign.content && (
          <div 
            className="mb-4"
            dangerouslySetInnerHTML={{ __html: campaign.content }}
          />
        )}

        {campaign.cta_text && campaign.cta_url && (
          <a
            href={campaign.cta_url}
            style={ctaStyle}
            className="hover:opacity-90 transition-opacity"
          >
            {campaign.cta_text}
          </a>
        )}

        {isPreview && (
          <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
            Preview Mode
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Campaign Preview: {campaign.campaign_name}
                </h3>
                <p className="text-sm text-gray-600">Template: {template.template_name}</p>
              </div>
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

        <div className="p-6 space-y-6">
          {/* Campaign Status & Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getStatusBadge()}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {getTemplateIcon(campaign.template_type)}
                <span>{template.template_name}</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Created: {new Date(campaign.created_at).toLocaleDateString()}
            </div>
          </div>

          {/* Performance Metrics (if not preview) */}
          {!isPreview && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{campaign.views_count.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{campaign.clicks_count.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Clicks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{campaign.conversions_count.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Conversions</div>
              </div>
            </div>
          )}

          {/* Campaign Preview */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Campaign Preview</h4>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              {renderCampaignPreview()}
            </div>
          </div>

          {/* Campaign Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Targeting</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">Audience:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {campaign.target_audience.map((audience, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {audience.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Channels:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {campaign.target_channels.map((channel, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {channel.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Schedule</h4>
              <div className="space-y-2 text-sm">
                {campaign.publish_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      <strong>Publish:</strong> {new Date(campaign.publish_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {campaign.unpublish_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      <strong>Unpublish:</strong> {new Date(campaign.unpublish_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    <strong>Status:</strong> {campaign.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={onEdit}
              className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Campaign</span>
            </button>

            <div className="flex items-center space-x-3">
              {!isPreview && (
                <>
                  {campaign.is_published ? (
                    <button
                      onClick={onUnpublish}
                      disabled={isLoading}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unpublish</span>
                    </button>
                  ) : (
                    <button
                      onClick={onPublish}
                      disabled={isLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Publish</span>
                    </button>
                  )}
                  <button
                    onClick={() => onToggleStatus(!campaign.is_active)}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2 ${
                      campaign.is_active
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {campaign.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{campaign.is_active ? 'Deactivate' : 'Activate'}</span>
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignPreviewModal;














