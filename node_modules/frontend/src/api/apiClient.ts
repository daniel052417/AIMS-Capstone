// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request configuration interface
export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  responseType?: 'json' | 'text' | 'blob';
}

// Error types
export class ApiError extends Error {
    public status?: number;
    public response?: Response;
    public data?: any;
  
    constructor(message: string, status?: number, response?: Response, data?: any) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.response = response;
      this.data = data;
    }
  }
  

// API Client Class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private defaultTimeout: number = 10000; // 10 seconds
  private defaultRetries: number = 3;
  private defaultRetryDelay: number = 1000; // 1 second

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  // Load token from localStorage
  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Get headers for requests
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Timeout wrapper
  private withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new ApiError('Request timeout')), timeout)
      ),
    ]);
  }

  // Retry logic
  private async withRetry<T>(
    fn: () => Promise<T>,
    retries: number = this.defaultRetries,
    delay: number = this.defaultRetryDelay
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error)) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.withRetry(fn, retries - 1, delay * 2); // Exponential backoff
      }
      throw error;
    }
  }

  // Determine if request should be retried
  private shouldRetry(error: any): boolean {
    if (error instanceof ApiError) {
      // Retry on network errors or 5xx server errors
      return !error.status || (error.status >= 500 && error.status < 600);
    }
    // Retry on network errors
    return error.name === 'TypeError' && error.message.includes('fetch');
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      ...fetchOptions
    } = options;

    // Remove leading slash from endpoint to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${this.baseURL}/${cleanEndpoint}`;

    const makeRequest = async (): Promise<ApiResponse<T>> => {
      try {
        const response = await this.withTimeout(
          fetch(url, {
            ...fetchOptions,
            headers: {
              ...this.getHeaders(),
              ...fetchOptions.headers,
            },
          }),
          timeout
        );

        let data: any;

            if (options.responseType === 'blob') {
            data = await response.blob();
            } else if (options.responseType === 'text') {
            data = await response.text();
            } else if (options.responseType === 'json') {
            data = await response.json();
            } else {
            // auto-detect
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
            }


        if (!response.ok) {
          throw new ApiError(
            data.message || `HTTP error! status: ${response.status}`,
            response.status,
            response,
            data
          );
        }

        return data;
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          undefined,
          undefined,
          error
        );
      }
    };

    return this.withRetry(makeRequest, retries, retryDelay);
  }

  // HTTP Methods
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // File upload method
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>,
    config?: Omit<RequestConfig, 'body'>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const headers = new Headers(this.getHeaders());
headers.delete('Content-Type'); // ✅ works with Headers class
// Let browser set it for FormData

    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: formData,
      headers,
    });
  }

  // Download file method
  async downloadFile(endpoint: string, filename?: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/${endpoint}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new ApiError(`Download failed: ${response.statusText}`, response.status);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.get('/health');
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }
}

// Create API client instance
const apiClient = new ApiClient(`${API_BASE_URL}/${API_VERSION}`);

// Health check function
export const healthCheck = () => apiClient.healthCheck();

// Export the apiClient and types
export { apiClient };
export default apiClient;


