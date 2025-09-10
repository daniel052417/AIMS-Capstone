// POS System Types

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  sku?: string;
  barcode?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  unit?: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  stock_quantity: number;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_point?: number;
  supplier?: string;
  supplier_contact?: string;
  supplier_price?: number;
  tax_rate?: number;
  is_active: boolean;
  is_featured?: boolean;
  tags?: string[];
  images?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount?: number;
  discount_percentage?: number;
  tax_amount?: number;
  notes?: string;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  customer_type?: 'individual' | 'business';
  business_name?: string;
  tax_id?: string;
  credit_limit?: number;
  payment_terms?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface POSSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  starting_cash: number;
  ending_cash?: number;
  total_sales: number;
  total_transactions: number;
  status: 'active' | 'closed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  session_id: string;
  customer_id?: string;
  transaction_number: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'check' | 'other';
  payment_reference?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount?: number;
  tax_amount?: number;
}

export interface PaymentFormData {
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'check' | 'other';
  amount: number;
  reference?: string;
  notes?: string;
}

export interface ProductSearchFilters {
  query?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  in_stock_only?: boolean;
  is_active?: boolean;
}

export interface CustomerSearchFilters {
  query?: string;
  customer_type?: 'individual' | 'business';
  is_active?: boolean;
}

export interface QuickSaleItem {
  id: string;
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface POSStats {
  total_sales: number;
  total_transactions: number;
  average_transaction_value: number;
  top_products: Array<{
    product: Product;
    quantity_sold: number;
    revenue: number;
  }>;
  sales_by_hour: Array<{
    hour: number;
    sales: number;
    transactions: number;
  }>;
  sales_by_category: Array<{
    category: string;
    sales: number;
    percentage: number;
  }>;
}

export interface InventoryAlert {
  id: string;
  product_id: string;
  product: Product;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock';
  current_quantity: number;
  threshold_quantity: number;
  message: string;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
  payment_terms?: string;
  credit_limit?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  parent?: Category;
  children?: Category[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}