import React from 'react';

export const DebugInfo: React.FC = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const apiVersion = import.meta.env.VITE_API_VERSION;
  
  return (
    <div className="fixed bottom-4 left-4 bg-gray-800 text-white p-4 rounded-lg text-sm max-w-md">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="space-y-1">
        <div>API Base URL: {apiBaseUrl || 'Not set'}</div>
        <div>API Version: {apiVersion || 'Not set'}</div>
        <div>Environment: {import.meta.env.MODE}</div>
        <div>Dev Mode: {import.meta.env.DEV ? 'Yes' : 'No'}</div>
      </div>
    </div>
  );
};
