export declare const DEPARTMENT_CONFIG: {
    readonly admin: {
        readonly name: "Administration";
        readonly description: "System administration and management";
        readonly color: "#8B5CF6";
        readonly icon: "settings";
    };
    readonly hr: {
        readonly name: "Human Resources";
        readonly description: "Employee management and HR operations";
        readonly color: "#10B981";
        readonly icon: "users";
    };
    readonly marketing: {
        readonly name: "Marketing";
        readonly description: "Marketing campaigns and promotions";
        readonly color: "#F59E0B";
        readonly icon: "megaphone";
    };
    readonly sales: {
        readonly name: "Sales";
        readonly description: "Sales operations and customer relations";
        readonly color: "#EF4444";
        readonly icon: "trending-up";
    };
    readonly inventory: {
        readonly name: "Inventory";
        readonly description: "Stock management and product operations";
        readonly color: "#3B82F6";
        readonly icon: "package";
    };
    readonly finance: {
        readonly name: "Finance";
        readonly description: "Financial management and accounting";
        readonly color: "#059669";
        readonly icon: "currency-dollar";
    };
    readonly it: {
        readonly name: "Information Technology";
        readonly description: "IT support and system maintenance";
        readonly color: "#6366F1";
        readonly icon: "computer";
    };
    readonly customer_service: {
        readonly name: "Customer Service";
        readonly description: "Customer support and service";
        readonly color: "#EC4899";
        readonly icon: "chat";
    };
};
export declare const DEPARTMENT_ROLES: {
    readonly admin: readonly ["super_admin"];
    readonly hr: readonly ["hr_admin", "hr_staff"];
    readonly marketing: readonly ["marketing_admin", "marketing_staff"];
    readonly sales: readonly ["cashier"];
    readonly inventory: readonly ["inventory_clerk"];
    readonly finance: readonly ["finance_admin", "finance_staff"];
    readonly it: readonly ["it_admin", "it_staff"];
    readonly customer_service: readonly ["customer_service_admin", "customer_service_staff"];
};
//# sourceMappingURL=departments.d.ts.map