import { useState, useEffect, useCallback } from 'react';
import { SalesService } from '../services/salesService';
import type { SalesTransactionFilters } from '../services/salesService';

export const useSalesTransactions = (filters: SalesTransactionFilters = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
        const response = await SalesService.getSalesTransactions(filters);

        setTransactions(transactions);
        setPagination(pagination);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const updateTransaction = async (id: string, data: any) => {
    try {
      setLoading(true);
      const response = await SalesService.updateSalesTransaction(id, data);
      await fetchTransactions(); // Refresh the list
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update transaction');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id: string, reason: string) => {
    try {
      setLoading(true);
      await SalesService.deleteSalesTransaction(id, reason);
      await fetchTransactions(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const bulkUpdateStatus = async (transactionIds: string[], status: string, notes?: string) => {
    try {
      setLoading(true);
      const response = await SalesService.bulkUpdateTransactionStatus(transactionIds, status, notes);
      await fetchTransactions(); // Refresh the list
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk update transactions');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const bulkDelete = async (transactionIds: string[], reason: string) => {
    try {
      setLoading(true);
      const response = await SalesService.bulkDeleteTransactions(transactionIds, reason);
      await fetchTransactions(); // Refresh the list
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk delete transactions');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportTransactions = async (format: 'csv' | 'excel' = 'csv') => {
    try {
      const blob = await SalesService.exportSalesTransactions(filters, format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales_transactions_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export transactions');
      throw err;
    }
  };

  const printTransaction = async (id: string) => {
    try {
      const blob = await SalesService.printSalesTransaction(id);
      
      // Open in new window for printing
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to print transaction');
      throw err;
    }
  };

  return {
    transactions,
    loading,
    error,
    pagination,
    fetchTransactions,
    updateTransaction,
    deleteTransaction,
    bulkUpdateStatus,
    bulkDelete,
    exportTransactions,
    printTransaction
  };
};