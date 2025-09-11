import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const getAccounts: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAccountById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createAccount: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateAccount: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteAccount: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getGLTransactions: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getGLTransactionById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createGLTransaction: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const postGLTransaction: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getExpenses: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createExpense: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateExpense: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const approveExpense: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getTrialBalance: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getProfitAndLoss: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getBalanceSheet: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=accounts.controller.d.ts.map