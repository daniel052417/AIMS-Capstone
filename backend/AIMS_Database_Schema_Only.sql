
\restrict 3oWU3KdCy4aWbhzvo1lQcQt0h4y8fEOvV4R3LiIxXxFyWm7lQsJl2cIbDg3mZDy


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."apply_promotion_to_order"("p_order_id" "uuid", "p_promotion_code" character varying) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  promotion_record RECORD;
  order_record RECORD;
  total_discount decimal(12,2) := 0;
BEGIN
  -- Get promotion by code
  SELECT * INTO promotion_record 
  FROM promotions 
  WHERE code = p_promotion_code
  AND is_active = true
  AND start_date <= now()
  AND end_date >= now()
  AND (usage_limit IS NULL OR usage_count < usage_limit);
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired promotion code';
  END IF;
  
  -- Get order details
  SELECT * INTO order_record FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  -- Check minimum amount requirement
  IF promotion_record.minimum_amount IS NOT NULL 
     AND order_record.subtotal < promotion_record.minimum_amount THEN
    RAISE EXCEPTION 'Order amount does not meet minimum requirement';
  END IF;
  
  -- Calculate discount
  total_discount := calculate_discount(promotion_record.id, order_record.subtotal);
  
  -- Apply discount to order
  UPDATE orders
  SET discount_amount = total_discount,
      total_amount = subtotal - total_discount + tax_amount
  WHERE id = p_order_id;
  
  -- Increment usage count
  UPDATE promotions
  SET usage_count = usage_count + 1
  WHERE id = promotion_record.id;
  
  RETURN true;
END;
$$;


ALTER FUNCTION "public"."apply_promotion_to_order"("p_order_id" "uuid", "p_promotion_code" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_trigger_function"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  old_data jsonb;
  new_data jsonb;
  audit_action varchar(20);
BEGIN
  -- Determine action type
  IF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    new_data := NULL;
    audit_action := 'delete';
  ELSIF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    audit_action := 'update';
  ELSIF TG_OP = 'INSERT' THEN
    old_data := NULL;
    new_data := to_jsonb(NEW);
    audit_action := 'insert';
  END IF;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    user_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    audit_action,
    old_data,
    new_data,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_trigger_function"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_discount"("p_promotion_id" "uuid", "p_amount" numeric, "p_quantity" numeric DEFAULT 1) RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  promotion_record RECORD;
  discount_amount decimal(12,2) := 0;
BEGIN
  -- Get promotion details
  SELECT * INTO promotion_record FROM promotions WHERE id = p_promotion_id;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Check minimum amount requirement
  IF promotion_record.minimum_amount IS NOT NULL 
     AND p_amount < promotion_record.minimum_amount THEN
    RETURN 0;
  END IF;
  
  -- Calculate discount based on type
  CASE promotion_record.type
    WHEN 'percentage' THEN
      discount_amount := p_amount * (promotion_record.discount_value / 100);
    WHEN 'fixed' THEN
      discount_amount := promotion_record.discount_value;
    WHEN 'bogo' THEN
      -- Buy One Get One: discount is the price of free items
      -- Assuming discount_value represents the number of free items per purchase
      discount_amount := (p_amount / p_quantity) * FLOOR(p_quantity / (promotion_record.discount_value + 1));
  END CASE;
  
  -- Apply maximum discount limit
  IF promotion_record.maximum_discount IS NOT NULL 
     AND discount_amount > promotion_record.maximum_discount THEN
    discount_amount := promotion_record.maximum_discount;
  END IF;
  
  -- Ensure discount doesn't exceed the amount
  IF discount_amount > p_amount THEN
    discount_amount := p_amount;
  END IF;
  
  RETURN discount_amount;
END;
$$;


ALTER FUNCTION "public"."calculate_discount"("p_promotion_id" "uuid", "p_amount" numeric, "p_quantity" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_processing_fee"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  fee_rate decimal(5,4);
BEGIN
  -- Get processing fee rate from payment method
  SELECT processing_fee INTO fee_rate
  FROM payment_methods
  WHERE id = NEW.payment_method_id;
  
  -- Calculate processing fee
  NEW.processing_fee := NEW.amount * fee_rate;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_processing_fee"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_audit_logs"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  retention_days integer;
BEGIN
  -- Get retention setting
  SELECT (value::text)::integer INTO retention_days
  FROM system_settings
  WHERE key = 'audit_retention_days';
  
  -- Default to 365 days if setting not found
  retention_days := COALESCE(retention_days, 365);
  
  -- Delete old audit logs
  DELETE FROM audit_logs
  WHERE created_at < (now() - (retention_days || ' days')::interval);
END;
$$;


ALTER FUNCTION "public"."cleanup_old_audit_logs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_stock_movement_from_order"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only create movement when order status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO stock_movements (
      branch_id,
      product_variant_id,
      movement_type,
      quantity,
      reference_type,
      reference_id,
      notes,
      created_by
    )
    SELECT 
      NEW.branch_id,
      oi.product_variant_id,
      'out',
      oi.quantity,
      'order',
      NEW.id,
      'Sale - Order: ' || NEW.order_number,
      COALESCE(NEW.created_by, auth.uid())
    FROM order_items oi
    WHERE oi.order_id = NEW.id;
    
    -- Unreserve inventory
    UPDATE inventory
    SET quantity_reserved = quantity_reserved - oi.quantity,
        updated_at = now()
    FROM order_items oi
    WHERE inventory.branch_id = NEW.branch_id
    AND inventory.product_variant_id = oi.product_variant_id
    AND oi.order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_stock_movement_from_order"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_stock_movement_from_po"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only create movement when quantity_received is updated and > 0
  IF NEW.quantity_received > OLD.quantity_received THEN
    INSERT INTO stock_movements (
      branch_id,
      product_variant_id,
      movement_type,
      quantity,
      reference_type,
      reference_id,
      batch_number,
      expiry_date,
      cost,
      notes,
      created_by
    )
    SELECT 
      po.branch_id,
      NEW.product_variant_id,
      'in',
      NEW.quantity_received - OLD.quantity_received,
      'purchase_order',
      NEW.purchase_order_id,
      NEW.batch_number,
      NEW.expiry_date,
      NEW.unit_cost,
      'Received from PO: ' || po.po_number,
      po.created_by
    FROM purchase_orders po
    WHERE po.id = NEW.purchase_order_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_stock_movement_from_po"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_customer_number"() RETURNS character varying
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  next_number integer;
  customer_number varchar(20);
BEGIN
  -- Get the next sequence number
  SELECT COALESCE(MAX(CAST(SUBSTRING(customer_number FROM 'CUST(\d+)') AS integer)), 0) + 1
  INTO next_number
  FROM customers
  WHERE customer_number LIKE 'CUST%';
  
  -- Format: CUST000001
  customer_number := 'CUST' || LPAD(next_number::text, 6, '0');
  
  RETURN customer_number;
END;
$$;


ALTER FUNCTION "public"."generate_customer_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_order_number"() RETURNS character varying
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  next_number integer;
  order_number varchar(50);
BEGIN
  -- Get the next sequence number for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 'ORD-\d{8}-(\d+)') AS integer)), 0) + 1
  INTO next_number
  FROM orders
  WHERE order_number LIKE 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%';
  
  -- Format: ORD-YYYYMMDD-001
  order_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(next_number::text, 3, '0');
  
  RETURN order_number;
END;
$$;


ALTER FUNCTION "public"."generate_order_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_po_number"() RETURNS character varying
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  next_number integer;
  po_number varchar(50);
BEGIN
  -- Get the next sequence number for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 'PO-\d{8}-(\d+)') AS integer)), 0) + 1
  INTO next_number
  FROM purchase_orders
  WHERE po_number LIKE 'PO-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%';
  
  -- Format: PO-YYYYMMDD-001
  po_number := 'PO-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(next_number::text, 3, '0');
  
  RETURN po_number;
END;
$$;


