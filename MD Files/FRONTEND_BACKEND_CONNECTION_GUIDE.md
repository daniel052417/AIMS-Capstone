# Frontend-Backend Connection Guide

This guide explains how to connect your React frontend to your Node.js/Express backend, including local development setup, CORS configuration, API calls, environment variables, and production preparation.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Local Development Setup](#local-development-setup)
3. [CORS Configuration](#cors-configuration)
4. [Environment Variables](#environment-variables)
5. [API Service Setup](#api-service-setup)
6. [Sample API Calls](#sample-api-calls)
7. [Authentication Headers](#authentication-headers)
8. [Production Preparation](#production-preparation)
9. [Troubleshooting](#troubleshooting)

## Project Overview

Your current setup:
- **Backend**: Node.js/Express/TypeScript running on port 3001
- **Frontend**: React/Vite running on port 5173
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens

## Local Development Setup

### 1. Backend Setup

Your backend is already configured with:
- Express server on port 3001
- CORS enabled for frontend URL
- JWT authentication
- Supabase integration

**Start the backend:**
```bash
cd backend
npm run dev
```

The backend will be available at: `http://localhost:3001`

### 2. Frontend Setup

Your frontend is configured with:
- Vite development server on port 5173
- React with TypeScript
- Supabase client

**Start the frontend:**
```bash
cd frontend
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## CORS Configuration

Your backend already has CORS configured in `backend/src/index.ts`:

```typescript
app.use(cors({
  origin: config.FRONTEND_URL, // http://localhost:5173
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
```

This configuration:
- ✅ Allows requests from your frontend URL
- ✅ Enables credentials (cookies, authorization headers)
- ✅ Supports all necessary HTTP methods
- ✅ Allows required headers

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=your_database_url

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_API_VERSION=v1

# Supabase Configuration (if using Supabase client-side)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## API Service Setup

### 1. Create API Service File

Create `frontend/src/services/api.ts`:

```typescript
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

// API Client Class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  // Load token from localStorage
  private loadToken() {
    this.token = localStorage.getItem('auth_token');
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
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

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}/${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Create API client instance
export const apiClient = new ApiClient(`${API_BASE_URL}/${API_VERSION}`);

// Health check
export const healthCheck = () => apiClient.get('/health');

// Export for direct use
export default apiClient;
```

### 2. Create Specific API Services

Create `frontend/src/services/authService.ts`:

```typescript
import { apiClient, ApiResponse } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  token: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  phone?: string;
  avatar_url?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export const authService = {
  // Login user
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>('/auth/login', credentials);
  },

  // Register user
  async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>('/auth/register', userData);
  },

  // Get current user profile
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<UserProfile>('/auth/profile');
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string }>> {
    return apiClient.post<{ token: string }>('/auth/refresh', { refreshToken });
  },

  // Logout
  async logout(): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/logout');
    apiClient.clearToken();
    return response;
  },

  // Update profile
  async updateProfile(data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return apiClient.put<UserProfile>('/auth/profile', data);
  },
};
```

Create `frontend/src/services/productsService.ts`:

```typescript
import { apiClient, ApiResponse, PaginatedResponse } from './api';

export interface Product {
  product_id: number;
  product_name: string;
  sku: string;
  description: string | null;
  category_id: number;
  unit_of_measure: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  product_name: string;
  sku: string;
  description?: string;
  category_id: number;
  unit_of_measure: string;
  price: number;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  is_active?: boolean;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: number;
  is_active?: boolean;
}

export const productsService = {
  // Get all products with filters
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.category_id) params.append('category_id', filters.category_id.toString());
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    
    return apiClient.get<Product[]>(endpoint);
  },

  // Get product by ID
  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return apiClient.get<Product>(`/products/${id}`);
  },

  // Create new product
  async createProduct(data: CreateProductRequest): Promise<ApiResponse<Product>> {
    return apiClient.post<Product>('/products', data);
  },

  // Update product
  async updateProduct(id: number, data: UpdateProductRequest): Promise<ApiResponse<Product>> {
    return apiClient.put<Product>(`/products/${id}`, data);
  },

  // Delete product
  async deleteProduct(id: number): Promise<ApiResponse> {
    return apiClient.delete(`/products/${id}`);
  },

  // Get product categories
  async getCategories(): Promise<ApiResponse<any[]>> {
    return apiClient.get<any[]>('/products/categories');
  },
};
```

## Sample API Calls

### 1. Update Your App Component

Update `frontend/src/App.tsx` to use the API service:

```typescript
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { authService, LoginRequest } from './services/authService';
import { productsService } from './services/productsService';
import LoginPage from './pages/auth/LoginPage';
import AdminDashboard from './pages/super-admin';
import POSInterface from './pages/pos/cashier/POSInterface';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already logged in on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if we have a token
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Try to get user profile
        const response = await authService.getProfile();
        if (response.success && response.data) {
          setUser(response.data);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Clear invalid token
      localStorage.removeItem('auth_token');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.login({
        email: username,
        password: password,
      });

      if (response.success && response.data) {
        // Store token
        localStorage.setItem('auth_token', response.data.token);
        
        // Set user data
        setUser(response.data.user);
        setError('');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setUsername('');
      setPassword('');
      setError('');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Test API call function
  const testApiCall = async () => {
    try {
      console.log('Testing API connection...');
      
      // Test health check
      const healthResponse = await apiClient.get('/health');
      console.log('Health check:', healthResponse);
      
      // Test products API
      const productsResponse = await productsService.getProducts({ limit: 5 });
      console.log('Products:', productsResponse);
      
    } catch (error) {
      console.error('API test failed:', error);
    }
  };

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Role-based dashboard rendering
  if (user) {
    // Add test button for development
    if (process.env.NODE_ENV === 'development') {
      return (
        <div>
          <button 
            onClick={testApiCall}
            className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Test API
          </button>
          {user.role === 'cashier' ? (
            <POSInterface user={user} onLogout={handleLogout} />
          ) : (
            <AdminDashboard user={user} onLogout={handleLogout} />
          )}
        </div>
      );
    }
    
    return user.role === 'cashier' ? (
      <POSInterface user={user} onLogout={handleLogout} />
    ) : (
      <AdminDashboard user={user} onLogout={handleLogout} />
    );
  }

  // Login form
  return (
    <LoginPage
      username={username}
      password={password}
      showPassword={showPassword}
      isLoading={isLoading}
      error={error}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onToggleShowPassword={() => setShowPassword(!showPassword)}
      onLoginSubmit={handleLogin}
    />
  );
}

export default App;
```

### 2. Create a Test Component

Create `frontend/src/components/ApiTest.tsx`:

```typescript
import React, { useState } from 'react';
import { productsService, Product } from '../services/productsService';
import { authService } from '../services/authService';

export const ApiTest: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testProductsAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await productsService.getProducts({ limit: 10 });
      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        setError(response.message || 'Failed to fetch products');
      }
    } catch (err: any) {
      setError(err.message || 'API call failed');
    } finally {
      setLoading(false);
    }
  };

  const testHealthCheck = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/health');
      console.log('Health check response:', response);
      alert('Health check successful! Check console for details.');
    } catch (err: any) {
      setError(err.message || 'Health check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">API Test Component</h2>
      
      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={testHealthCheck}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test Health Check
          </button>
          
          <button
            onClick={testProductsAPI}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test Products API
          </button>
        </div>

        {loading && <p>Loading...</p>}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        )}

        {products.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Products ({products.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.product_id} className="border p-4 rounded">
                  <h4 className="font-semibold">{product.product_name}</h4>
                  <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                  <p className="text-sm text-gray-600">Price: ${product.price}</p>
                  <p className="text-sm text-gray-600">
                    Status: {product.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

## Authentication Headers

The API client automatically handles authentication headers:

```typescript
// When you call authService.login(), the token is stored
const response = await authService.login({ email, password });
// Token is automatically added to subsequent requests

// All API calls will include: Authorization: Bearer <token>
const products = await productsService.getProducts();
```

## Production Preparation

### 1. Environment Variables for Production

**Backend `.env.production`:**
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com

# Production Supabase credentials
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_supabase_service_role_key
DATABASE_URL=your_production_database_url

# Production JWT secret (use a strong, unique secret)
JWT_SECRET=your_strong_production_jwt_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

**Frontend `.env.production`:**
```env
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_API_VERSION=v1
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

### 2. Update CORS for Production

Update `backend/src/config/env.ts`:

```typescript
export const config = {
  // ... other config
  FRONTEND_URL: process.env.FRONTEND_URL || (
    process.env.NODE_ENV === 'production' 
      ? 'https://your-frontend-domain.com'
      : 'http://localhost:5173'
  ),
};
```

### 3. Build Scripts

**Backend `package.json`:**
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "start:prod": "NODE_ENV=production node dist/index.js"
  }
}
```

**Frontend `package.json`:**
```json
{
  "scripts": {
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "build:prod": "NODE_ENV=production vite build"
  }
}
```

### 4. Deployment Checklist

- [ ] Set up production environment variables
- [ ] Update CORS origins for production domains
- [ ] Configure reverse proxy (nginx/Apache) if needed
- [ ] Set up SSL certificates
- [ ] Configure domain names and DNS
- [ ] Set up monitoring and logging
- [ ] Test API endpoints in production
- [ ] Verify authentication flow works
- [ ] Test CORS with production URLs

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check that `FRONTEND_URL` in backend matches your frontend URL
   - Verify CORS configuration includes all necessary headers
   - Check browser developer tools for specific CORS error messages

2. **Authentication Issues**
   - Verify JWT secret is set correctly
   - Check token expiration settings
   - Ensure token is being sent in Authorization header

3. **API Connection Issues**
   - Verify backend is running on correct port
   - Check that API base URL is correct in frontend
   - Test backend health endpoint directly

4. **Environment Variable Issues**
   - Ensure `.env` files are in correct directories
   - Check that variable names match exactly
   - Restart servers after changing environment variables

### Debug Commands

```bash
# Test backend health
curl http://localhost:3001/health

# Test API endpoint
curl http://localhost:3001/v1

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/v1/auth/profile
```

### Browser Developer Tools

1. **Network Tab**: Check API requests and responses
2. **Console Tab**: Look for JavaScript errors
3. **Application Tab**: Check localStorage for stored tokens

This guide should help you successfully connect your frontend to your backend and prepare for production deployment. The API service structure is designed to be scalable and maintainable as your application grows.
