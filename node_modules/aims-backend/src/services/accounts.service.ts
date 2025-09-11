import { supabaseAdmin } from '../config/supabaseClient';
import type { Account, GLTransaction, GLTransactionItem, Expense } from '@shared/types/database';

export class AccountsService {
  // Account Management
  static async getAccounts(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('accounts')
        .select(`
          *,
          parent_account:parent_account_id (
            id,
            account_name,
            account_type
          )
        `);

      if (filters.account_type) {
        query = query.eq('account_type', filters.account_type);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.search) {
        query = query.or(`account_name.ilike.%${filters.search}%,account_number.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query
        .order('account_type')
        .order('account_name');

      if (error) throw error;

      return {
        accounts: data || [],
        total: count || 0
      };
    } catch (error) {
      throw new Error(`Failed to fetch accounts: ${error}`);
    }
  }

  static async getAccountById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('accounts')
        .select(`
          *,
          parent_account:parent_account_id (
            id,
            account_name,
            account_type
          ),
          child_accounts:accounts!parent_account_id (
            id,
            account_name,
            account_type,
            is_active
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch account: ${error}`);
    }
  }

  static async createAccount(accountData: Partial<Account>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('accounts')
        .insert([accountData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create account: ${error}`);
    }
  }

  static async updateAccount(id: string, accountData: Partial<Account>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('accounts')
        .update(accountData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update account: ${error}`);
    }
  }

  static async deleteAccount(id: string) {
    try {
      const { error } = await supabaseAdmin
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete account: ${error}`);
    }
  }

  // GL Transactions
  static async getGLTransactions(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('gl_transactions')
        .select(`
          *,
          created_by:created_by_user_id (
            first_name,
            last_name
          ),
          posted_by:posted_by_user_id (
            first_name,
            last_name
          )
        `);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.date_from) {
        query = query.gte('transaction_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('transaction_date', filters.date_to);
      }

      const { data, error, count } = await query
        .order('transaction_date', { ascending: false });

      if (error) throw error;

      return {
        transactions: data || [],
        total: count || 0
      };
    } catch (error) {
      throw new Error(`Failed to fetch GL transactions: ${error}`);
    }
  }

  static async getGLTransactionById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('gl_transactions')
        .select(`
          *,
          created_by:created_by_user_id (
            first_name,
            last_name
          ),
          posted_by:posted_by_user_id (
            first_name,
            last_name
          ),
          items:gl_transaction_items (
            *,
            account:account_id (
              id,
              account_name,
              account_type
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch GL transaction: ${error}`);
    }
  }

  static async createGLTransaction(transactionData: Partial<GLTransaction>, items: Partial<GLTransactionItem>[]) {
    try {
      const { data: transaction, error: transactionError } = await supabaseAdmin
        .from('gl_transactions')
        .insert([transactionData])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Insert transaction items
      const itemsWithTransactionId = items.map(item => ({
        ...item,
        transaction_id: transaction.id
      }));

      const { data: transactionItems, error: itemsError } = await supabaseAdmin
        .from('gl_transaction_items')
        .insert(itemsWithTransactionId)
        .select();

      if (itemsError) throw itemsError;

      return {
        ...transaction,
        items: transactionItems
      };
    } catch (error) {
      throw new Error(`Failed to create GL transaction: ${error}`);
    }
  }

  static async postGLTransaction(id: string, postedByUserId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('gl_transactions')
        .update({
          status: 'posted',
          posted_by_user_id: postedByUserId,
          posted_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to post GL transaction: ${error}`);
    }
  }

  // Expenses
  static async getExpenses(filters: any = {}) {
    try {
      let query = supabaseAdmin
        .from('expenses')
        .select(`
          *,
          account:account_id (
            id,
            account_name,
            account_type
          ),
          recorded_by:recorded_by_user_id (
            first_name,
            last_name
          ),
          approved_by:approved_by_user_id (
            first_name,
            last_name
          )
        `);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.date_from) {
        query = query.gte('expense_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('expense_date', filters.date_to);
      }

      const { data, error, count } = await query
        .order('expense_date', { ascending: false });

      if (error) throw error;

      return {
        expenses: data || [],
        total: count || 0
      };
    } catch (error) {
      throw new Error(`Failed to fetch expenses: ${error}`);
    }
  }

  static async createExpense(expenseData: Partial<Expense>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('expenses')
        .insert([expenseData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create expense: ${error}`);
    }
  }

  static async updateExpense(id: string, expenseData: Partial<Expense>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('expenses')
        .update(expenseData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update expense: ${error}`);
    }
  }

  static async approveExpense(id: string, approvedByUserId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('expenses')
        .update({
          status: 'approved',
          approved_by_user_id: approvedByUserId
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to approve expense: ${error}`);
    }
  }

  // Financial Reports
  static async getTrialBalance(filters: any = {}) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_trial_balance', {
          p_date_from: filters.date_from,
          p_date_to: filters.date_to
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch trial balance: ${error}`);
    }
  }

  static async getProfitAndLoss(filters: any = {}) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_profit_and_loss', {
          p_date_from: filters.date_from,
          p_date_to: filters.date_to
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch profit and loss: ${error}`);
    }
  }

  static async getBalanceSheet(filters: any = {}) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_balance_sheet', {
          p_date: filters.date
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch balance sheet: ${error}`);
    }
  }
}