ALTER FUNCTION "public"."generate_po_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_available_stock"("p_branch_id" "uuid", "p_product_variant_id" "uuid") RETURNS numeric
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COALESCE(quantity_available, 0)
  FROM inventory
  WHERE branch_id = p_branch_id AND product_variant_id = p_product_variant_id;
$$;


ALTER FUNCTION "public"."get_available_stock"("p_branch_id" "uuid", "p_product_variant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_branches_open_now"() RETURNS TABLE("branch_id" "uuid", "branch_name" character varying, "branch_code" character varying)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT DISTINCT b.id, b.name, b.code
  FROM branches b
  JOIN branch_operating_hours boh ON b.id = boh.branch_id
  WHERE b.is_active = true
  AND boh.day_of_week = EXTRACT(DOW FROM CURRENT_DATE)::integer
  AND boh.is_open = true
  AND CURRENT_TIME BETWEEN boh.open_time AND boh.close_time;
$$;


ALTER FUNCTION "public"."get_branches_open_now"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_stock_level"("p_branch_id" "uuid", "p_product_variant_id" "uuid") RETURNS numeric
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COALESCE(quantity_on_hand, 0)
  FROM inventory
  WHERE branch_id = p_branch_id AND product_variant_id = p_product_variant_id;
$$;


ALTER FUNCTION "public"."get_stock_level"("p_branch_id" "uuid", "p_product_variant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_system_setting"("setting_key" character varying) RETURNS "jsonb"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT value
  FROM system_settings
  WHERE key = setting_key;
$$;


ALTER FUNCTION "public"."get_system_setting"("setting_key" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_table_change_stats"("p_table_name" character varying, "p_days" integer DEFAULT 30) RETURNS TABLE("action" character varying, "count" bigint, "unique_users" bigint, "last_change" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT 
    al.action,
    COUNT(*) as count,
    COUNT(DISTINCT al.user_id) as unique_users,
    MAX(al.created_at) as last_change
  FROM audit_logs al
  WHERE al.table_name = p_table_name
  AND al.created_at >= (now() - (p_days || ' days')::interval)
  GROUP BY al.action
  ORDER BY count DESC;
$$;


ALTER FUNCTION "public"."get_table_change_stats"("p_table_name" character varying, "p_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_activity_summary"("p_user_id" "uuid", "p_days" integer DEFAULT 30) RETURNS TABLE("action" character varying, "table_name" character varying, "count" bigint, "last_activity" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT 
    al.action,
    al.table_name,
    COUNT(*) as count,
    MAX(al.created_at) as last_activity
  FROM audit_logs al
  WHERE al.user_id = p_user_id
  AND al.created_at >= (now() - (p_days || ' days')::interval)
  GROUP BY al.action, al.table_name
  ORDER BY count DESC, last_activity DESC;
$$;


ALTER FUNCTION "public"."get_user_activity_summary"("p_user_id" "uuid", "p_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_permissions"("user_uuid" "uuid") RETURNS TABLE("permission_name" character varying)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT DISTINCT p.name
  FROM permissions p
  JOIN role_permissions rp ON p.id = rp.permission_id
  JOIN user_roles ur ON rp.role_id = ur.role_id
  WHERE ur.user_id = user_uuid;
$$;


ALTER FUNCTION "public"."get_user_permissions"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role_permissions"("user_uuid" "uuid") RETURNS TABLE("role_name" character varying, "permission_name" character varying, "resource" character varying, "action" character varying)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT 
    r.name as role_name,
    p.name as permission_name,
    p.resource,
    p.action
  FROM users u
  JOIN user_roles ur ON u.id = ur.user_id
  JOIN roles r ON ur.role_id = r.id
  JOIN role_permissions rp ON r.id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE u.id = user_uuid
  ORDER BY r.name, p.resource, p.action;
$$;


ALTER FUNCTION "public"."get_user_role_permissions"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_users_by_role"("role_name" character varying) RETURNS TABLE("user_id" "uuid", "email" character varying, "first_name" character varying, "last_name" character varying, "branch_name" character varying)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    b.name as branch_name
  FROM users u
  JOIN user_roles ur ON u.id = ur.user_id
  JOIN roles r ON ur.role_id = r.id
  LEFT JOIN branches b ON u.branch_id = b.id
  WHERE r.name = role_name
  AND u.is_active = true
  ORDER BY u.first_name, u.last_name;
$$;


ALTER FUNCTION "public"."get_users_by_role"("role_name" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_branch_open_now"("p_branch_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COALESCE(
    (SELECT boh.is_open 
     AND CURRENT_TIME BETWEEN boh.open_time AND boh.close_time
     FROM branch_operating_hours boh
     WHERE boh.branch_id = p_branch_id 
     AND boh.day_of_week = EXTRACT(DOW FROM CURRENT_DATE)::integer),
    false
  );
$$;


ALTER FUNCTION "public"."is_branch_open_now"("p_branch_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_promotion_applicable"("p_promotion_id" "uuid", "p_product_variant_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  promotion_record RECORD;
  product_record RECORD;
BEGIN
  -- Get promotion details
  SELECT * INTO promotion_record FROM promotions WHERE id = p_promotion_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if promotion is active and within date range
  IF NOT promotion_record.is_active 
     OR promotion_record.start_date > now() 
     OR promotion_record.end_date < now() THEN
    RETURN false;
  END IF;
  
  -- Check usage limit
  IF promotion_record.usage_limit IS NOT NULL 
     AND promotion_record.usage_count >= promotion_record.usage_limit THEN
    RETURN false;
  END IF;
  
  -- If applies to all products
  IF promotion_record.applies_to = 'all' THEN
    RETURN true;
  END IF;
  
  -- Get product details
  SELECT p.*, pv.* INTO product_record
  FROM product_variants pv
  JOIN products p ON pv.product_id = p.id
  WHERE pv.id = p_product_variant_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if specific product is included
  IF promotion_record.applies_to = 'product' THEN
    RETURN EXISTS (
      SELECT 1 FROM promotion_products pp
      WHERE pp.promotion_id = p_promotion_id
      AND pp.product_id = product_record.product_id
    );
  END IF;
  
  -- Check if product's category is included
  IF promotion_record.applies_to = 'category' THEN
    RETURN EXISTS (
      SELECT 1 FROM promotion_products pp
      WHERE pp.promotion_id = p_promotion_id
      AND pp.category_id = product_record.category_id
    );
  END IF;
  
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."is_promotion_applicable"("p_promotion_id" "uuid", "p_product_variant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_order_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO order_status_history (order_id, status, notes, changed_by)
    VALUES (NEW.id, NEW.status, 'Status changed from ' || OLD.status || ' to ' || NEW.status, auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_order_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_payment"("p_order_id" "uuid", "p_payment_method_id" "uuid", "p_amount" numeric, "p_reference_number" character varying DEFAULT NULL::character varying, "p_notes" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  payment_id uuid;
  order_record RECORD;
  payment_method_record RECORD;
BEGIN
  -- Get order information
  SELECT * INTO order_record FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  -- Get payment method information
  SELECT * INTO payment_method_record FROM payment_methods WHERE id = p_payment_method_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment method not found';
  END IF;
  
  -- Validate reference number requirement
  IF payment_method_record.requires_reference AND (p_reference_number IS NULL OR p_reference_number = '') THEN
    RAISE EXCEPTION 'Reference number is required for this payment method';
  END IF;
  
  -- Create payment record
  INSERT INTO payments (
    order_id,
    payment_method_id,
    amount,
    reference_number,
    status,
    notes,
    processed_by
  ) VALUES (
    p_order_id,
    p_payment_method_id,
    p_amount,
    p_reference_number,
    'completed', -- Assuming immediate completion for now
    p_notes,
    auth.uid()
  ) RETURNING id INTO payment_id;
  
  RETURN payment_id;
END;
$$;


ALTER FUNCTION "public"."process_payment"("p_order_id" "uuid", "p_payment_method_id" "uuid", "p_amount" numeric, "p_reference_number" character varying, "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refund_payment"("p_payment_id" "uuid", "p_refund_amount" numeric DEFAULT NULL::numeric, "p_notes" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  refund_payment_id uuid;
  original_payment RECORD;
  refund_amount decimal(12,2);
BEGIN
  -- Get original payment information
  SELECT * INTO original_payment FROM payments WHERE id = p_payment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;
  
  -- Determine refund amount
  refund_amount := COALESCE(p_refund_amount, original_payment.amount);
  
  -- Validate refund amount
  IF refund_amount > original_payment.amount THEN
    RAISE EXCEPTION 'Refund amount cannot exceed original payment amount';
  END IF;
  
  -- Create refund payment record (negative amount)
  INSERT INTO payments (
    order_id,
    payment_method_id,
    amount,
    reference_number,
    status,
    notes,
    processed_by
  ) VALUES (
    original_payment.order_id,
    original_payment.payment_method_id,
    -refund_amount,
    'REFUND-' || original_payment.reference_number,
    'completed',
    COALESCE(p_notes, 'Refund for payment: ' || p_payment_id),
    auth.uid()
  ) RETURNING id INTO refund_payment_id;
  
  -- Update original payment status if fully refunded
  IF refund_amount = original_payment.amount THEN
    UPDATE payments
    SET status = 'refunded'
    WHERE id = p_payment_id;
  END IF;
  
  RETURN refund_payment_id;
END;
$$;


ALTER FUNCTION "public"."refund_payment"("p_payment_id" "uuid", "p_refund_amount" numeric, "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_customer_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- if customer_number is null or empty, generate one
  IF NEW.customer_number IS NULL OR NEW.customer_number = '' THEN
    NEW.customer_number := generate_customer_number();
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_customer_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_order_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_order_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_po_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
    NEW.po_number := generate_po_number();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_po_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_system_setting"("setting_key" character varying, "setting_value" "jsonb", "setting_description" "text" DEFAULT NULL::"text", "is_public_setting" boolean DEFAULT false) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO system_settings (key, value, description, is_public, updated_by)
  VALUES (setting_key, setting_value, setting_description, is_public_setting, auth.uid())
  ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = COALESCE(EXCLUDED.description, system_settings.description),
    is_public = EXCLUDED.is_public,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();
END;
$$;


ALTER FUNCTION "public"."set_system_setting"("setting_key" character varying, "setting_value" "jsonb", "setting_description" "text", "is_public_setting" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_inventory_levels"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_inventory RECORD;
BEGIN
  -- Get or create inventory record
  SELECT * INTO current_inventory
  FROM inventory
  WHERE branch_id = NEW.branch_id AND product_variant_id = NEW.product_variant_id;
  
  IF NOT FOUND THEN
    -- Create new inventory record
    INSERT INTO inventory (branch_id, product_variant_id, quantity_on_hand, quantity_reserved)
    VALUES (NEW.branch_id, NEW.product_variant_id, 0, 0);
    
    SELECT * INTO current_inventory
    FROM inventory
    WHERE branch_id = NEW.branch_id AND product_variant_id = NEW.product_variant_id;
  END IF;
  
  -- Update inventory based on movement type
  IF NEW.movement_type = 'in' THEN
    UPDATE inventory
    SET quantity_on_hand = quantity_on_hand + NEW.quantity,
        updated_at = now()
    WHERE id = current_inventory.id;
  ELSIF NEW.movement_type = 'out' THEN
    UPDATE inventory
    SET quantity_on_hand = quantity_on_hand - NEW.quantity,
        updated_at = now()
    WHERE id = current_inventory.id;
  ELSIF NEW.movement_type = 'adjustment' THEN
    UPDATE inventory
    SET quantity_on_hand = quantity_on_hand + NEW.quantity,
        updated_at = now()
    WHERE id = current_inventory.id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_inventory_levels"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_inventory_reservation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  order_record RECORD;
  quantity_change decimal(10,2);
BEGIN
  -- Get order information
  IF TG_OP = 'INSERT' THEN
    SELECT * INTO order_record FROM orders WHERE id = NEW.order_id;
    quantity_change := NEW.quantity;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT * INTO order_record FROM orders WHERE id = NEW.order_id;
    quantity_change := NEW.quantity - OLD.quantity;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT * INTO order_record FROM orders WHERE id = OLD.order_id;
    quantity_change := -OLD.quantity;
  END IF;
  
  -- Only reserve for pending/confirmed orders
  IF order_record.status IN ('pending', 'confirmed') THEN
    UPDATE inventory
    SET quantity_reserved = quantity_reserved + quantity_change,
        updated_at = now()
    WHERE branch_id = order_record.branch_id 
    AND product_variant_id = COALESCE(NEW.product_variant_id, OLD.product_variant_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_inventory_reservation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_order_payment_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  order_total decimal(12,2);
  paid_amount decimal(12,2);
  order_id_to_update uuid;
BEGIN
  -- Get the order ID from the payment record
  order_id_to_update := COALESCE(NEW.order_id, OLD.order_id);
  
  -- Get order total
  SELECT total_amount INTO order_total
  FROM orders
  WHERE id = order_id_to_update;
  
  -- Calculate total paid amount (only completed payments)
  SELECT COALESCE(SUM(amount), 0) INTO paid_amount
  FROM payments
  WHERE order_id = order_id_to_update AND status = 'completed';
  
  -- Update order payment status
  UPDATE orders
  SET payment_status = CASE
    WHEN paid_amount = 0 THEN 'pending'
    WHEN paid_amount < order_total THEN 'partial'
    WHEN paid_amount >= order_total THEN 'paid'
    ELSE 'pending'
  END
  WHERE id = order_id_to_update;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_order_payment_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_order_totals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE orders
  SET 
    subtotal = (
      SELECT COALESCE(SUM(line_total), 0)
      FROM order_items
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    ),
    total_amount = (
      SELECT COALESCE(SUM(line_total), 0) - discount_amount + tax_amount
      FROM order_items
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    )
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_order_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_po_total"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE purchase_orders
  SET total_amount = (
    SELECT COALESCE(SUM(line_total), 0)
    FROM purchase_order_items
    WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
  )
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_po_total"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_permission"("user_uuid" "uuid", "permission_name" character varying) RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = user_uuid AND p.name = permission_name
  );
$$;


ALTER FUNCTION "public"."user_has_permission"("user_uuid" "uuid", "permission_name" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_role"("user_uuid" "uuid", "role_name" character varying) RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid AND r.name = role_name
  );
$$;


ALTER FUNCTION "public"."user_has_role"("user_uuid" "uuid", "role_name" character varying) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "table_name" character varying(100) NOT NULL,
    "record_id" "uuid" NOT NULL,
    "action" character varying(20) NOT NULL,
    "old_values" "jsonb",
    "new_values" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "changed_fields" "text"[],
    CONSTRAINT "chk_audit_action" CHECK ((("action")::"text" = ANY ((ARRAY['insert'::character varying, 'update'::character varying, 'delete'::character varying])::"text"[])))
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."branch_operating_hours" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "branch_id" "uuid" NOT NULL,
    "day_of_week" integer NOT NULL,
    "is_open" boolean DEFAULT true,
    "open_time" time without time zone,
    "close_time" time without time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "branch_operating_hours_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."branch_operating_hours" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."branches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "code" character varying(10) NOT NULL,
    "address" "text" NOT NULL,
    "city" character varying(50) NOT NULL,
    "province" character varying(50) NOT NULL,
    "postal_code" character varying(10),
    "phone" character varying(20),
    "email" character varying(255),
    "manager_id" "uuid",
    "is_active" boolean DEFAULT true,
    "operating_hours" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "branch_type" character varying(20) DEFAULT 'satellite'::character varying,
    CONSTRAINT "branches_branch_type_check" CHECK ((("branch_type")::"text" = ANY ((ARRAY['main'::character varying, 'satellite'::character varying])::"text"[])))
);


ALTER TABLE "public"."branches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(200) NOT NULL,
    "description" "text",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "budget" numeric(12,2),
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_campaign_dates" CHECK (("end_date" >= "start_date")),
    CONSTRAINT "chk_campaign_status" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'paused'::character varying, 'completed'::character varying])::"text"[])))
);


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "parent_id" "uuid",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_number" character varying(20) NOT NULL,
    "first_name" character varying(100) NOT NULL,
    "last_name" character varying(100) NOT NULL,
    "email" character varying(255),
    "phone" character varying(20),
    "address" "text",
    "city" character varying(50),
    "province" character varying(50),
    "customer_type" character varying(20) DEFAULT 'regular'::character varying NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    CONSTRAINT "chk_customer_type" CHECK ((("customer_type")::"text" = ANY ((ARRAY['regular'::character varying, 'vip'::character varying, 'wholesale'::character varying])::"text"[])))
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "branch_id" "uuid" NOT NULL,
    "product_variant_id" "uuid" NOT NULL,
    "quantity_on_hand" numeric(10,2) DEFAULT 0 NOT NULL,
    "quantity_reserved" numeric(10,2) DEFAULT 0 NOT NULL,
    "quantity_available" numeric(10,2) GENERATED ALWAYS AS (("quantity_on_hand" - "quantity_reserved")) STORED,
    "reorder_level" numeric(10,2) DEFAULT 0 NOT NULL,
    "max_stock_level" numeric(10,2) DEFAULT 0 NOT NULL,
    "last_counted" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "product_variant_id" "uuid" NOT NULL,
    "quantity" numeric(10,2) NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "discount_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "line_total" numeric(12,2) NOT NULL,
    "batch_number" character varying(50),
    "expiry_date" "date"
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_status_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "status" character varying(20) NOT NULL,
    "notes" "text",
    "changed_by" "uuid" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."order_status_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_number" character varying(50) NOT NULL,
    "customer_id" "uuid",
    "branch_id" "uuid" NOT NULL,
    "order_type" character varying(20) DEFAULT 'walkin'::character varying NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "order_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pickup_date" timestamp with time zone,
    "completed_date" timestamp with time zone,
    "subtotal" numeric(12,2) DEFAULT 0 NOT NULL,
    "discount_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "tax_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "payment_status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_order_status" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'ready'::character varying, 'completed'::character varying, 'cancelled'::character varying])::"text"[]))),
    CONSTRAINT "chk_order_type" CHECK ((("order_type")::"text" = ANY ((ARRAY['walkin'::character varying, 'online'::character varying])::"text"[]))),
    CONSTRAINT "chk_payment_status" CHECK ((("payment_status")::"text" = ANY ((ARRAY['pending'::character varying, 'partial'::character varying, 'paid'::character varying, 'refunded'::character varying])::"text"[])))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "type" character varying(20) NOT NULL,
    "is_active" boolean DEFAULT true,
    "requires_reference" boolean DEFAULT false,
    "processing_fee" numeric(5,4) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_payment_type" CHECK ((("type")::"text" = ANY ((ARRAY['cash'::character varying, 'card'::character varying, 'digital_wallet'::character varying])::"text"[])))
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "payment_method_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "reference_number" character varying(100),
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "payment_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processing_fee" numeric(10,2) DEFAULT 0,
    "notes" "text",
    "processed_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_payment_status" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying])::"text"[])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "resource" character varying(50) NOT NULL,
    "action" character varying(50) NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prescriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "veterinarian_name" character varying(100) NOT NULL,
    "veterinarian_license" character varying(50),
    "prescription_date" "date" NOT NULL,
    "expiry_date" "date" NOT NULL,
    "file_url" "text",
    "notes" "text",
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_prescription_status" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'expired'::character varying, 'used'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."prescriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "sku" character varying(50) NOT NULL,
    "name" character varying(200) NOT NULL,
    "variant_type" character varying(50) NOT NULL,
    "variant_value" character varying(100) NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "cost" numeric(10,2),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_variants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sku" character varying(50) NOT NULL,
    "name" character varying(200) NOT NULL,
    "description" "text",
    "category_id" "uuid" NOT NULL,
    "brand" character varying(100),
    "unit_of_measure" character varying(20) NOT NULL,
    "weight" numeric(10,3),
    "dimensions" "jsonb",
    "is_prescription_required" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promotion_products" (
    "promotion_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "category_id" "uuid",
    CONSTRAINT "chk_product_or_category" CHECK (((("product_id" IS NOT NULL) AND ("category_id" IS NULL)) OR (("product_id" IS NULL) AND ("category_id" IS NOT NULL))))
);


