import type { POSTransaction, POSSession, Customer, SalesTransaction, TransactionItem, Payment } from '@shared/types/database';
export declare class POSCashierService {
    static getDashboard(): Promise<{
        totalTransactions: number;
        totalProducts: number;
        totalCustomers: number;
        activeSessions: number;
        timestamp: string;
    }>;
    static getProducts(filters?: any): Promise<{
        products: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static searchProducts(searchTerm: string): Promise<{
        id: any;
        sku: any;
        name: any;
        unit_price: any;
        stock_quantity: any;
        barcode: any;
        unit_of_measure: any;
    }[]>;
    static getProductById(id: string): Promise<any>;
    static getCustomers(filters?: any): Promise<{
        customers: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static searchCustomers(searchTerm: string): Promise<{
        id: any;
        customer_code: any;
        first_name: any;
        last_name: any;
        email: any;
        phone: any;
        total_orders: any;
        total_spent: any;
    }[]>;
    static getCustomerById(id: string): Promise<any>;
    static createCustomer(customerData: Partial<Customer>): Promise<any>;
    static updateCustomer(id: string, customerData: Partial<Customer>): Promise<any>;
    static getTransactions(filters?: any): Promise<{
        transactions: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static getTransactionById(id: string): Promise<any>;
    static createTransaction(transactionData: Partial<POSTransaction>): Promise<any>;
    static updateTransaction(id: string, transactionData: Partial<POSTransaction>): Promise<any>;
    static cancelTransaction(id: string): Promise<any>;
    static createSalesTransaction(transactionData: Partial<SalesTransaction>): Promise<any>;
    static getSalesTransactionById(id: string): Promise<any>;
    static getTransactionItems(transactionId: string): Promise<any[]>;
    static createTransactionItem(itemData: Partial<TransactionItem>): Promise<any>;
    static processPayment(paymentData: Partial<Payment>): Promise<any>;
    static getPayments(transactionId: string): Promise<any[]>;
    static startSession(sessionData: Partial<POSSession>): Promise<any>;
    static endSession(id: string, closingData: Partial<POSSession>): Promise<any>;
    static getCurrentSession(cashierId: string): Promise<any>;
    static getSessionById(id: string): Promise<any>;
    static generateReceipt(transactionId: string): Promise<{
        transaction: any;
        items: any[];
        payments: any[];
        generated_at: string;
    }>;
    static getDailyReport(date: string): Promise<{
        date: string;
        totalSales: any;
        totalTransactions: number;
        transactions: any[];
    }>;
    static getSalesReport(filters?: any): Promise<{
        totalSales: any;
        totalTransactions: number;
        transactions: any[];
        filters: any;
    }>;
    static checkInventory(productId: string): Promise<{
        stock_quantity: any;
        minimum_stock: any;
        maximum_stock: any;
    }>;
    static getLowStockItems(): Promise<{
        id: any;
        sku: any;
        name: any;
        stock_quantity: any;
        minimum_stock: any;
    }[]>;
    static getQuickSales(): Promise<{
        id: any;
        sku: any;
        name: any;
        unit_price: any;
        barcode: any;
    }[]>;
}
//# sourceMappingURL=cashier.service.d.ts.map