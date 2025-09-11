import { Request, Response } from 'express';
export declare class POSCashierController {
    static getDashboard: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getProducts: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static searchProducts: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getProductById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getCustomers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static searchCustomers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getCustomerById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createCustomer: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateCustomer: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getTransactions: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getTransactionById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createTransaction: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateTransaction: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static cancelTransaction: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createSalesTransaction: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getSalesTransactionById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getTransactionItems: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createTransactionItem: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static processPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getPayments: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static startSession: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static endSession: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getCurrentSession: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getSessionById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static generateReceipt: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getDailyReport: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getSalesReport: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static checkInventory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getLowStockItems: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getQuickSales: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=cashier.controller.d.ts.map