ALTER TABLE "public"."promotion_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promotions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid",
    "name" character varying(200) NOT NULL,
    "code" character varying(50),
    "type" character varying(20) NOT NULL,
    "discount_value" numeric(10,2) NOT NULL,
    "minimum_amount" numeric(10,2),
    "maximum_discount" numeric(10,2),
    "usage_limit" integer,
    "usage_count" integer DEFAULT 0,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT true,
    "applies_to" character varying(20) DEFAULT 'all'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_applies_to" CHECK ((("applies_to")::"text" = ANY ((ARRAY['all'::character varying, 'category'::character varying, 'product'::character varying])::"text"[]))),
    CONSTRAINT "chk_promotion_dates" CHECK (("end_date" >= "start_date")),
    CONSTRAINT "chk_promotion_type" CHECK ((("type")::"text" = ANY ((ARRAY['percentage'::character varying, 'fixed'::character varying, 'bogo'::character varying])::"text"[])))
);


ALTER TABLE "public"."promotions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_order_id" "uuid" NOT NULL,
    "product_variant_id" "uuid" NOT NULL,
    "quantity_ordered" numeric(10,2) NOT NULL,
    "quantity_received" numeric(10,2) DEFAULT 0,
    "unit_cost" numeric(10,2) NOT NULL,
    "line_total" numeric(12,2) NOT NULL,
    "expiry_date" "date",
    "batch_number" character varying(50)
);


