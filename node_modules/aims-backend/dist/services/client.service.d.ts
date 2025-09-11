export declare class ClientService {
    static getDashboard(): Promise<{
        totalProducts: number;
        totalCategories: number;
        activeCampaigns: number;
        totalOrders: number;
        timestamp: string;
    }>;
    static getProducts(filters?: any): Promise<{
        products: {
            id: any;
            sku: any;
            name: any;
            description: any;
            unit_price: any;
            stock_quantity: any;
            image_url: any;
            unit_of_measure: any;
            categories: {
                name: any;
            }[];
            suppliers: {
                name: any;
            }[];
        }[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static getProductById(id: string): Promise<any>;
    static searchProducts(searchTerm: string): Promise<{
        id: any;
        sku: any;
        name: any;
        unit_price: any;
        image_url: any;
        stock_quantity: any;
    }[]>;
    static getCategories(): Promise<{
        id: any;
        name: any;
        description: any;
        image_url: any;
    }[]>;
    static getCategoryById(id: string): Promise<any>;
    static getCustomerById(id: string): Promise<any>;
    static createCustomer(customerData: any): Promise<any>;
    static updateCustomer(id: string, customerData: any): Promise<any>;
    static getOrders(customerId: string, filters?: any): Promise<{
        orders: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static getOrderById(id: string): Promise<any>;
    static createOrder(orderData: any): Promise<any>;
    static updateOrder(id: string, orderData: any): Promise<any>;
    static cancelOrder(id: string): Promise<any>;
    static getOrderItems(orderId: string): Promise<any[]>;
    static createOrderItem(itemData: any): Promise<any>;
    static updateOrderItem(id: string, itemData: any): Promise<any>;
    static deleteOrderItem(id: string): Promise<{
        success: boolean;
    }>;
    static createSalesTransaction(transactionData: any): Promise<any>;
    static getSalesTransactionById(id: string): Promise<any>;
    static processPayment(paymentData: any): Promise<any>;
    static getPayments(transactionId: string): Promise<any[]>;
    static getActiveCampaigns(): Promise<{
        id: any;
        campaign_name: any;
        title: any;
        description: any;
        content: any;
        background_color: any;
        text_color: any;
        image_url: any;
        cta_text: any;
        cta_url: any;
        cta_button_color: any;
        cta_text_color: any;
        target_audience: any;
        target_channels: any;
        publish_date: any;
        unpublish_date: any;
    }[]>;
    static getCampaignById(id: string): Promise<any>;
    static getFeaturedProducts(): Promise<{
        id: any;
        sku: any;
        name: any;
        unit_price: any;
        image_url: any;
        stock_quantity: any;
    }[]>;
    static getNewArrivals(): Promise<{
        id: any;
        sku: any;
        name: any;
        unit_price: any;
        image_url: any;
        stock_quantity: any;
    }[]>;
    static getBestSellers(): Promise<{
        id: any;
        sku: any;
        name: any;
        unit_price: any;
        image_url: any;
        stock_quantity: any;
    }[]>;
}
//# sourceMappingURL=client.service.d.ts.map