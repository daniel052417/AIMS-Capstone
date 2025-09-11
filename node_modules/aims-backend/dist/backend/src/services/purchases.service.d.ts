import type { PurchaseOrder, PurchaseOrderItem, Supplier } from '@shared/types/database';
export declare class PurchasesService {
    static getPurchaseOrders(filters?: any): Promise<{
        orders: any[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            pages: number;
        };
    }>;
    static getPurchaseOrderById(id: string): Promise<any>;
    static createPurchaseOrder(orderData: Partial<PurchaseOrder>, items: Partial<PurchaseOrderItem>[]): Promise<any>;
    static updatePurchaseOrder(id: string, orderData: Partial<PurchaseOrder>): Promise<any>;
    static approvePurchaseOrder(id: string, approvedByUserId: string): Promise<any>;
    static updatePurchaseOrderItem(id: string, itemData: Partial<PurchaseOrderItem>): Promise<any>;
    static receivePurchaseOrderItem(id: string, quantityReceived: number, receivedDate?: string): Promise<any>;
    static getSuppliers(filters?: any): Promise<any[]>;
    static getSupplierById(id: string): Promise<any>;
    static createSupplier(supplierData: Partial<Supplier>): Promise<any>;
    static updateSupplier(id: string, supplierData: Partial<Supplier>): Promise<any>;
    static updateProductStock(productId: string, quantity: number, movementType: 'in' | 'out'): Promise<any>;
    static checkAndUpdateOrderStatus(orderId: string): Promise<boolean>;
    static getPurchaseReport(filters?: any): Promise<any>;
    static getSupplierPerformance(filters?: any): Promise<any>;
    static getPurchasesDashboard(): Promise<{
        totalOrders: number;
        pendingOrders: number;
        totalValue: number;
        topSuppliers: any;
        timestamp: string;
    }>;
}
//# sourceMappingURL=purchases.service.d.ts.map