ALTER TABLE "public"."purchase_order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "po_number" character varying(50) NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "branch_id" "uuid" NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "order_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "expected_date" "date",
    "received_date" "date",
    "total_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "notes" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_po_status" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'received'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."purchase_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" character varying(255) NOT NULL,
    "first_name" character varying(100) NOT NULL,
    "last_name" character varying(100) NOT NULL,
    "phone" character varying(20),
    "branch_id" "uuid",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_login" timestamp with time zone
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."recent_activity" AS
 SELECT "al"."id",
    "al"."user_id",
    ((("u"."first_name")::"text" || ' '::"text") || ("u"."last_name")::"text") AS "user_name",
    "al"."table_name",
    "al"."record_id",
    "al"."action",
    "al"."created_at"
   FROM ("public"."audit_logs" "al"
     LEFT JOIN "public"."users" "u" ON (("al"."user_id" = "u"."id")))
  WHERE ("al"."created_at" >= ("now"() - '7 days'::interval))
  ORDER BY "al"."created_at" DESC;


ALTER VIEW "public"."recent_activity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permission_audit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "target_user_id" "uuid" NOT NULL,
    "role_id" "uuid",
    "permission_id" "uuid",
    "action" character varying(20) NOT NULL,
    "granted_by" "uuid" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"(),
    "revoked_by" "uuid",
    "revoked_at" timestamp with time zone,
    "notes" "text",
    CONSTRAINT "chk_rpa_action" CHECK ((("action")::"text" = ANY ((ARRAY['role_granted'::character varying, 'role_revoked'::character varying, 'permission_granted'::character varying, 'permission_revoked'::character varying])::"text"[])))
);


ALTER TABLE "public"."role_permission_audit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "role_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "description" "text",
    "is_system_role" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."role_permissions_view" AS
 SELECT "r"."name" AS "role_name",
    "p"."name" AS "permission_name",
    "p"."resource",
    "p"."action",
    "p"."description"
   FROM (("public"."roles" "r"
     JOIN "public"."role_permissions" "rp" ON (("r"."id" = "rp"."role_id")))
     JOIN "public"."permissions" "p" ON (("rp"."permission_id" = "p"."id")))
  ORDER BY "r"."name", "p"."resource", "p"."action";


