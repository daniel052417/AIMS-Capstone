import type { Product, Category, Supplier, InventoryTransaction, InventoryAdjustment, PurchaseOrder, PurchaseOrderItem, InventoryCount, InventoryCountItem } from '@shared/types/database';
export declare class InventoryClerkService {
    static getDashboard(): Promise<{
        totalProducts: number;
        totalCategories: number;
        totalSuppliers: number;
        lowStockItems: number;
        totalTransactions: number;
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
    static getProductById(id: string): Promise<any>;
    static createProduct(productData: Partial<Product>): Promise<any>;
    static updateProduct(id: string, productData: Partial<Product>): Promise<any>;
    static deleteProduct(id: string): Promise<{
        success: boolean;
    }>;
    static getCategories(filters?: any): Promise<{
        categories: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static getCategoryById(id: string): Promise<any>;
    static createCategory(categoryData: Partial<Category>): Promise<any>;
    static updateCategory(id: string, categoryData: Partial<Category>): Promise<any>;
    static deleteCategory(id: string): Promise<{
        success: boolean;
    }>;
    static getSuppliers(filters?: any): Promise<{
        suppliers: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static getSupplierById(id: string): Promise<any>;
    static createSupplier(supplierData: Partial<Supplier>): Promise<any>;
    static updateSupplier(id: string, supplierData: Partial<Supplier>): Promise<any>;
    static deleteSupplier(id: string): Promise<{
        success: boolean;
    }>;
    static getInventoryTransactions(filters?: any): Promise<{
        transactions: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static createInventoryTransaction(transactionData: Partial<InventoryTransaction>): Promise<any>;
    static getStockAdjustments(filters?: any): Promise<{
        adjustments: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static createStockAdjustment(adjustmentData: Partial<InventoryAdjustment>): Promise<any>;
    static getStockMovements(filters?: any): Promise<{
        movements: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static getPurchaseOrders(filters?: any): Promise<{
        purchaseOrders: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static getPurchaseOrderById(id: string): Promise<any>;
    static createPurchaseOrder(orderData: Partial<PurchaseOrder>): Promise<any>;
    static updatePurchaseOrder(id: string, orderData: Partial<PurchaseOrder>): Promise<any>;
    static getPurchaseOrderItems(orderId: string): Promise<any[]>;
    static createPurchaseOrderItem(itemData: Partial<PurchaseOrderItem>): Promise<any>;
    static getStockAlerts(filters?: any): Promise<{
        alerts: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static resolveStockAlert(id: string): Promise<any>;
    static getInventoryCounts(filters?: any): Promise<{
        counts: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static createInventoryCount(countData: Partial<InventoryCount>): Promise<any>;
    static getInventoryCountItems(countId: string): Promise<any[]>;
    static createInventoryCountItem(itemData: Partial<InventoryCountItem>): Promise<any>;
    static getInventoryReport(filters?: any): Promise<{
        products: {
            id: any;
            sku: any;
            name: any;
            stock_quantity: any;
            minimum_stock: any;
            maximum_stock: any;
            unit_price: any;
            categories: {
                name: any;
            }[];
            suppliers: {
                name: any;
            }[];
        }[];
        totalValue: number;
        filters: any;
    }>;
    static getStockMovementReport(filters?: any): Promise<{
        movements: any[];
        filters: any;
    }>;
}
//# sourceMappingURL=clerk.service.d.ts.map