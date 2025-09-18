// Re-export from centralized API client
export { 
  apiClient, 
  healthCheck,
  type ApiResponse, 
  type PaginatedResponse,
  type RequestConfig,
  ApiError 
} from '../api/apiClient';

// Also export as default
export { default } from '../api/apiClient';