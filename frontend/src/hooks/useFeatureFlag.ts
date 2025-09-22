import { usePermissions } from '../context/PermissionContext';

// Feature flag definitions mapping features to required permissions
const FEATURE_FLAGS: Record<string, string[]> = {
  // Analytics features
  'advanced_analytics': ['analytics.advanced'],
  'real_time_analytics': ['analytics.realtime'],
  'custom_reports': ['reports.custom'],
  
  // User management features
  'bulk_user_operations': ['users.bulk'],
  'user_import_export': ['users.import', 'users.export'],
  'advanced_user_search': ['users.search.advanced'],
  
  // Inventory features
  'bulk_inventory_operations': ['inventory.bulk'],
  'inventory_import_export': ['inventory.import', 'inventory.export'],
  'low_stock_alerts': ['inventory.alerts'],
  
  // Sales features
  'bulk_sales_operations': ['sales.bulk'],
  'sales_import_export': ['sales.import', 'sales.export'],
  'advanced_sales_analytics': ['sales.analytics.advanced'],
  
  // Marketing features
  'email_campaigns': ['marketing.email'],
  'sms_campaigns': ['marketing.sms'],
  'advanced_marketing_analytics': ['marketing.analytics.advanced'],
  
  // System features
  'system_settings': ['settings.system'],
  'audit_logs': ['audit.read'],
  'backup_restore': ['system.backup'],
  'api_management': ['api.manage'],
  
  // Admin features
  'role_management': ['roles.manage'],
  'permission_management': ['permissions.manage'],
  'user_activity_monitoring': ['users.activity.monitor'],
  'system_health_monitoring': ['system.health.monitor'],
  
  // Development features
  'debug_mode': ['debug.access'],
  'test_data_generation': ['test.data.generate'],
  'performance_monitoring': ['performance.monitor']
};

export interface FeatureFlagOptions {
  fallbackValue?: boolean;
  requireAll?: boolean; // If true, requires ALL permissions; if false, requires ANY permission
}

/**
 * Hook to check if a feature is enabled based on user permissions
 * @param feature - The feature flag name
 * @param options - Additional options for the feature check
 * @returns Object with isEnabled boolean and loading state
 */
export const useFeatureFlag = (
  feature: string, 
  options: FeatureFlagOptions = {}
) => {
  const { hasAnyPermission, hasPermission, isLoading } = usePermissions();
  const { fallbackValue = false, requireAll = false } = options;
  
  const requiredPermissions = FEATURE_FLAGS[feature] || [];
  
  // If no permissions defined for this feature, return fallback
  if (requiredPermissions.length === 0) {
    return {
      isEnabled: fallbackValue,
      isLoading: false,
      requiredPermissions: []
    };
  }
  
  // If loading, return loading state
  if (isLoading) {
    return {
      isEnabled: false,
      isLoading: true,
      requiredPermissions
    };
  }
  
  // Check permissions based on requireAll option
  let isEnabled: boolean;
  
  if (requireAll) {
    // User must have ALL required permissions
    isEnabled = requiredPermissions.every(permission => hasPermission(permission));
  } else {
    // User must have ANY of the required permissions
    isEnabled = hasAnyPermission(requiredPermissions);
  }
  
  return {
    isEnabled,
    isLoading: false,
    requiredPermissions
  };
};

/**
 * Hook to check multiple features at once
 * @param features - Array of feature names to check
 * @param options - Additional options for the feature checks
 * @returns Object with enabled features and loading state
 */
export const useMultipleFeatureFlags = (
  features: string[],
  options: FeatureFlagOptions = {}
) => {
  const results = features.map(feature => ({
    feature,
    ...useFeatureFlag(feature, options)
  }));
  
  const isLoading = results.some(result => result.isLoading);
  const enabledFeatures = results
    .filter(result => result.isEnabled)
    .map(result => result.feature);
  
  return {
    enabledFeatures,
    isLoading,
    results: results.reduce((acc, result) => {
      acc[result.feature] = result.isEnabled;
      return acc;
    }, {} as Record<string, boolean>)
  };
};

/**
 * Hook to get all available features for the current user
 * @param options - Additional options for the feature checks
 * @returns Object with all features and their enabled status
 */
export const useAllFeatureFlags = (options: FeatureFlagOptions = {}) => {
  const allFeatures = Object.keys(FEATURE_FLAGS);
  return useMultipleFeatureFlags(allFeatures, options);
};

/**
 * Utility function to check if a feature is enabled (for use outside components)
 * @param feature - The feature flag name
 * @param permissions - Array of user permissions
 * @param options - Additional options for the feature check
 * @returns Boolean indicating if feature is enabled
 */
export const checkFeatureFlag = (
  feature: string,
  permissions: string[],
  options: FeatureFlagOptions = {}
): boolean => {
  const { fallbackValue = false, requireAll = false } = options;
  const requiredPermissions = FEATURE_FLAGS[feature] || [];
  
  if (requiredPermissions.length === 0) {
    return fallbackValue;
  }
  
  if (requireAll) {
    return requiredPermissions.every(permission => permissions.includes(permission));
  } else {
    return requiredPermissions.some(permission => permissions.includes(permission));
  }
};

// Export feature flag definitions for external use
export { FEATURE_FLAGS };





