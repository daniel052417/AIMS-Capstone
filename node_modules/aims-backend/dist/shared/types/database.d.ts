export interface AccountCreationWorkflow {
    id: string;
    staff_id?: string;
    workflow_status: 'pending' | 'in_progress' | 'completed' | 'failed';
    account_creation_method?: 'manual' | 'email_invite' | 'auto_create';
    email_invite_sent_at?: string;
    account_created_at?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}
export interface Account {
    id: string;
    account_number: string;
    account_name: string;
    account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    account_subtype?: string;
    parent_account_id?: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface AppSettings {
    id: string;
    app_name: string;
    company_name: string;
    contact_email: string;
    support_phone: string;
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    currency: string;
    auto_save: boolean;
    show_tooltips: boolean;
    compact_view: boolean;
    items_per_page: number;
    date_format: string;
    number_format: string;
    notification_prefs: any;
    created_at: string;
    updated_at: string;
}
export interface AttendanceRecord {
    id: string;
    staff_id?: string;
    attendance_date: string;
    time_in?: string;
    time_out?: string;
    break_start?: string;
    break_end?: string;
    total_hours: number;
    overtime_hours: number;
    status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
    notes: string;
    created_at: string;
}
export interface AuditLog {
    id: string;
    user_id?: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    old_values?: any;
    new_values?: any;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
}
export interface Benefit {
    id: string;
    benefit_name: string;
    description?: string;
    benefit_type: 'health' | 'dental' | 'vision' | 'retirement' | 'life_insurance' | 'disability' | 'other';
    cost_employee: number;
    cost_employer: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface Branch {
    id: string;
    name: string;
    address: string;
    city: string;
    phone: string;
    manager_name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface CampaignAnalytics {
    id: string;
    campaign_id?: string;
    event_type: 'view' | 'click' | 'conversion' | 'impression';
    event_data?: any;
    user_agent?: string;
    ip_address?: string;
    referrer?: string;
    created_at: string;
}
export interface CampaignSchedule {
    id: string;
    campaign_id?: string;
    schedule_type: 'immediate' | 'scheduled' | 'recurring';
    start_date?: string;
    end_date?: string;
    recurrence_pattern?: any;
    timezone: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface CampaignTemplate {
    id: string;
    template_name: string;
    template_type: 'hero_banner' | 'promo_card' | 'popup';
    description?: string;
    default_styles?: any;
    required_fields?: any;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by?: string;
}
export interface Category {
    id: string;
    name: string;
    description: string;
    parent_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface ClientNotification {
    id: string;
    title: string;
    message: string;
    notification_type: string;
    target_audience: string[];
    target_channels: string[];
    is_active: boolean;
    scheduled_at?: string;
    sent_at?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}
export interface ComponentAccess {
    id: string;
    component_name: string;
    component_path: string;
    required_permission: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface Customer {
    id: string;
    customer_code: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    date_of_birth?: string;
    gender?: string;
    assigned_staff_id?: string;
    total_orders: number;
    total_spent: number;
    last_order_date?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface Department {
    id: string;
    name: string;
    description?: string;
    manager_staff_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface EmailInvitation {
    id: string;
    staff_id?: string;
    email: string;
    invitation_token: string;
    expires_at: string;
    status: 'pending' | 'accepted' | 'expired' | 'cancelled';
    sent_at?: string;
    accepted_at?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}
export interface EmployeeBenefit {
    id: string;
    staff_id?: string;
    benefit_id?: string;
    enrollment_date: string;
    coverage_start_date: string;
    coverage_end_date?: string;
    status: 'active' | 'inactive' | 'suspended';
    employee_contribution: number;
    employer_contribution: number;
    created_at: string;
    updated_at: string;
}
export interface EmployeePayrollBenefit {
    id: string;
    staff_id?: string;
    benefit_id?: string;
    amount: number;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}
export interface Expense {
    id: string;
    expense_date: string;
    description: string;
    amount: number;
    account_id?: string;
    category: string;
    payment_method: string;
    vendor?: string;
    reference_number?: string;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    recorded_by_user_id?: string;
    approved_by_user_id?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}
export interface GLTransactionItem {
    id: string;
    transaction_id?: string;
    account_id?: string;
    debit_amount: number;
    credit_amount: number;
    description?: string;
    created_at: string;
}
export interface GLTransaction {
    id: string;
    transaction_date: string;
    reference_number: string;
    description: string;
    total_debit: number;
    total_credit: number;
    status: 'draft' | 'posted' | 'reversed';
    created_by_user_id?: string;
    posted_by_user_id?: string;
    posted_at?: string;
    created_at: string;
    updated_at: string;
}
export interface HRDocument {
    id: string;
    staff_id?: string;
    document_type: string;
    document_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_by_user_id?: string;
    is_confidential: boolean;
    created_at: string;
    updated_at: string;
}
export interface Inquiry {
    id: string;
    customer_name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    status: 'new' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assigned_to_user_id?: string;
    response?: string;
    resolved_at?: string;
    created_at: string;
    updated_at: string;
}
export interface IntegrationAlert {
    id: string;
    integration_id?: string;
    alert_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    is_resolved: boolean;
    resolved_at?: string;
    created_at: string;
}
export interface IntegrationWebhook {
    id: string;
    integration_id?: string;
    webhook_url: string;
    events: string[];
    is_active: boolean;
    secret_key?: string;
    last_triggered_at?: string;
    created_at: string;
    updated_at: string;
}
export interface Integration {
    id: string;
    name: string;
    type: string;
    status: 'active' | 'inactive' | 'error';
    configuration: any;
    last_sync_at?: string;
    created_at: string;
    updated_at: string;
}
export interface InventoryLevel {
    id: string;
    product_id?: string;
    branch_id?: string;
    current_stock: number;
    reserved_stock: number;
    available_stock: number;
    reorder_point: number;
    reorder_quantity: number;
    last_updated: string;
    created_at: string;
    updated_at: string;
}
export interface InventoryMovement {
    id: string;
    product_id?: string;
    movement_type: 'in' | 'out' | 'transfer' | 'adjustment';
    quantity: number;
    reference_type?: string;
    reference_id?: string;
    notes?: string;
    created_by_user_id?: string;
    created_at: string;
}
export interface InvoiceItem {
    id: string;
    invoice_id?: string;
    product_id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    created_at: string;
}
export interface Invoice {
    id: string;
    invoice_number: string;
    customer_id?: string;
    invoice_date: string;
    due_date: string;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    notes?: string;
    created_by_user_id?: string;
    created_at: string;
    updated_at: string;
}
export interface JobTitle {
    id: string;
    title: string;
    description?: string;
    department_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface KioskIntegrationOrder {
    id: string;
    order_number: string;
    customer_id?: string;
    total_amount: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    kiosk_data: any;
    created_at: string;
    updated_at: string;
}
export interface Lead {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    company?: string;
    source: string;
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
    assigned_to_user_id?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}
export interface LeaveRequest {
    id: string;
    staff_id?: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    days_requested: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    approved_by?: string;
    approved_at?: string;
    rejection_reason?: string;
    created_at: string;
    updated_at: string;
}
export interface Location {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    latitude?: number;
    longitude?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface MarketingAuditLog {
    id: string;
    user_id?: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    old_values?: any;
    new_values?: any;
    ip_address?: string;
    created_at: string;
}
export interface MarketingCampaign {
    id: string;
    campaign_name: string;
    template_id?: string;
    title: string;
    description?: string;
    content?: string;
    background_color?: string;
    text_color?: string;
    image_url?: string;
    cta_text?: string;
    cta_url?: string;
    cta_button_color?: string;
    cta_text_color?: string;
    target_audience: string[];
    target_channels: string[];
    is_active: boolean;
    publish_date?: string;
    unpublish_date?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}
export interface MarketingUserRole {
    id: string;
    user_id?: string;
    role: string;
    permissions: string[];
    created_at: string;
    updated_at: string;
}
export interface NotificationTemplate {
    id: string;
    template_name: string;
    template_type: string;
    subject: string;
    body: string;
    variables: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface Notification {
    id: string;
    user_id?: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    read_at?: string;
    data?: any;
    created_at: string;
}
export interface OrderItem {
    id: string;
    order_id?: string;
    product_id?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    created_at: string;
}
export interface OrderStatusHistory {
    id: string;
    order_id?: string;
    status: string;
    notes?: string;
    changed_by_user_id?: string;
    created_at: string;
}
export interface PasswordResetRequest {
    id: string;
    user_id?: string;
    token: string;
    expires_at: string;
    used: boolean;
    created_at: string;
}
export interface Payment {
    id: string;
    transaction_id?: string;
    payment_method: string;
    amount: number;
    payment_date: string;
    reference_number?: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    notes?: string;
    created_at: string;
}
export interface PayrollAuditLog {
    id: string;
    user_id?: string;
    action: string;
    payroll_record_id?: string;
    old_values?: any;
    new_values?: any;
    ip_address?: string;
    created_at: string;
}
export interface PayrollBenefit {
    id: string;
    benefit_name: string;
    description?: string;
    benefit_type: string;
    employee_contribution: number;
    employer_contribution: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface PayrollComponent {
    id: string;
    component_name: string;
    component_type: 'earning' | 'deduction';
    is_taxable: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface PayrollPeriod {
    id: string;
    period_name: string;
    start_date: string;
    end_date: string;
    status: 'draft' | 'open' | 'closed';
    created_by_user_id?: string;
    created_at: string;
    updated_at: string;
}
export interface PayrollRecord {
    id: string;
    staff_id?: string;
    period_id?: string;
    base_salary: number;
    regular_hours: number;
    overtime_hours: number;
    gross_pay: number;
    tax_amount: number;
    sss_contribution: number;
    philhealth_contribution: number;
    pagibig_contribution: number;
    benefits_deduction: number;
    total_deductions: number;
    net_pay: number;
    status: 'draft' | 'approved' | 'paid';
    created_at: string;
    updated_at: string;
}
export interface PayrollReport {
    id: string;
    period_id?: string;
    report_type: string;
    report_data: any;
    generated_by_user_id?: string;
    generated_at: string;
    created_at: string;
}
export interface PerformanceReview {
    id: string;
    staff_id?: string;
    review_period_start: string;
    review_period_end: string;
    overall_rating: number;
    goals_achieved: number;
    goals_total: number;
    strengths: string;
    areas_for_improvement: string;
    manager_comments: string;
    employee_comments?: string;
    status: 'draft' | 'submitted' | 'approved';
    created_by_user_id?: string;
    created_at: string;
    updated_at: string;
}
export interface Permission {
    id: string;
    permission_name: string;
    module: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface POSSession {
    id: string;
    cashier_id?: string;
    branch_id?: string;
    start_time: string;
    end_time?: string;
    opening_cash: number;
    closing_cash?: number;
    total_sales: number;
    total_transactions: number;
    status: 'open' | 'closed';
    created_at: string;
    updated_at: string;
}
export interface POSTransaction {
    id: string;
    pos_session_id?: string;
    sales_transaction_id?: string;
    transaction_type: 'sale' | 'return' | 'void';
    amount: number;
    payment_method: string;
    transaction_date: string;
    notes?: string;
    created_at: string;
}
export interface Product {
    id: string;
    sku: string;
    name: string;
    description: string;
    category_id?: string;
    supplier_id?: string;
    unit_price: number;
    cost_price: number;
    stock_quantity: number;
    minimum_stock: number;
    maximum_stock: number;
    unit_of_measure: string;
    barcode: string;
    expiry_date?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface PurchaseOrderItem {
    id: string;
    purchase_order_id?: string;
    product_id?: string;
    quantity_ordered: number;
    quantity_received: number;
    unit_cost: number;
    line_total: number;
    received_date?: string;
    created_at: string;
    updated_at: string;
}
export interface PurchaseOrder {
    id: string;
    po_number: string;
    supplier_id?: string;
    order_date: string;
    expected_delivery_date?: string;
    actual_delivery_date?: string;
    status: 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';
    subtotal: number;
    tax_amount: number;
    shipping_amount: number;
    total_amount: number;
    notes?: string;
    created_by_user_id?: string;
    approved_by_user_id?: string;
    created_at: string;
    updated_at: string;
}
export interface RoleDefinition {
    id: string;
    role_name: string;
    display_name: string;
    description?: string;
    is_system_role: boolean;
    created_at: string;
    updated_at: string;
}
export interface RolePermission {
    id: string;
    role_id?: string;
    role_name: string;
    module: string;
    can_view: boolean;
    can_edit: boolean;
    can_delete: boolean;
    created_at: string;
    updated_at: string;
    permission_id?: string;
}
export interface Role {
    id: string;
    role_name: string;
    display_name: string;
    description?: string;
    is_system_role: boolean;
    permissions: string[];
    created_at: string;
    updated_at: string;
}
export interface SalesOrder {
    id: string;
    order_number: string;
    customer_id?: string;
    order_date: string;
    required_date?: string;
    shipped_date?: string;
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    subtotal: number;
    tax_amount: number;
    shipping_amount: number;
    total_amount: number;
    notes?: string;
    created_by_user_id?: string;
    created_at: string;
    updated_at: string;
}
export interface SalesTransaction {
    id: string;
    transaction_number: string;
    customer_id?: string;
    transaction_date: string;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    payment_status: 'pending' | 'partial' | 'paid' | 'refunded';
    notes?: string;
    created_by_user_id?: string;
    created_at: string;
    updated_at: string;
}
export interface Staff {
    id: string;
    employee_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    date_of_birth?: string;
    gender?: string;
    position: string;
    department: string;
    branch_id?: string;
    hire_date: string;
    salary: number;
    is_active: boolean;
    role: string;
    created_at: string;
    updated_at: string;
}
export interface StaffUserLink {
    id: string;
    staff_id?: string;
    user_id?: string;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
}
export interface User {
    id: string;
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    phone?: string;
    is_active: boolean;
    email_verified: boolean;
    last_login_at?: string;
    created_at: string;
    updated_at: string;
}
export interface Supplier {
    id: string;
    name: string;
    contact_person: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
    payment_terms: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface SystemSetting {
    id: string;
    setting_key: string;
    setting_value: string;
    description?: string;
    is_encrypted: boolean;
    created_at: string;
    updated_at: string;
}
export interface TaxRate {
    id: string;
    tax_name: string;
    tax_rate: number;
    tax_type: 'percentage' | 'fixed';
    is_active: boolean;
    effective_date: string;
    created_at: string;
    updated_at: string;
}
export interface TransactionItem {
    id: string;
    transaction_id?: string;
    product_id?: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    created_at: string;
}
export interface UserAccountAudit {
    id: string;
    user_id?: string;
    action: string;
    old_values?: any;
    new_values?: any;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
}
export interface UserActivity {
    id: string;
    user_id?: string;
    activity_type: string;
    description: string;
    ip_address?: string;
    user_agent?: string;
    metadata?: any;
    created_at: string;
}
export interface UserRole {
    id: string;
    user_id?: string;
    role_id?: string;
    assigned_at: string;
    assigned_by_user_id?: string;
    created_at: string;
}
export interface UserSession {
    id: string;
    user_id?: string;
    session_token: string;
    expires_at: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface CalculatePayrollRecordResult {
    gross_pay: number;
    tax_amount: number;
    sss_contribution: number;
    philhealth_contribution: number;
    pagibig_contribution: number;
    benefits_deduction: number;
    total_deductions: number;
    net_pay: number;
}
export interface StaffWithUser {
    id: string;
    employee_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    position: string;
    department: string;
    branch_id?: string;
    hire_date: string;
    salary: number;
    is_active: boolean;
    role: string;
    user_id?: string;
    user_email?: string;
    user_is_active?: boolean;
    created_at: string;
    updated_at: string;
}
export interface ProductWithDetails {
    id: string;
    sku: string;
    name: string;
    description: string;
    unit_price: number;
    cost_price: number;
    stock_quantity: number;
    minimum_stock: number;
    maximum_stock: number;
    unit_of_measure: string;
    barcode: string;
    is_active: boolean;
    category_name?: string;
    supplier_name?: string;
    created_at: string;
    updated_at: string;
}
export interface OrderWithDetails {
    id: string;
    order_number: string;
    order_date: string;
    status: string;
    total_amount: number;
    customer_name?: string;
    customer_email?: string;
    items_count: number;
    created_at: string;
    updated_at: string;
}
//# sourceMappingURL=database.d.ts.map