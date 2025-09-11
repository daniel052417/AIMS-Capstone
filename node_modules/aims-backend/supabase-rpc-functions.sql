-- RPC Functions for AIMS Backend
-- Run these in your Supabase SQL Editor

-- 1. Get Low Stock Products
CREATE OR REPLACE FUNCTION get_low_stock_products()
RETURNS TABLE(
  id uuid,
  sku text,
  name text,
  description text,
  category_id uuid,
  supplier_id uuid,
  unit_price numeric(10,2),
  cost_price numeric(10,2),
  stock_quantity integer,
  minimum_stock integer,
  maximum_stock integer,
  unit_of_measure text,
  barcode text,
  expiry_date date,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  category jsonb,
  supplier jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.sku,
    p.name,
    p.description,
    p.category_id,
    p.supplier_id,
    p.unit_price,
    p.cost_price,
    p.stock_quantity,
    p.minimum_stock,
    p.maximum_stock,
    p.unit_of_measure,
    p.barcode,
    p.expiry_date,
    p.is_active,
    p.created_at,
    p.updated_at,
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'description', c.description
    ) as category,
    jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'contact_person', s.contact_person,
      'email', s.email,
      'phone', s.phone
    ) as supplier
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN suppliers s ON p.supplier_id = s.id
  WHERE p.stock_quantity <= p.minimum_stock
    AND p.is_active = true
  ORDER BY p.stock_quantity ASC;
END;
$$ LANGUAGE plpgsql;

-- 2. Get Low Stock Inventory Levels
CREATE OR REPLACE FUNCTION get_low_stock_inventory_levels()
RETURNS TABLE(
  id uuid,
  product_id uuid,
  location_id uuid,
  quantity_on_hand integer,
  reserved_quantity integer,
  reorder_point integer,
  max_stock_level integer,
  last_restock_date date,
  last_count_date date,
  created_at timestamptz,
  updated_at timestamptz,
  product jsonb,
  location jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    il.id,
    il.product_id,
    il.location_id,
    il.quantity_on_hand,
    il.reserved_quantity,
    il.reorder_point,
    il.max_stock_level,
    il.last_restock_date,
    il.last_count_date,
    il.created_at,
    il.updated_at,
    jsonb_build_object(
      'id', p.id,
      'sku', p.sku,
      'name', p.name,
      'unit_of_measure', p.unit_of_measure
    ) as product,
    jsonb_build_object(
      'id', l.id,
      'name', l.name,
      'address', l.address
    ) as location
  FROM inventory_levels il
  LEFT JOIN products p ON il.product_id = p.id
  LEFT JOIN locations l ON il.location_id = l.id
  WHERE il.quantity_on_hand <= il.reorder_point
  ORDER BY il.quantity_on_hand ASC;
END;
$$ LANGUAGE plpgsql;

-- 3. Get Products with Low Stock (Alternative approach using filters)
CREATE OR REPLACE FUNCTION get_products_with_low_stock_filter()
RETURNS TABLE(
  id uuid,
  sku text,
  name text,
  description text,
  category_id uuid,
  supplier_id uuid,
  unit_price numeric(10,2),
  cost_price numeric(10,2),
  stock_quantity integer,
  minimum_stock integer,
  maximum_stock integer,
  unit_of_measure text,
  barcode text,
  expiry_date date,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.sku,
    p.name,
    p.description,
    p.category_id,
    p.supplier_id,
    p.unit_price,
    p.cost_price,
    p.stock_quantity,
    p.minimum_stock,
    p.maximum_stock,
    p.unit_of_measure,
    p.barcode,
    p.expiry_date,
    p.is_active,
    p.created_at,
    p.updated_at
  FROM products p
  WHERE p.stock_quantity <= p.minimum_stock
    AND p.is_active = true
  ORDER BY p.stock_quantity ASC;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Sales Order with Transaction
CREATE OR REPLACE FUNCTION create_sales_order_transaction(
  p_order_data jsonb,
  p_items_data jsonb[],
  p_status_data jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_order_id uuid;
  v_order_result jsonb;
  v_items_result jsonb[];
  v_item jsonb;
BEGIN
  -- Insert sales order
  INSERT INTO sales_orders (
    order_number,
    customer_id,
    staff_id,
    branch_id,
    order_date,
    required_date,
    shipped_date,
    status,
    subtotal,
    discount_amount,
    tax_amount,
    shipping_amount,
    total_amount,
    shipping_address,
    notes,
    payment_method,
    payment_status,
    created_by_user_id,
    created_at,
    updated_at
  ) VALUES (
    (p_order_data->>'order_number'),
    (p_order_data->>'customer_id')::uuid,
    (p_order_data->>'staff_id')::uuid,
    (p_order_data->>'branch_id')::uuid,
    COALESCE((p_order_data->>'order_date')::timestamptz, NOW()),
    (p_order_data->>'required_date')::date,
    (p_order_data->>'shipped_date')::date,
    COALESCE(p_order_data->>'status', 'pending'),
    (p_order_data->>'subtotal')::numeric,
    COALESCE((p_order_data->>'discount_amount')::numeric, 0),
    COALESCE((p_order_data->>'tax_amount')::numeric, 0),
    COALESCE((p_order_data->>'shipping_amount')::numeric, 0),
    (p_order_data->>'total_amount')::numeric,
    p_order_data->>'shipping_address',
    p_order_data->>'notes',
    p_order_data->>'payment_method',
    COALESCE(p_order_data->>'payment_status', 'pending'),
    (p_order_data->>'created_by_user_id')::uuid,
    NOW(),
    NOW()
  ) RETURNING id INTO v_order_id;

  -- Insert order items
  FOREACH v_item IN ARRAY p_items_data
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      unit_price,
      discount_percentage,
      total_price,
      created_at
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price')::numeric,
      COALESCE((v_item->>'discount_percentage')::numeric, 0),
      (v_item->>'total_price')::numeric,
      NOW()
    );
  END LOOP;

  -- Insert status history
  INSERT INTO order_status_history (
    order_id,
    status,
    notes,
    changed_by_user_id,
    created_at
  ) VALUES (
    v_order_id,
    p_status_data->>'status',
    p_status_data->>'notes',
    (p_status_data->>'changed_by_user_id')::uuid,
    NOW()
  );

  -- Return the created order with items
  SELECT jsonb_build_object(
    'id', so.id,
    'order_number', so.order_number,
    'customer_id', so.customer_id,
    'staff_id', so.staff_id,
    'branch_id', so.branch_id,
    'order_date', so.order_date,
    'required_date', so.required_date,
    'shipped_date', so.shipped_date,
    'status', so.status,
    'subtotal', so.subtotal,
    'discount_amount', so.discount_amount,
    'tax_amount', so.tax_amount,
    'shipping_amount', so.shipping_amount,
    'total_amount', so.total_amount,
    'shipping_address', so.shipping_address,
    'notes', so.notes,
    'payment_method', so.payment_method,
    'payment_status', so.payment_status,
    'created_by_user_id', so.created_by_user_id,
    'created_at', so.created_at,
    'updated_at', so.updated_at,
    'order_items', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'order_id', oi.order_id,
          'product_id', oi.product_id,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'discount_percentage', oi.discount_percentage,
          'total_price', oi.total_price,
          'created_at', oi.created_at
        )
      )
      FROM order_items oi
      WHERE oi.order_id = so.id
    )
  )
  INTO v_order_result
  FROM sales_orders so
  WHERE so.id = v_order_id;

  RETURN v_order_result;
