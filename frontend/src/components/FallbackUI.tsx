import React from 'react';
import { Lock, Shield, AlertCircle, Loader2, UserX, Settings } from 'lucide-react';

interface FallbackUIProps {
  type?: 'permission' | 'role' | 'error' | 'loading' | 'empty' | 'maintenance';
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const FallbackUI: React.FC<FallbackUIProps> = ({
  type = 'permission',
  message,
  className = '',
  size = 'md',
  showIcon = true
}) => {
  const getIcon = () => {
    if (!showIcon) return null;
    
    const iconClass = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8';
    
    switch (type) {
      case 'permission':
        return <Lock className={`${iconClass} text-gray-400`} />;
      case 'role':
        return <Shield className={`${iconClass} text-gray-400`} />;
      case 'error':
        return <AlertCircle className={`${iconClass} text-red-400`} />;
      case 'loading':
        return <Loader2 className={`${iconClass} text-blue-400 animate-spin`} />;
      case 'empty':
        return <UserX className={`${iconClass} text-gray-400`} />;
      case 'maintenance':
        return <Settings className={`${iconClass} text-yellow-400`} />;
      default:
        return <Lock className={`${iconClass} text-gray-400`} />;
    }
  };

  const getMessage = () => {
    if (message) return message;
    
    switch (type) {
      case 'permission':
        return 'You don\'t have permission to view this content';
      case 'role':
        return 'This content requires a specific role';
      case 'error':
        return 'An error occurred while loading this content';
      case 'loading':
        return 'Loading content...';
      case 'empty':
        return 'No content available';
      case 'maintenance':
        return 'This feature is under maintenance';
      default:
        return 'Access denied';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'p-4';
      case 'lg':
        return 'p-12';
      default:
        return 'p-8';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${getSizeClasses()} ${className}`}>
      {getIcon()}
      <p className={`text-gray-600 mt-2 ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'}`}>
        {getMessage()}
      </p>
    </div>
  );
};

export const LoadingSkeleton: React.FC<{ 
  className?: string;
  lines?: number;
  height?: string;
}> = ({ 
  className = '', 
  lines = 3, 
  height = 'h-4' 
}) => (
  <div className={`animate-pulse ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <div 
        key={index}
        className={`${height} bg-gray-200 rounded mb-2 ${
          index === lines - 1 ? 'w-3/4' : 'w-full'
        }`}
      />
    ))}
  </div>
);

export const PermissionDenied: React.FC<{ 
  message?: string;
  className?: string;
}> = ({ message, className = '' }) => (
  <FallbackUI 
    type="permission" 
    message={message}
    className={className}
  />
);

export const RoleRequired: React.FC<{ 
  message?: string;
  className?: string;
}> = ({ message, className = '' }) => (
  <FallbackUI 
    type="role" 
    message={message}
    className={className}
  />
);

export const ErrorState: React.FC<{ 
  message?: string;
  className?: string;
}> = ({ message, className = '' }) => (
  <FallbackUI 
    type="error" 
    message={message}
    className={className}
  />
);

export const LoadingState: React.FC<{ 
  message?: string;
  className?: string;
}> = ({ message, className = '' }) => (
  <FallbackUI 
    type="loading" 
    message={message}
    className={className}
  />
);

export const EmptyState: React.FC<{ 
  message?: string;
  className?: string;
}> = ({ message, className = '' }) => (
  <FallbackUI 
    type="empty" 
    message={message}
    className={className}
  />
);

// Table-specific loading skeleton
export const TableSkeleton: React.FC<{ 
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="space-y-4">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="h-4 bg-gray-200 rounded" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Card-specific loading skeleton
export const CardSkeleton: React.FC<{ 
  className?: string;
}> = ({ className = '' }) => (
  <div className={`animate-pulse bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  </div>
);





