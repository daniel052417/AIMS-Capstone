import type { Account, GLTransaction, GLTransactionItem, Expense } from '@shared/types/database';
export declare class AccountsService {
    static getAccounts(filters?: any): Promise<{
        accounts: any[];
        total: number;
    }>;
    static getAccountById(id: string): Promise<any>;
    static createAccount(accountData: Partial<Account>): Promise<any>;
    static updateAccount(id: string, accountData: Partial<Account>): Promise<any>;
    static deleteAccount(id: string): Promise<{
        success: boolean;
    }>;
    static getGLTransactions(filters?: any): Promise<{
        transactions: any[];
        total: number;
    }>;
    static getGLTransactionById(id: string): Promise<any>;
    static createGLTransaction(transactionData: Partial<GLTransaction>, items: Partial<GLTransactionItem>[]): Promise<any>;
    static postGLTransaction(id: string, postedByUserId: string): Promise<any>;
    static getExpenses(filters?: any): Promise<{
        expenses: any[];
        total: number;
    }>;
    static createExpense(expenseData: Partial<Expense>): Promise<any>;
    static updateExpense(id: string, expenseData: Partial<Expense>): Promise<any>;
    static approveExpense(id: string, approvedByUserId: string): Promise<any>;
    static getTrialBalance(filters?: any): Promise<any>;
    static getProfitAndLoss(filters?: any): Promise<any>;
    static getBalanceSheet(filters?: any): Promise<any>;
}
//# sourceMappingURL=accounts.service.d.ts.map