ALTER VIEW "public"."role_permissions_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_adjustments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "branch_id" "uuid" NOT NULL,
    "adjustment_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "reason" character varying(100) NOT NULL,
    "status" character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    "total_value" numeric(12,2) DEFAULT 0,
    "notes" "text",
    "created_by" "uuid" NOT NULL,
    "approved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_adjustment_status" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'approved'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."stock_adjustments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "branch_id" "uuid" NOT NULL,
    "product_variant_id" "uuid" NOT NULL,
    "movement_type" character varying(20) NOT NULL,
    "quantity" numeric(10,2) NOT NULL,
    "reference_type" character varying(20) NOT NULL,
    "reference_id" "uuid",
    "batch_number" character varying(50),
    "expiry_date" "date",
    "cost" numeric(10,2),
    "notes" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_movement_type" CHECK ((("movement_type")::"text" = ANY ((ARRAY['in'::character varying, 'out'::character varying, 'adjustment'::character varying, 'transfer'::character varying])::"text"[]))),
    CONSTRAINT "chk_reference_type" CHECK ((("reference_type")::"text" = ANY ((ARRAY['purchase_order'::character varying, 'order'::character varying, 'adjustment'::character varying, 'transfer'::character varying, 'initial'::character varying])::"text"[])))
);


ALTER TABLE "public"."stock_movements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(200) NOT NULL,
    "code" character varying(20) NOT NULL,
    "contact_person" character varying(100),
    "email" character varying(255),
    "phone" character varying(20),
    "address" "text",
    "payment_terms" character varying(50),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" character varying(100) NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" "text",
    "is_public" boolean DEFAULT false,
    "updated_by" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."system_stats" AS
 SELECT 'users'::"text" AS "entity",
    "count"(*) AS "total_count",
    "count"(*) FILTER (WHERE ("users"."is_active" = true)) AS "active_count"
   FROM "public"."users"
UNION ALL
 SELECT 'branches'::"text" AS "entity",
    "count"(*) AS "total_count",
    "count"(*) FILTER (WHERE ("branches"."is_active" = true)) AS "active_count"
   FROM "public"."branches"
UNION ALL
 SELECT 'products'::"text" AS "entity",
    "count"(*) AS "total_count",
    "count"(*) FILTER (WHERE ("products"."is_active" = true)) AS "active_count"
   FROM "public"."products"
UNION ALL
 SELECT 'customers'::"text" AS "entity",
    "count"(*) AS "total_count",
    "count"(*) FILTER (WHERE ("customers"."is_active" = true)) AS "active_count"
   FROM "public"."customers"
UNION ALL
 SELECT 'orders'::"text" AS "entity",
    "count"(*) AS "total_count",
    "count"(*) FILTER (WHERE (("orders"."status")::"text" <> 'cancelled'::"text")) AS "active_count"
   FROM "public"."orders"
UNION ALL
 SELECT 'suppliers'::"text" AS "entity",
    "count"(*) AS "total_count",
    "count"(*) FILTER (WHERE ("suppliers"."is_active" = true)) AS "active_count"
   FROM "public"."suppliers";


ALTER VIEW "public"."system_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."units_of_measure" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(10) NOT NULL,
    "name" character varying(50) NOT NULL,
    "category" character varying(20) NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_uom_category" CHECK ((("category")::"text" = ANY ((ARRAY['weight'::character varying, 'volume'::character varying, 'length'::character varying, 'area'::character varying, 'count'::character varying, 'time'::character varying])::"text"[])))
);


ALTER TABLE "public"."units_of_measure" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."branch_operating_hours"
    ADD CONSTRAINT "branch_operating_hours_branch_id_day_of_week_key" UNIQUE ("branch_id", "day_of_week");



ALTER TABLE ONLY "public"."branch_operating_hours"
    ADD CONSTRAINT "branch_operating_hours_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_customer_number_key" UNIQUE ("customer_number");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_branch_id_product_variant_id_key" UNIQUE ("branch_id", "product_variant_id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_status_history"
    ADD CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_order_number_key" UNIQUE ("order_number");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "public"."promotions"
    ADD CONSTRAINT "promotions_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."promotions"
    ADD CONSTRAINT "promotions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_po_number_key" UNIQUE ("po_number");



ALTER TABLE ONLY "public"."role_permission_audit"
    ADD CONSTRAINT "role_permission_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_adjustments"
    ADD CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."units_of_measure"
    ADD CONSTRAINT "units_of_measure_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."units_of_measure"
    ADD CONSTRAINT "units_of_measure_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promotion_products"
    ADD CONSTRAINT "uq_promotion_category" UNIQUE ("promotion_id", "category_id");



