import { apiClient } from '../api/apiClient';

export interface SalesTransactionFilters {
  search?: string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  customer_id?: string;
  staff_id?: string;
  branch_id?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
export interface TransactionsResponse {
    transactions: SalesTransaction[];
    pagination: PaginationParams;
  }
  
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface SalesTransaction {
  id: string;
  transaction_number: string;
  customer_id: string;
  transaction_date: string;
  total_amount: number;
}
export class SalesService {
  // Get sales transactions
  static async getSalesTransactions(filters: SalesTransactionFilters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof SalesTransactionFilters] !== undefined) {
        params.append(key, filters[key as keyof SalesTransactionFilters] as string);
      }
    });
  
    // return the entire Axios response
    return apiClient.get(`/v1/sales/transactions?${params.toString()}`);
  }
  

  // Get specific transaction
  static async getSalesTransactionById(id: string) {
    const response = await apiClient.get(`/v1/sales/transactions/${id}`);
    return response.data;
  }

  // Update transaction
  static async updateSalesTransaction(id: string, data: any) {
    const response = await apiClient.put(`/v1/sales/transactions/${id}`, data);
    return response.data;
  }

 // Single delete
static async deleteSalesTransaction(id: string, reason: string) {
    const response = await apiClient.delete(`/v1/sales/transactions/${id}`, {
      body: JSON.stringify({ reason }),               // ✅ correct
      headers: { 'Content-Type': 'application/json' }  // ✅ required for JSON body
    });
    return response; // Your apiClient already returns data, not a Response
  }

  // Bulk update status
  static async bulkUpdateTransactionStatus(transactionIds: string[], status: string, notes?: string) {
    const response = await apiClient.put('/v1/sales/transactions/bulk/status', {
      transaction_ids: transactionIds,
      status,
      notes
    });
    return response.data;
  }

 // Bulk delete
static async bulkDeleteTransactions(transactionIds: string[], reason: string) {
    const response = await apiClient.delete('/v1/sales/transactions/bulk', {
      body: JSON.stringify({
        transaction_ids: transactionIds,
        reason
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    return response;
  }

  // Export transactions
  static async exportSalesTransactions(
    filters: any,
    format: 'csv' | 'excel' = 'csv'
  ): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
  
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });
  
    const response = await apiClient.get<Blob>(
      `/v1/sales/transactions/export?${params.toString()}`,
      { responseType: 'blob' }
    );
  
    if (!response.data) {
      throw new Error('No export data received');
    }
  
    return response.data; // now TS knows it’s a Blob
  }
  
  

  // Print transaction
  static async printSalesTransaction(id: string): Promise<Blob> {
    const response = await apiClient.get<Blob>(
      `/v1/sales/transactions/print/${id}`,
      { responseType: 'blob' }
    );
  
    if (!response.data) {
      throw new Error('No printable data received');
    }
  
    return response.data;
  }
  
  

  // Get real-time stream
  static async getSalesTransactionsStream(lastUpdated?: string) {
    const params = new URLSearchParams();
    if (lastUpdated) {
      params.append('last_updated', lastUpdated);
    }

    const response = await apiClient.get(`/v1/sales/transactions/stream?${params.toString()}`);
    return response.data;
  }

  // Update transaction status
  static async updateTransactionStatus(id: string, status: string, notes?: string) {
    const response = await apiClient.put(`/v1/sales/transactions/${id}/status`, {
      status,
      notes
    });
    return response.data;
  }
}