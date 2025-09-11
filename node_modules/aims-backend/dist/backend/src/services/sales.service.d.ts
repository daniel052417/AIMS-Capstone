import type { SalesOrder, SalesTransaction, OrderItem, Customer, Payment } from '@shared/types/database';
export declare class SalesService {
    static getSalesOrders(filters?: any): Promise<{
        orders: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static getSalesOrderById(id: string): Promise<any>;
    static createSalesOrder(orderData: Partial<SalesOrder>, items: Partial<OrderItem>[]): Promise<any>;
    static updateSalesOrder(id: string, orderData: Partial<SalesOrder>): Promise<any>;
    static updateOrderStatus(id: string, status: string, notes?: string, changedByUserId?: string): Promise<any>;
    static getSalesTransactions(filters?: any): Promise<{
        transactions: any[];
        total: number;
    }>;
    static createSalesTransaction(transactionData: Partial<SalesTransaction>): Promise<any>;
    static getPayments(filters?: any): Promise<{
        payments: any[];
        total: number;
    }>;
    static createPayment(paymentData: Partial<Payment>): Promise<any>;
    static getCustomers(filters?: any): Promise<{
        customers: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static getCustomerById(id: string): Promise<any>;
    static createCustomer(customerData: Partial<Customer>): Promise<any>;
    static updateCustomer(id: string, customerData: Partial<Customer>): Promise<any>;
    static getSalesReport(filters?: any): Promise<any>;
    static getTopSellingProducts(filters?: any): Promise<any>;
    static getCustomerSalesReport(filters?: any): Promise<any>;
    static getSalesDashboard(): Promise<{
        totalOrders: number;
        totalRevenue: number;
        pendingOrders: number;
        topProducts: any;
        timestamp: string;
    }>;
}
//# sourceMappingURL=sales.service.d.ts.map