ALTER TABLE ONLY "public"."promotion_products"
    ADD CONSTRAINT "uq_promotion_product" UNIQUE ("promotion_id", "product_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs" USING "btree" ("action");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at");



CREATE INDEX "idx_audit_logs_table_record" ON "public"."audit_logs" USING "btree" ("table_name", "record_id");



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_branches_code" ON "public"."branches" USING "btree" ("code");



CREATE INDEX "idx_branches_is_active" ON "public"."branches" USING "btree" ("is_active");



CREATE INDEX "idx_campaigns_dates" ON "public"."campaigns" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_campaigns_status" ON "public"."campaigns" USING "btree" ("status");



CREATE INDEX "idx_categories_is_active" ON "public"."categories" USING "btree" ("is_active");



CREATE INDEX "idx_categories_parent_id" ON "public"."categories" USING "btree" ("parent_id");



CREATE INDEX "idx_customers_customer_number" ON "public"."customers" USING "btree" ("customer_number");



CREATE INDEX "idx_customers_customer_type" ON "public"."customers" USING "btree" ("customer_type");



CREATE INDEX "idx_customers_email" ON "public"."customers" USING "btree" ("email");



CREATE INDEX "idx_customers_phone" ON "public"."customers" USING "btree" ("phone");



CREATE INDEX "idx_inventory_branch_product" ON "public"."inventory" USING "btree" ("branch_id", "product_variant_id");



CREATE INDEX "idx_inventory_reorder_level" ON "public"."inventory" USING "btree" ("reorder_level") WHERE ("quantity_on_hand" <= "reorder_level");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_order_items_product_variant_id" ON "public"."order_items" USING "btree" ("product_variant_id");



CREATE INDEX "idx_order_status_history_changed_at" ON "public"."order_status_history" USING "btree" ("changed_at");



CREATE INDEX "idx_order_status_history_order_id" ON "public"."order_status_history" USING "btree" ("order_id");



CREATE INDEX "idx_orders_branch_id" ON "public"."orders" USING "btree" ("branch_id");



CREATE INDEX "idx_orders_customer_id" ON "public"."orders" USING "btree" ("customer_id");



CREATE INDEX "idx_orders_order_date" ON "public"."orders" USING "btree" ("order_date");



CREATE INDEX "idx_orders_order_number" ON "public"."orders" USING "btree" ("order_number");



CREATE INDEX "idx_orders_payment_status" ON "public"."orders" USING "btree" ("payment_status");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_payment_methods_is_active" ON "public"."payment_methods" USING "btree" ("is_active");



CREATE INDEX "idx_payment_methods_type" ON "public"."payment_methods" USING "btree" ("type");



CREATE INDEX "idx_payments_order_id" ON "public"."payments" USING "btree" ("order_id");



CREATE INDEX "idx_payments_payment_date" ON "public"."payments" USING "btree" ("payment_date");



CREATE INDEX "idx_payments_payment_method_id" ON "public"."payments" USING "btree" ("payment_method_id");



CREATE INDEX "idx_payments_processed_by" ON "public"."payments" USING "btree" ("processed_by");



CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("status");



CREATE INDEX "idx_product_variants_is_active" ON "public"."product_variants" USING "btree" ("is_active");



CREATE INDEX "idx_product_variants_product_id" ON "public"."product_variants" USING "btree" ("product_id");



CREATE INDEX "idx_product_variants_sku" ON "public"."product_variants" USING "btree" ("sku");



CREATE INDEX "idx_products_category_id" ON "public"."products" USING "btree" ("category_id");



CREATE INDEX "idx_products_is_active" ON "public"."products" USING "btree" ("is_active");



CREATE INDEX "idx_products_sku" ON "public"."products" USING "btree" ("sku");



CREATE INDEX "idx_promotion_products_category_id" ON "public"."promotion_products" USING "btree" ("category_id");



CREATE INDEX "idx_promotion_products_product_id" ON "public"."promotion_products" USING "btree" ("product_id");



CREATE INDEX "idx_promotion_products_promotion_id" ON "public"."promotion_products" USING "btree" ("promotion_id");



CREATE INDEX "idx_promotions_active" ON "public"."promotions" USING "btree" ("is_active");



CREATE INDEX "idx_promotions_campaign_id" ON "public"."promotions" USING "btree" ("campaign_id");



CREATE INDEX "idx_promotions_code" ON "public"."promotions" USING "btree" ("code");



CREATE INDEX "idx_promotions_dates" ON "public"."promotions" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_purchase_order_items_po_id" ON "public"."purchase_order_items" USING "btree" ("purchase_order_id");



CREATE INDEX "idx_purchase_order_items_product_variant_id" ON "public"."purchase_order_items" USING "btree" ("product_variant_id");



CREATE INDEX "idx_purchase_orders_branch_id" ON "public"."purchase_orders" USING "btree" ("branch_id");



CREATE INDEX "idx_purchase_orders_order_date" ON "public"."purchase_orders" USING "btree" ("order_date");



CREATE INDEX "idx_purchase_orders_status" ON "public"."purchase_orders" USING "btree" ("status");



CREATE INDEX "idx_purchase_orders_supplier_id" ON "public"."purchase_orders" USING "btree" ("supplier_id");



CREATE INDEX "idx_stock_adjustments_branch_id" ON "public"."stock_adjustments" USING "btree" ("branch_id");



CREATE INDEX "idx_stock_adjustments_status" ON "public"."stock_adjustments" USING "btree" ("status");



CREATE INDEX "idx_stock_movements_branch_product" ON "public"."stock_movements" USING "btree" ("branch_id", "product_variant_id");



CREATE INDEX "idx_stock_movements_created_at" ON "public"."stock_movements" USING "btree" ("created_at");



CREATE INDEX "idx_stock_movements_reference" ON "public"."stock_movements" USING "btree" ("reference_type", "reference_id");



CREATE INDEX "idx_suppliers_code" ON "public"."suppliers" USING "btree" ("code");



CREATE INDEX "idx_suppliers_is_active" ON "public"."suppliers" USING "btree" ("is_active");



CREATE INDEX "idx_system_settings_is_public" ON "public"."system_settings" USING "btree" ("is_public");



CREATE INDEX "idx_system_settings_key" ON "public"."system_settings" USING "btree" ("key");



CREATE INDEX "idx_users_branch_id" ON "public"."users" USING "btree" ("branch_id");



CREATE OR REPLACE TRIGGER "audit_branches_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."branches" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_campaigns_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_categories_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_customers_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_inventory_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."inventory" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_orders_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_payments_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_product_variants_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."product_variants" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_products_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_promotions_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."promotions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_purchase_orders_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."purchase_orders" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_suppliers_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_users_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "calculate_processing_fee_trigger" BEFORE INSERT OR UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_processing_fee"();



CREATE OR REPLACE TRIGGER "create_stock_movement_from_order_trigger" AFTER UPDATE ON "public"."orders" FOR EACH ROW WHEN (((("new"."status")::"text" = 'completed'::"text") AND (("old"."status")::"text" <> 'completed'::"text"))) EXECUTE FUNCTION "public"."create_stock_movement_from_order"();



CREATE OR REPLACE TRIGGER "create_stock_movement_from_po_trigger" AFTER UPDATE ON "public"."purchase_order_items" FOR EACH ROW WHEN (("new"."quantity_received" > "old"."quantity_received")) EXECUTE FUNCTION "public"."create_stock_movement_from_po"();



CREATE OR REPLACE TRIGGER "log_order_status_change_trigger" AFTER UPDATE ON "public"."orders" FOR EACH ROW WHEN ((("new"."status")::"text" <> ("old"."status")::"text")) EXECUTE FUNCTION "public"."log_order_status_change"();



CREATE OR REPLACE TRIGGER "set_customer_number_trigger" BEFORE INSERT ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."set_customer_number"();



CREATE OR REPLACE TRIGGER "set_order_number_trigger" BEFORE INSERT ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_order_number"();



CREATE OR REPLACE TRIGGER "set_po_number_trigger" BEFORE INSERT ON "public"."purchase_orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_po_number"();



CREATE OR REPLACE TRIGGER "update_inventory_levels_trigger" AFTER INSERT ON "public"."stock_movements" FOR EACH ROW EXECUTE FUNCTION "public"."update_inventory_levels"();



CREATE OR REPLACE TRIGGER "update_inventory_reservation_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."order_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_inventory_reservation"();



CREATE OR REPLACE TRIGGER "update_inventory_updated_at" BEFORE UPDATE ON "public"."inventory" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_order_payment_status_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_order_payment_status"();



CREATE OR REPLACE TRIGGER "update_order_totals_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."order_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_order_totals"();



CREATE OR REPLACE TRIGGER "update_po_total_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."purchase_order_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_po_total"();



CREATE OR REPLACE TRIGGER "update_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_system_settings_updated_at" BEFORE UPDATE ON "public"."system_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."branch_operating_hours"
    ADD CONSTRAINT "branch_operating_hours_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "fk_users_branch_id" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id");



ALTER TABLE ONLY "public"."order_status_history"
    ADD CONSTRAINT "order_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."order_status_history"
    ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."promotion_products"
    ADD CONSTRAINT "promotion_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."promotion_products"
    ADD CONSTRAINT "promotion_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."promotion_products"
    ADD CONSTRAINT "promotion_products_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promotions"
    ADD CONSTRAINT "promotions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id");



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id");



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."role_permission_audit"
    ADD CONSTRAINT "role_permission_audit_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."role_permission_audit"
    ADD CONSTRAINT "role_permission_audit_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."role_permission_audit"
    ADD CONSTRAINT "role_permission_audit_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."role_permission_audit"
    ADD CONSTRAINT "role_permission_audit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_adjustments"
    ADD CONSTRAINT "stock_adjustments_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."stock_adjustments"
    ADD CONSTRAINT "stock_adjustments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id");



ALTER TABLE ONLY "public"."stock_adjustments"
    ADD CONSTRAINT "stock_adjustments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage branch operating hours" ON "public"."branch_operating_hours" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'HR Admin'::character varying])::"text"[]))))));



CREATE POLICY "Admins can manage user roles" ON "public"."user_roles" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'HR Admin'::character varying])::"text"[]))))));



CREATE POLICY "All authenticated users can read active branches" ON "public"."branches" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "All authenticated users can read active campaigns" ON "public"."campaigns" FOR SELECT TO "authenticated" USING (((("status")::"text" = 'active'::"text") AND ("start_date" <= CURRENT_DATE) AND ("end_date" >= CURRENT_DATE)));



CREATE POLICY "All authenticated users can read active categories" ON "public"."categories" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "All authenticated users can read active payment methods" ON "public"."payment_methods" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "All authenticated users can read active product variants" ON "public"."product_variants" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "All authenticated users can read active products" ON "public"."products" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "All authenticated users can read active promotions" ON "public"."promotions" FOR SELECT TO "authenticated" USING ((("is_active" = true) AND ("start_date" <= "now"()) AND ("end_date" >= "now"()) AND (("usage_limit" IS NULL) OR ("usage_count" < "usage_limit"))));



