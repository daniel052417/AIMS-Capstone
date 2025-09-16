import { apiClient, type ApiResponse, type PaginatedResponse } from './api';

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

// Create products service object
const productsService = {
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

// Export the productsService
export { productsService };

// Also export as default
export default productsService;