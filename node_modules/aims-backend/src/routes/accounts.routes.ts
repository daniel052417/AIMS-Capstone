import { Router } from 'express';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as accountsController from '../controllers/accounts.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Account Management Routes
router.get('/accounts', 
  requireRole(['super_admin', 'accounting_admin']), 
  asyncHandler(accountsController.getAccounts)
);

router.get('/accounts/:id', 
  requireRole(['super_admin', 'accounting_admin']), 
  asyncHandler(accountsController.getAccountById)
);

router.post('/accounts', 
  requireRole(['super_admin', 'accounting_admin']), 
  asyncHandler(accountsController.createAccount)
);

router.put('/accounts/:id', 
  requireRole(['super_admin', 'accounting_admin']), 
  asyncHandler(accountsController.updateAccount)
);

router.delete('/accounts/:id', 
  requireRole(['super_admin', 'accounting_admin']), 
  asyncHandler(accountsController.deleteAccount)
);

// GL Transaction Routes
router.get('/gl-transactions', 
  requireRole(['super_admin', 'accounting_admin']), 
  asyncHandler(accountsController.getGLTransactions)
);

router.get('/gl-transactions/:id', 
  requireRole(['super_admin', 'accounting_admin']), 
  asyncHandler(accountsController.getGLTransactionById)
);

router.post('/gl-transactions', 
  requireRole(['super_admin', 'accounting_admin']), 
  asyncHandler(accountsController.createGLTransaction)
);

router.put('/gl-transactions/:id/post', 
  requireRole(['super_admin', 'accounting_admin']), 
  asyncHandler(accountsController.postGLTransaction)
);

// Expense Management Routes
router.get('/expenses', 
  requireRole(['super_admin', 'accounting_admin', 'accounting_staff']), 
  asyncHandler(accountsController.getExpenses)
);

router.post('/expenses', 
  requireRole(['super_admin', 'accounting_admin', 'accounting_staff']), 
  asyncHandler(accountsController.createExpense)
);

router.put('/expenses/:id', 
  requireRole(['super_admin', 'accounting_admin', 'accounting_staff']), 
  asyncHandler(accountsController.updateExpense)
);

router.put('/expenses/:id/approve', 
  requireRole(['super_admin', 'accounting_admin']), 
  asyncHandler(accountsController.approveExpense)
);

// Financial Reports Routes
router.get('/reports/trial-balance', 
  requireRole(['super_admin', 'accounting_admin']), 
  asyncHandler(accountsController.getTrialBalance)
);

router.get('/reports/profit-loss', 
  requireRole(['super_admin', 'accounting_admin']), 
  asyncHandler(accountsController.getProfitAndLoss)
);

router.get('/reports/balance-sheet', 
  requireRole(['super_admin', 'accounting_admin']), 
  asyncHandler(accountsController.getBalanceSheet)
);

export default router;