CREATE POLICY "All authenticated users can read active suppliers" ON "public"."suppliers" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "All authenticated users can read active units of measure" ON "public"."units_of_measure" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "All authenticated users can read branch operating hours" ON "public"."branch_operating_hours" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "All authenticated users can read permissions" ON "public"."permissions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "All authenticated users can read promotion products" ON "public"."promotion_products" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "All authenticated users can read public settings" ON "public"."system_settings" FOR SELECT TO "authenticated" USING (("is_public" = true));



CREATE POLICY "All authenticated users can read role permissions" ON "public"."role_permissions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "All authenticated users can read roles" ON "public"."roles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Cashiers can manage payments" ON "public"."payments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Cashier (POS)'::character varying])::"text"[]))))));



CREATE POLICY "Customers can read own data" ON "public"."customers" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Client'::"text") AND (("customers"."email")::"text" = (( SELECT "users"."email"
           FROM "public"."users"
          WHERE ("users"."id" = "auth"."uid"())))::"text")))) OR (EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Cashier (POS)'::character varying, 'Marketing Admin'::character varying, 'Marketing Staff'::character varying])::"text"[])))))));



CREATE POLICY "HR admins can manage branches" ON "public"."branches" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'HR Admin'::character varying])::"text"[]))))));



CREATE POLICY "HR admins can manage users" ON "public"."users" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'HR Admin'::character varying])::"text"[]))))));



CREATE POLICY "Inventory clerks and admins can manage categories" ON "public"."categories" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Inventory Clerk'::character varying, 'Marketing Admin'::character varying])::"text"[]))))));



CREATE POLICY "Inventory clerks and admins can manage product variants" ON "public"."product_variants" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Inventory Clerk'::character varying, 'Marketing Admin'::character varying])::"text"[]))))));



CREATE POLICY "Inventory clerks and admins can manage products" ON "public"."products" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Inventory Clerk'::character varying, 'Marketing Admin'::character varying])::"text"[]))))));



CREATE POLICY "Inventory clerks and admins can manage suppliers" ON "public"."suppliers" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Inventory Clerk'::character varying])::"text"[]))))));



CREATE POLICY "Inventory clerks and cashiers can create stock movements" ON "public"."stock_movements" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Inventory Clerk'::character varying, 'Cashier (POS)'::character varying])::"text"[]))))));



CREATE POLICY "Inventory clerks can manage PO items" ON "public"."purchase_order_items" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Inventory Clerk'::character varying])::"text"[]))))));



CREATE POLICY "Inventory clerks can manage inventory" ON "public"."inventory" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Inventory Clerk'::character varying])::"text"[]))))));



CREATE POLICY "Inventory clerks can manage purchase orders" ON "public"."purchase_orders" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Inventory Clerk'::character varying])::"text"[]))))));



CREATE POLICY "Inventory clerks can manage stock adjustments" ON "public"."stock_adjustments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Inventory Clerk'::character varying])::"text"[]))))));



CREATE POLICY "Inventory clerks can update stock movements" ON "public"."stock_movements" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Inventory Clerk'::character varying])::"text"[]))))));



CREATE POLICY "Marketing staff can manage campaigns" ON "public"."campaigns" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Marketing Admin'::character varying, 'Marketing Staff'::character varying])::"text"[]))))));



CREATE POLICY "Marketing staff can manage promotion products" ON "public"."promotion_products" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Marketing Admin'::character varying, 'Marketing Staff'::character varying])::"text"[]))))));



CREATE POLICY "Marketing staff can manage promotions" ON "public"."promotions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Marketing Admin'::character varying, 'Marketing Staff'::character varying])::"text"[]))))));



CREATE POLICY "Only super admins can manage permissions" ON "public"."permissions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Super Admin'::"text")))));



CREATE POLICY "Only super admins can manage role permissions" ON "public"."role_permissions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Super Admin'::"text")))));



CREATE POLICY "Only super admins can manage roles" ON "public"."roles" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Super Admin'::"text")))));



CREATE POLICY "Staff can create order status history" ON "public"."order_status_history" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Cashier (POS)'::character varying])::"text"[]))))));



CREATE POLICY "Staff can manage customers" ON "public"."customers" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Cashier (POS)'::character varying, 'Marketing Admin'::character varying])::"text"[]))))));



CREATE POLICY "Staff can manage order items" ON "public"."order_items" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Cashier (POS)'::character varying])::"text"[]))))));



CREATE POLICY "Staff can manage orders" ON "public"."orders" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Cashier (POS)'::character varying])::"text"[]))))));



CREATE POLICY "Super admins can manage all branches" ON "public"."branches" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Super Admin'::"text")))));



CREATE POLICY "Super admins can manage payment methods" ON "public"."payment_methods" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Super Admin'::"text")))));



CREATE POLICY "Super admins can manage settings" ON "public"."system_settings" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Super Admin'::"text")))));



CREATE POLICY "Super admins can read all audit logs" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Super Admin'::"text")))));



CREATE POLICY "Super admins can read all settings" ON "public"."system_settings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Super Admin'::"text")))));



CREATE POLICY "Super admins can read all users" ON "public"."users" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Super Admin'::"text")))));



CREATE POLICY "Super admins can read role permission audit" ON "public"."role_permission_audit" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Super Admin'::"text")))));



CREATE POLICY "Users can read PO items for accessible purchase orders" ON "public"."purchase_order_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."purchase_orders" "po"
  WHERE (("po"."id" = "purchase_order_items"."purchase_order_id") AND (("po"."branch_id" IN ( SELECT "users"."branch_id"
           FROM "public"."users"
          WHERE ("users"."id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
           FROM ("public"."user_roles" "ur"
             JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
          WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Super Admin'::"text")))))))));



CREATE POLICY "Users can read inventory for their branch" ON "public"."inventory" FOR SELECT TO "authenticated" USING ((("branch_id" IN ( SELECT "users"."branch_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Super Admin'::"text"))))));



CREATE POLICY "Users can read order items for accessible orders" ON "public"."order_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_items"."order_id") AND (("o"."branch_id" IN ( SELECT "users"."branch_id"
           FROM "public"."users"
          WHERE ("users"."id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
           FROM ("public"."user_roles" "ur"
             JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
          WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Super Admin'::"text")))) OR (("o"."customer_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM ("public"."customers" "c"
             JOIN "public"."users" "u" ON ((("c"."email")::"text" = ("u"."email")::"text")))
          WHERE (("c"."id" = "o"."customer_id") AND ("u"."id" = "auth"."uid"()))))))))));



CREATE POLICY "Users can read order status history for accessible orders" ON "public"."order_status_history" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_status_history"."order_id") AND (("o"."branch_id" IN ( SELECT "users"."branch_id"
           FROM "public"."users"
          WHERE ("users"."id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
           FROM ("public"."user_roles" "ur"
             JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
          WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Super Admin'::"text")))))))));



CREATE POLICY "Users can read orders for their branch or own orders" ON "public"."orders" FOR SELECT TO "authenticated" USING ((("branch_id" IN ( SELECT "users"."branch_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Super Admin'::"text")))) OR (("customer_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM ("public"."customers" "c"
     JOIN "public"."users" "u" ON ((("c"."email")::"text" = ("u"."email")::"text")))
  WHERE (("c"."id" = "orders"."customer_id") AND ("u"."id" = "auth"."uid"())))))));



CREATE POLICY "Users can read own data" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can read own roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read payments for accessible orders" ON "public"."payments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "payments"."order_id") AND (("o"."branch_id" IN ( SELECT "users"."branch_id"
           FROM "public"."users"
          WHERE ("users"."id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
           FROM ("public"."user_roles" "ur"
             JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
          WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Super Admin'::"text")))) OR (("o"."customer_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM ("public"."customers" "c"
             JOIN "public"."users" "u" ON ((("c"."email")::"text" = ("u"."email")::"text")))
          WHERE (("c"."id" = "o"."customer_id") AND ("u"."id" = "auth"."uid"()))))))))));



CREATE POLICY "Users can read prescriptions for accessible customers" ON "public"."prescriptions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."customers" "c"
  WHERE (("c"."id" = "prescriptions"."customer_id") AND (("c"."user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM ("public"."user_roles" "ur"
             JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
          WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['Super Admin'::character varying, 'Cashier (POS)'::character varying])::"text"[]))))))))));



