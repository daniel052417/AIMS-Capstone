export declare const ROLES: {
    readonly SUPER_ADMIN: "super_admin";
    readonly HR_ADMIN: "hr_admin";
    readonly HR_STAFF: "hr_staff";
    readonly MARKETING_ADMIN: "marketing_admin";
    readonly MARKETING_STAFF: "marketing_staff";
    readonly CASHIER: "cashier";
    readonly INVENTORY_CLERK: "inventory_clerk";
    readonly CUSTOMER: "customer";
};
export type RoleType = typeof ROLES[keyof typeof ROLES];
export declare const ROLE_HIERARCHY: {
    readonly super_admin: 100;
    readonly hr_admin: 80;
    readonly marketing_admin: 80;
    readonly hr_staff: 60;
    readonly marketing_staff: 60;
    readonly cashier: 40;
    readonly inventory_clerk: 40;
    readonly customer: 20;
};
export declare const ROLE_DESCRIPTIONS: {
    readonly super_admin: "Full system access and administration";
    readonly hr_admin: "Human resources administration and management";
    readonly hr_staff: "Human resources staff operations";
    readonly marketing_admin: "Marketing campaigns and content administration";
    readonly marketing_staff: "Marketing staff operations";
    readonly cashier: "Point of sale operations and transactions";
    readonly inventory_clerk: "Inventory management and stock operations";
    readonly customer: "Customer account and shopping operations";
};
//# sourceMappingURL=roles.d.ts.map