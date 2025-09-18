import { useState, useEffect, useCallback } from 'react';
import { StaffService } from '../services/staffService';
import type { StaffFormData, StaffFilters } from '../services/staffService';

export const useStaff = (filters: StaffFilters = {}) => {
    const [staff, setStaff] = useState<StaffFormData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
        const response = await StaffService.getStaff(filters) as {
            staff: StaffFormData[];
            pagination: {
              page: number;
              limit: number;
              total: number;
              pages: number;
            };
          };
      setStaff(response.staff);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const createStaff = async (formData: StaffFormData) => {
    try {
      setLoading(true);
      const response = await StaffService.createStaff(formData);
      await fetchStaff(); // Refresh the list
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create staff');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateStaff = async (id: string, formData: Partial<StaffFormData>) => {
    try {
      setLoading(true);
      const response = await StaffService.updateStaff(id, formData);
      await fetchStaff(); // Refresh the list
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update staff');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      setLoading(true);
      await StaffService.deleteStaff(id);
      await fetchStaff(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete staff');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    staff,
    loading,
    error,
    pagination,
    fetchStaff,
    createStaff,
    updateStaff,
    deleteStaff
  };
};