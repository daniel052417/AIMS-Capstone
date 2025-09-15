import type { Product, Category, Supplier, InventoryLevel, InventoryMovement } from '@shared/types/database';
export declare class ProductsService {
    static getProducts(filters?: any): Promise<{
        products: any;
        pagination: {
            page: any;
            limit: any;
            total: any;
            pages: number;
        };
    }>;
    static getProductById(id: string): Promise<any>;
    static createProduct(productData: Partial<Product>): Promise<any>;
    static updateProduct(id: string, productData: Partial<Product>): Promise<any>;
    static deleteProduct(id: string): Promise<{
        success: boolean;
    }>;
    static getCategories(filters?: any): Promise<any[]>;
    static createCategory(categoryData: Partial<Category>): Promise<any>;
    static updateCategory(id: string, categoryData: Partial<Category>): Promise<any>;
    static deleteCategory(id: string): Promise<{
        success: boolean;
    }>;
    static getSuppliers(filters?: any): Promise<any[]>;
    static createSupplier(supplierData: Partial<Supplier>): Promise<any>;
    static updateSupplier(id: string, supplierData: Partial<Supplier>): Promise<any>;
    static deleteSupplier(id: string): Promise<{
        success: boolean;
    }>;
    static getInventoryLevels(filters?: any): Promise<any>;
    static updateInventoryLevel(id: string, levelData: Partial<InventoryLevel>): Promise<any>;
    static getInventoryMovements(filters?: any): Promise<any[]>;
    static createInventoryMovement(movementData: Partial<InventoryMovement>): Promise<any>;
    static adjustStock(productId: string, quantity: number, movementType: string, notes?: string, createdByUserId?: string): Promise<{
        movement: any;
        newStockQuantity: any;
    }>;
    static getLowStockProducts(): Promise<any>;
    static getProductSalesReport(filters?: any): Promise<any>;
}
//# sourceMappingURL=products.service.d.ts.map