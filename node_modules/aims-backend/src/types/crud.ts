export interface PaginationParams {
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }
  
  export interface PaginatedResponse<T> {
    success: boolean;
    message: string;
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  }
  
  export interface FilterParams {
    search?: string;
    status?: string;
    branch_id?: string;
    date_from?: string;
    date_to?: string;
  }
  
  export interface CRUDResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
  }
  
  export interface BulkOperationResult {
    success: boolean;
    message: string;
    data: {
      successful: number;
      failed: number;
      errors: Array<{
        index: number;
        error: string;
      }>;
    };
  }