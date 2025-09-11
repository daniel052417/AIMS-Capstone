"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBalanceSheet = exports.getProfitAndLoss = exports.getTrialBalance = exports.approveExpense = exports.updateExpense = exports.createExpense = exports.getExpenses = exports.postGLTransaction = exports.createGLTransaction = exports.getGLTransactionById = exports.getGLTransactions = exports.deleteAccount = exports.updateAccount = exports.createAccount = exports.getAccountById = exports.getAccounts = void 0;
const accounts_service_1 = require("../services/accounts.service");
const getAccounts = async (req, res) => {
    try {
        const filters = {
            account_type: req.query.account_type,
            is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
            search: req.query.search
        };
        const result = await accounts_service_1.AccountsService.getAccounts(filters);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch accounts'
        });
    }
};
exports.getAccounts = getAccounts;
const getAccountById = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await accounts_service_1.AccountsService.getAccountById(id);
        res.json({
            success: true,
            data: account
        });
    }
    catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch account'
        });
    }
};
exports.getAccountById = getAccountById;
const createAccount = async (req, res) => {
    try {
        const accountData = {
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const account = await accounts_service_1.AccountsService.createAccount(accountData);
        res.status(201).json({
            success: true,
            data: account,
            message: 'Account created successfully'
        });
    }
    catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create account'
        });
    }
};
exports.createAccount = createAccount;
const updateAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const accountData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };
        const account = await accounts_service_1.AccountsService.updateAccount(id, accountData);
        res.json({
            success: true,
            data: account,
            message: 'Account updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating account:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update account'
        });
    }
};
exports.updateAccount = updateAccount;
const deleteAccount = async (req, res) => {
    try {
        const { id } = req.params;
        await accounts_service_1.AccountsService.deleteAccount(id);
        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account'
        });
    }
};
exports.deleteAccount = deleteAccount;
const getGLTransactions = async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            date_from: req.query.date_from,
            date_to: req.query.date_to
        };
        const result = await accounts_service_1.AccountsService.getGLTransactions(filters);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching GL transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch GL transactions'
        });
    }
};
exports.getGLTransactions = getGLTransactions;
const getGLTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await accounts_service_1.AccountsService.getGLTransactionById(id);
        res.json({
            success: true,
            data: transaction
        });
    }
    catch (error) {
        console.error('Error fetching GL transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch GL transaction'
        });
    }
};
exports.getGLTransactionById = getGLTransactionById;
const createGLTransaction = async (req, res) => {
    try {
        const { items, ...transactionData } = req.body;
        const transaction = await accounts_service_1.AccountsService.createGLTransaction(transactionData, items);
        res.status(201).json({
            success: true,
            data: transaction,
            message: 'GL transaction created successfully'
        });
    }
    catch (error) {
        console.error('Error creating GL transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create GL transaction'
        });
    }
};
exports.createGLTransaction = createGLTransaction;
const postGLTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const postedByUserId = req.user?.id;
        if (!postedByUserId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const transaction = await accounts_service_1.AccountsService.postGLTransaction(id, postedByUserId);
        res.json({
            success: true,
            data: transaction,
            message: 'GL transaction posted successfully'
        });
    }
    catch (error) {
        console.error('Error posting GL transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to post GL transaction'
        });
    }
};
exports.postGLTransaction = postGLTransaction;
const getExpenses = async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            category: req.query.category,
            date_from: req.query.date_from,
            date_to: req.query.date_to
        };
        const result = await accounts_service_1.AccountsService.getExpenses(filters);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expenses'
        });
    }
};
exports.getExpenses = getExpenses;
const createExpense = async (req, res) => {
    try {
        const expenseData = {
            ...req.body,
            recorded_by_user_id: req.user?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const expense = await accounts_service_1.AccountsService.createExpense(expenseData);
        res.status(201).json({
            success: true,
            data: expense,
            message: 'Expense created successfully'
        });
    }
    catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create expense'
        });
    }
};
exports.createExpense = createExpense;
const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const expenseData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };
        const expense = await accounts_service_1.AccountsService.updateExpense(id, expenseData);
        res.json({
            success: true,
            data: expense,
            message: 'Expense updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update expense'
        });
    }
};
exports.updateExpense = updateExpense;
const approveExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const approvedByUserId = req.user?.id;
        if (!approvedByUserId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const expense = await accounts_service_1.AccountsService.approveExpense(id, approvedByUserId);
        res.json({
            success: true,
            data: expense,
            message: 'Expense approved successfully'
        });
    }
    catch (error) {
        console.error('Error approving expense:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve expense'
        });
    }
};
exports.approveExpense = approveExpense;
const getTrialBalance = async (req, res) => {
    try {
        const filters = {
            date_from: req.query.date_from,
            date_to: req.query.date_to
        };
        const result = await accounts_service_1.AccountsService.getTrialBalance(filters);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching trial balance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trial balance'
        });
    }
};
exports.getTrialBalance = getTrialBalance;
const getProfitAndLoss = async (req, res) => {
    try {
        const filters = {
            date_from: req.query.date_from,
            date_to: req.query.date_to
        };
        const result = await accounts_service_1.AccountsService.getProfitAndLoss(filters);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching profit and loss:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profit and loss'
        });
    }
};
exports.getProfitAndLoss = getProfitAndLoss;
const getBalanceSheet = async (req, res) => {
    try {
        const filters = {
            date: req.query.date
        };
        const result = await accounts_service_1.AccountsService.getBalanceSheet(filters);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching balance sheet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch balance sheet'
        });
    }
};
exports.getBalanceSheet = getBalanceSheet;
//# sourceMappingURL=accounts.controller.js.map