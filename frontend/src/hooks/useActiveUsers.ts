import { useState, useEffect, useCallback } from 'react';
import { ActiveUsersService, ActiveUser, UserFilters } from '../services/activeUsersService';

export const useActiveUsers = (filters: UserFilters = {}) => {
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ActiveUsersService.getActiveUsers(filters);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const deactivateUser = async (id: string, reason: string) => {
    try {
      await ActiveUsersService.deactivateUser(id, reason);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate user');
    }
  };

  const activateUser = async (id: string, reason: string) => {
    try {
      await ActiveUsersService.activateUser(id, reason);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate user');
    }
  };

  const forceLogoutUser = async (id: string, reason: string) => {
    try {
      await ActiveUsersService.forceLogoutUser(id, reason);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to force logout user');
    }
  };

  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    deactivateUser,
    activateUser,
    forceLogoutUser
  };
};