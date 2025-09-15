import type { Customer, SalesTransaction, TransactionItem, Payment, POSSession } from '@shared/types/database';
export declare class POSCashierService {
    static getDashboard(): Promise<{
        totalSalesToday: any;
        totalTransactionsToday: any;
        totalCustomersToday: any;
        averageTransactionValue: any;
        lowStockProducts: any;
        recentTransactions: any;
        topProducts: any;
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
        category: {
            name: any;
        }[];
    }[]>;
    static getProductById(id: string): Promise<any>;
    static checkInventory(productId: string): Promise<{
        isLowStock: boolean;
        isOutOfStock: boolean;
        id: any;
        sku: any;
        name: any;
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
        unit_of_measure: any;
        category: {
            name: any;
        }[];
    }[]>;
    static getQuickSales(): Promise<any>;
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
    static createTransaction(transactionData: Partial<SalesTransaction>): Promise<any>;
    static updateTransaction(id: string, transactionData: Partial<SalesTransaction>): Promise<any>;
    static cancelTransaction(id: string): Promise<any>;
    static createSalesTransaction(transactionData: Partial<SalesTransaction>): Promise<any>;
    static getSalesTransactionById(id: string): Promise<any>;
    static getTransactionItems(transactionId: string): Promise<any[]>;
    static createTransactionItem(itemData: Partial<TransactionItem>): Promise<any>;
    static processPayment(paymentData: Partial<Payment>): Promise<any>;
    static getPayments(transactionId: string): Promise<any[]>;
    static startSession(sessionData: Partial<POSSession>): Promise<any>;
    static endSession(id: string, closingData: any): Promise<any>;
    static getCurrentSession(cashierId: string): Promise<any>;
    static getSessionById(id: string): Promise<any>;
    static generateReceipt(transactionId: string): Promise<any>;
    static getDailyReport(date: string): Promise<any>;
    static getSalesReport(filters?: any): Promise<{
        summary: {
            totalSales: number;
            totalTransactions: number;
            averageTransaction: number;
        };
        transactions: {
            id: any;
            transaction_date: any;
            total_amount: any;
            payment_status: any;
            customer: {
                first_name: any;
                last_name: any;
            }[];
        }[];
    }>;
}
//# sourceMappingURL=cashier.service.d.ts.map