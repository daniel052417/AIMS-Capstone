import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AccountsService } from '../services/accounts.service';

// Account Management
export const getAccounts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      account_type: req.query.account_type as string,
      is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
      search: req.query.search as string,
    };

    const result = await AccountsService.getAccounts(filters);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch accounts',
    });
  }
};

export const getAccountById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const account = await AccountsService.getAccountById(id);
    
    res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account',
    });
  }
};

export const createAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const accountData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const account = await AccountsService.createAccount(accountData);
    
    res.status(201).json({
      success: true,
      data: account,
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account',
    });
  }
};

export const updateAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const accountData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    const account = await AccountsService.updateAccount(id, accountData);
    
    res.json({
      success: true,
      data: account,
      message: 'Account updated successfully',
    });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update account',
    });
  }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await AccountsService.deleteAccount(id);
    
    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
    });
  }
};

// GL Transactions
export const getGLTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      status: req.query.status as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    };

    const result = await AccountsService.getGLTransactions(filters);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching GL transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GL transactions',
    });
  }
};

export const getGLTransactionById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const transaction = await AccountsService.getGLTransactionById(id);
    
    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Error fetching GL transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GL transaction',
    });
  }
};

export const createGLTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { items, ...transactionData } = req.body;
    
    const transaction = await AccountsService.createGLTransaction(transactionData, items);
    
    res.status(201).json({
      success: true,
      data: transaction,
      message: 'GL transaction created successfully',
    });
  } catch (error) {
    console.error('Error creating GL transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create GL transaction',
    });
  }
};

export const postGLTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const postedByUserId = req.user?.id;

    if (!postedByUserId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const transaction = await AccountsService.postGLTransaction(id, postedByUserId);
    
    res.json({
      success: true,
      data: transaction,
      message: 'GL transaction posted successfully',
    });
  } catch (error) {
    console.error('Error posting GL transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post GL transaction',
    });
  }
};

// Expenses
export const getExpenses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      status: req.query.status as string,
      category: req.query.category as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    };

    const result = await AccountsService.getExpenses(filters);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
    });
  }
};

export const createExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const expenseData = {
      ...req.body,
      recorded_by_user_id: req.user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const expense = await AccountsService.createExpense(expenseData);
    
    res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense created successfully',
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense',
    });
  }
};

export const updateExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const expenseData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    const expense = await AccountsService.updateExpense(id, expenseData);
    
    res.json({
      success: true,
      data: expense,
      message: 'Expense updated successfully',
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense',
    });
  }
};

export const approveExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const approvedByUserId = req.user?.id;

    if (!approvedByUserId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const expense = await AccountsService.approveExpense(id, approvedByUserId);
    
    res.json({
      success: true,
      data: expense,
      message: 'Expense approved successfully',
    });
  } catch (error) {
    console.error('Error approving expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve expense',
    });
  }
};

// Financial Reports
export const getTrialBalance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    };

    const result = await AccountsService.getTrialBalance(filters);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching trial balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trial balance',
    });
  }
};

export const getProfitAndLoss = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    };

    const result = await AccountsService.getProfitAndLoss(filters);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching profit and loss:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profit and loss',
    });
  }
};

export const getBalanceSheet = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      date: req.query.date as string,
    };

    const result = await AccountsService.getBalanceSheet(filters);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching balance sheet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance sheet',
    });
  }
};

