import { supabaseAdmin } from '../config/supabaseClient';
import { PaginationParams, FilterParams, CRUDResponse, PaginatedResponse } from '../types/crud';

export abstract class BaseCRUDService<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // Create
  async create(data: Partial<T>): Promise<CRUDResponse<T>> {
    try {
      const { data: result, error } = await supabaseAdmin
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: `${this.tableName} created successfully`,
        data: result
      };
    } catch (error: any) {
      console.error(`Create ${this.tableName} error:`, error);
      return {
        success: false,
        message: error.message || `Failed to create ${this.tableName}`
      };
    }
  }

  // Read by ID
  async getById(id: string): Promise<CRUDResponse<T>> {
    try {
      const { data: result, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!result) {
        return {
          success: false,
          message: `${this.tableName} not found`
        };
      }

      return {
        success: true,
        message: `${this.tableName} retrieved successfully`,
        data: result
      };
    } catch (error: any) {
      console.error(`Get ${this.tableName} by ID error:`, error);
      return {
        success: false,
        message: error.message || `Failed to retrieve ${this.tableName}`
      };
    }
  }

  // Read all with pagination and filters
  async getAll(
    pagination: PaginationParams = {},
    filters: FilterParams = {}
  ): Promise<PaginatedResponse<T>> {
    try {
      const {
        page = 1,
        limit = 10,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = pagination;

      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from(this.tableName)
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Apply sorting and pagination
      query = query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: `${this.tableName} retrieved successfully`,
        data: data || [],
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1
        }
      };
    } catch (error: any) {
      console.error(`Get all ${this.tableName} error:`, error);
      return {
        success: false,
        message: error.message || `Failed to retrieve ${this.tableName}`,
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false
        }
      };
    }
  }

  // Update
  async update(id: string, data: Partial<T>): Promise<CRUDResponse<T>> {
    try {
      const { data: result, error } = await supabaseAdmin
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!result) {
        return {
          success: false,
          message: `${this.tableName} not found`
        };
      }

      return {
        success: true,
        message: `${this.tableName} updated successfully`,
        data: result
      };
    } catch (error: any) {
      console.error(`Update ${this.tableName} error:`, error);
      return {
        success: false,
        message: error.message || `Failed to update ${this.tableName}`
      };
    }
  }

  // Delete
  async delete(id: string): Promise<CRUDResponse> {
    try {
      const { error } = await supabaseAdmin
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        success: true,
        message: `${this.tableName} deleted successfully`
      };
    } catch (error: any) {
      console.error(`Delete ${this.tableName} error:`, error);
      return {
        success: false,
        message: error.message || `Failed to delete ${this.tableName}`
      };
    }
  }

  // Soft delete (if table has is_active column)
  async softDelete(id: string): Promise<CRUDResponse> {
    try {
      const { data: result, error } = await supabaseAdmin
        .from(this.tableName)
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!result) {
        return {
          success: false,
          message: `${this.tableName} not found`
        };
      }

      return {
        success: true,
        message: `${this.tableName} deactivated successfully`,
        data: result
      };
    } catch (error: any) {
      console.error(`Soft delete ${this.tableName} error:`, error);
      return {
        success: false,
        message: error.message || `Failed to deactivate ${this.tableName}`
      };
    }
  }

  // Restore (if table has is_active column)
  async restore(id: string): Promise<CRUDResponse<T>> {
    try {
      const { data: result, error } = await supabaseAdmin
        .from(this.tableName)
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!result) {
        return {
          success: false,
          message: `${this.tableName} not found`
        };
      }

      return {
        success: true,
        message: `${this.tableName} restored successfully`,
        data: result
      };
    } catch (error: any) {
      console.error(`Restore ${this.tableName} error:`, error);
      return {
        success: false,
        message: error.message || `Failed to restore ${this.tableName}`
      };
    }
  }
}