CREATE POLICY "Users can read purchase orders for their branch" ON "public"."purchase_orders" FOR SELECT TO "authenticated" USING ((("branch_id" IN ( SELECT "users"."branch_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Super Admin'::"text"))))));



CREATE POLICY "Users can read stock adjustments for their branch" ON "public"."stock_adjustments" FOR SELECT TO "authenticated" USING ((("branch_id" IN ( SELECT "users"."branch_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Super Admin'::"text"))))));



CREATE POLICY "Users can read stock movements for their branch" ON "public"."stock_movements" FOR SELECT TO "authenticated" USING ((("branch_id" IN ( SELECT "users"."branch_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = 'Super Admin'::"text"))))));



CREATE POLICY "Users can read their own audit logs" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."branch_operating_hours" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."branches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prescriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promotion_products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promotions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permission_audit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_adjustments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_movements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."units_of_measure" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_promotion_to_order"("p_order_id" "uuid", "p_promotion_code" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."apply_promotion_to_order"("p_order_id" "uuid", "p_promotion_code" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_promotion_to_order"("p_order_id" "uuid", "p_promotion_code" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_trigger_function"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_trigger_function"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_trigger_function"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_discount"("p_promotion_id" "uuid", "p_amount" numeric, "p_quantity" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_discount"("p_promotion_id" "uuid", "p_amount" numeric, "p_quantity" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_discount"("p_promotion_id" "uuid", "p_amount" numeric, "p_quantity" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_processing_fee"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_processing_fee"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_processing_fee"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_audit_logs"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_audit_logs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_audit_logs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_stock_movement_from_order"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_stock_movement_from_order"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_stock_movement_from_order"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_stock_movement_from_po"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_stock_movement_from_po"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_stock_movement_from_po"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_customer_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_customer_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_customer_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_po_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_po_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_po_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_stock"("p_branch_id" "uuid", "p_product_variant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_stock"("p_branch_id" "uuid", "p_product_variant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_stock"("p_branch_id" "uuid", "p_product_variant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_branches_open_now"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_branches_open_now"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_branches_open_now"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_stock_level"("p_branch_id" "uuid", "p_product_variant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_stock_level"("p_branch_id" "uuid", "p_product_variant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_stock_level"("p_branch_id" "uuid", "p_product_variant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_system_setting"("setting_key" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_system_setting"("setting_key" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_system_setting"("setting_key" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_table_change_stats"("p_table_name" character varying, "p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_table_change_stats"("p_table_name" character varying, "p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_table_change_stats"("p_table_name" character varying, "p_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_activity_summary"("p_user_id" "uuid", "p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_activity_summary"("p_user_id" "uuid", "p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_activity_summary"("p_user_id" "uuid", "p_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_permissions"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role_permissions"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role_permissions"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role_permissions"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_users_by_role"("role_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_users_by_role"("role_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_users_by_role"("role_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_branch_open_now"("p_branch_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_branch_open_now"("p_branch_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_branch_open_now"("p_branch_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_promotion_applicable"("p_promotion_id" "uuid", "p_product_variant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_promotion_applicable"("p_promotion_id" "uuid", "p_product_variant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_promotion_applicable"("p_promotion_id" "uuid", "p_product_variant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_order_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_order_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_order_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_payment"("p_order_id" "uuid", "p_payment_method_id" "uuid", "p_amount" numeric, "p_reference_number" character varying, "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_payment"("p_order_id" "uuid", "p_payment_method_id" "uuid", "p_amount" numeric, "p_reference_number" character varying, "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_payment"("p_order_id" "uuid", "p_payment_method_id" "uuid", "p_amount" numeric, "p_reference_number" character varying, "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."refund_payment"("p_payment_id" "uuid", "p_refund_amount" numeric, "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."refund_payment"("p_payment_id" "uuid", "p_refund_amount" numeric, "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."refund_payment"("p_payment_id" "uuid", "p_refund_amount" numeric, "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_customer_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_customer_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_customer_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_order_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_po_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_po_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_po_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_system_setting"("setting_key" character varying, "setting_value" "jsonb", "setting_description" "text", "is_public_setting" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."set_system_setting"("setting_key" character varying, "setting_value" "jsonb", "setting_description" "text", "is_public_setting" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_system_setting"("setting_key" character varying, "setting_value" "jsonb", "setting_description" "text", "is_public_setting" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_inventory_levels"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_inventory_levels"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_inventory_levels"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_inventory_reservation"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_inventory_reservation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_inventory_reservation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_order_payment_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_order_payment_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_order_payment_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_order_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_order_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_order_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_po_total"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_po_total"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_po_total"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_permission"("user_uuid" "uuid", "permission_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_permission"("user_uuid" "uuid", "permission_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_permission"("user_uuid" "uuid", "permission_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_role"("user_uuid" "uuid", "role_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_role"("user_uuid" "uuid", "role_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_role"("user_uuid" "uuid", "role_name" character varying) TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."branch_operating_hours" TO "anon";
GRANT ALL ON TABLE "public"."branch_operating_hours" TO "authenticated";
GRANT ALL ON TABLE "public"."branch_operating_hours" TO "service_role";



GRANT ALL ON TABLE "public"."branches" TO "anon";
GRANT ALL ON TABLE "public"."branches" TO "authenticated";
GRANT ALL ON TABLE "public"."branches" TO "service_role";



GRANT ALL ON TABLE "public"."campaigns" TO "anon";
GRANT ALL ON TABLE "public"."campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."inventory" TO "anon";
GRANT ALL ON TABLE "public"."inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."order_status_history" TO "anon";
GRANT ALL ON TABLE "public"."order_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."order_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."prescriptions" TO "anon";
GRANT ALL ON TABLE "public"."prescriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."prescriptions" TO "service_role";



GRANT ALL ON TABLE "public"."product_variants" TO "anon";
GRANT ALL ON TABLE "public"."product_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."product_variants" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."promotion_products" TO "anon";
GRANT ALL ON TABLE "public"."promotion_products" TO "authenticated";
GRANT ALL ON TABLE "public"."promotion_products" TO "service_role";



GRANT ALL ON TABLE "public"."promotions" TO "anon";
GRANT ALL ON TABLE "public"."promotions" TO "authenticated";
GRANT ALL ON TABLE "public"."promotions" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_order_items" TO "anon";
GRANT ALL ON TABLE "public"."purchase_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_orders" TO "anon";
GRANT ALL ON TABLE "public"."purchase_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_orders" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."recent_activity" TO "anon";
GRANT ALL ON TABLE "public"."recent_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."recent_activity" TO "service_role";



GRANT ALL ON TABLE "public"."role_permission_audit" TO "anon";
GRANT ALL ON TABLE "public"."role_permission_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permission_audit" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions_view" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions_view" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions_view" TO "service_role";



GRANT ALL ON TABLE "public"."stock_adjustments" TO "anon";
GRANT ALL ON TABLE "public"."stock_adjustments" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_adjustments" TO "service_role";



GRANT ALL ON TABLE "public"."stock_movements" TO "anon";
GRANT ALL ON TABLE "public"."stock_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_movements" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."system_stats" TO "anon";
GRANT ALL ON TABLE "public"."system_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."system_stats" TO "service_role";



GRANT ALL ON TABLE "public"."units_of_measure" TO "anon";
GRANT ALL ON TABLE "public"."units_of_measure" TO "authenticated";
GRANT ALL ON TABLE "public"."units_of_measure" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






\unrestrict 3oWU3KdCy4aWbhzvo1lQcQt0h4y8fEOvV4R3LiIxXxFyWm7lQsJl2cIbDg3mZDy

RESET ALL;
