export interface Product {
    id: string;
    sku: string;
    name: string;
    description?: string;
    category_id: string;
    brand?: string;
    unit_of_measure: string;
    weight?: number;
    dimensions?: any; // JSONB field
    is_prescription_required: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  variant_type: string;
  variant_value: string;
  price: number;
  cost?: number;
  is_active: boolean;
  created_at: string;
}

export interface Inventory {
  id: string;
  branch_id: string;
  product_variant_id: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  reorder_level: number;
  max_stock_level: number;
  last_counted?: string;
  updated_at: string;
}

export interface ProductVariantWithInventory extends ProductVariant {
  inventory: Inventory[];
}

export interface ProductWithVariantsAndInventory extends Product {
  variants: ProductVariantWithInventory[];
  category?: {
    id: string;
    name: string;
    description?: string;
  };
  unit_of_measure?: {
    id: string;
    name: string;
    abbreviation: string;
  };
}
  
export interface Category {
    id: string;
    name: string;
    description?: string;
    parent_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
export interface ProductCreateRequest {
    name: string;
    description?: string;
    sku: string;
    barcode?: string;
    category_id: string;
    unit_of_measure_id: string;
    purchase_price: number;
    selling_price: number;
    min_stock_level: number;
    max_stock_level: number;
    branch_id?: string;
  }
  
export interface ProductUpdateRequest {
    // Product fields
    name?: string;
    description?: string;
    sku?: string;
    category_id?: string;
    brand?: string;
    unit_of_measure?: string;
    weight?: number;
    dimensions?: any;
    is_prescription_required?: boolean;
    is_active?: boolean;
    
    // Variants data
    variants?: ProductVariantUpdateRequest[];
  }

export interface ProductVariantUpdateRequest {
    id?: string; // If provided, update existing variant
    sku?: string;
    name?: string;
    variant_type?: string;
    variant_value?: string;
    price?: number;
    cost?: number;
    is_active?: boolean;
  }

export interface ProductWithVariantsUpdateRequest extends ProductUpdateRequest {
    variants: ProductVariantUpdateRequest[];
  }