END;
$$ LANGUAGE plpgsql;

-- 5. Generate Unique Customer Code
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS text AS $$
DECLARE
  v_code text;
  v_counter integer;
BEGIN
  -- Get the next counter value (use smaller numbers to avoid integer overflow)
  SELECT COALESCE(MAX(CAST(SUBSTRING(customer_code FROM 'CUST-(\d+)') AS integer)), 0) + 1
  INTO v_counter
  FROM customers
  WHERE customer_code ~ '^CUST-\d+$';
  
  -- Use 4-digit counter to avoid integer overflow
  v_code := 'CUST-' || LPAD(v_counter::text, 4, '0');
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- 6. Generate Unique Order Number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  v_number text;
  v_counter integer;
BEGIN
  -- Get the next counter value (use smaller numbers to avoid integer overflow)
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 'ORD-(\d+)') AS integer)), 0) + 1
  INTO v_counter
  FROM sales_orders
  WHERE order_number ~ '^ORD-\d+$';
  
  -- Use 4-digit counter to avoid integer overflow
  v_number := 'ORD-' || LPAD(v_counter::text, 4, '0');
  
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- 7. Add missing payment_method column to sales_orders table
ALTER TABLE sales_orders 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash';

-- Add constraint for payment_method values
ALTER TABLE sales_orders 
ADD CONSTRAINT IF NOT EXISTS sales_orders_payment_method_check 
CHECK (payment_method = ANY (ARRAY['cash', 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'check', 'other']));

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_low_stock_products() TO authenticated;
GRANT EXECUTE ON FUNCTION get_low_stock_inventory_levels() TO authenticated;
GRANT EXECUTE ON FUNCTION get_products_with_low_stock_filter() TO authenticated;
GRANT EXECUTE ON FUNCTION create_sales_order_transaction(jsonb, jsonb[], jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_customer_code() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_order_number() TO authenticated;
