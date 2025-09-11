export interface Department {
    id: string;
    name: string;
    description: string;
    manager_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface CreateDepartmentRequest {
    name: string;
    description: string;
    manager_id?: string;
}
export interface UpdateDepartmentRequest {
    name?: string;
    description?: string;
    manager_id?: string;
    is_active?: boolean;
}
export declare const DEPARTMENTS: {
    readonly ADMIN: "admin";
    readonly HR: "hr";
    readonly MARKETING: "marketing";
    readonly SALES: "sales";
    readonly INVENTORY: "inventory";
    readonly FINANCE: "finance";
    readonly IT: "it";
    readonly CUSTOMER_SERVICE: "customer_service";
};
export type DepartmentType = typeof DEPARTMENTS[keyof typeof DEPARTMENTS];
//# sourceMappingURL=department.d.ts.map