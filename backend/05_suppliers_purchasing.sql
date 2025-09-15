-- =====================================================
-- AIMS Database Schema - Suppliers & Purchasing Module
-- =====================================================
-- This module contains supplier management and purchase order processing
-- Dependencies: 01_core_functions.sql, 02_auth_users.sql, 03_branches.sql, 04_products_inventory.sql

-- =====================================================
-- TABLES
-- =====================================================

-- Suppliers table
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

-- Purchase orders table
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

-- Purchase order items table
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

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Primary keys
ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id");

-- Unique constraints
ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_code_key" UNIQUE ("code");

ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_po_number_key" UNIQUE ("po_number");

-- Foreign key constraints
ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");

ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id");

ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");

ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id");

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Generate purchase order number
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

-- Set purchase order number on insert
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

-- Update purchase order total when items change
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

-- Create stock movement when purchase order items are received
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

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Audit triggers
CREATE OR REPLACE TRIGGER "audit_suppliers_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();

CREATE OR REPLACE TRIGGER "audit_purchase_orders_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."purchase_orders" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();

-- Purchase order management triggers
CREATE OR REPLACE TRIGGER "set_po_number_trigger" BEFORE INSERT ON "public"."purchase_orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_po_number"();

CREATE OR REPLACE TRIGGER "update_po_total_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."purchase_order_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_po_total"();

CREATE OR REPLACE TRIGGER "create_stock_movement_from_po_trigger" AFTER UPDATE ON "public"."purchase_order_items" FOR EACH ROW WHEN (("new"."quantity_received" > "old"."quantity_received")) EXECUTE FUNCTION "public"."create_stock_movement_from_po"();

-- =====================================================
-- INDEXES
-- =====================================================

-- Suppliers indexes
CREATE INDEX "idx_suppliers_code" ON "public"."suppliers" USING "btree" ("code");
CREATE INDEX "idx_suppliers_is_active" ON "public"."suppliers" USING "btree" ("is_active");

-- Purchase orders indexes
CREATE INDEX "idx_purchase_orders_branch_id" ON "public"."purchase_orders" USING "btree" ("branch_id");
CREATE INDEX "idx_purchase_orders_order_date" ON "public"."purchase_orders" USING "btree" ("order_date");
CREATE INDEX "idx_purchase_orders_status" ON "public"."purchase_orders" USING "btree" ("status");
CREATE INDEX "idx_purchase_orders_supplier_id" ON "public"."purchase_orders" USING "btree" ("supplier_id");

-- Purchase order items indexes
CREATE INDEX "idx_purchase_order_items_po_id" ON "public"."purchase_order_items" USING "btree" ("purchase_order_id");
CREATE INDEX "idx_purchase_order_items_product_variant_id" ON "public"."purchase_order_items" USING "btree" ("product_variant_id");

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- All authenticated users can read active suppliers
CREATE POLICY "All authenticated users can read active suppliers" ON "public"."suppliers" FOR SELECT TO "authenticated" USING (("is_active" = true));

-- Users can read purchase orders for their branch
CREATE POLICY "Users can read purchase orders for their branch" ON "public"."purchase_orders" FOR SELECT TO "authenticated" USING (("branch_id" IN ( SELECT "users"."branch_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));

-- Users can read PO items for accessible purchase orders
CREATE POLICY "Users can read PO items for accessible purchase orders" ON "public"."purchase_order_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."purchase_orders" "po"
   JOIN "public"."users" "u" ON "po"."branch_id" = "u"."branch_id"
  WHERE (("po"."id" = "purchase_order_items"."purchase_order_id") AND ("u"."id" = "auth"."uid"())))));

-- Inventory clerks and admins can manage suppliers
CREATE POLICY "Inventory clerks and admins can manage suppliers" ON "public"."suppliers" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['inventory_clerk'::"text", 'super_admin'::"text"])::"text"[]))))));

-- Inventory clerks can manage purchase orders
CREATE POLICY "Inventory clerks can manage purchase orders" ON "public"."purchase_orders" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['inventory_clerk'::"text", 'super_admin'::"text"])::"text"[]))))));

-- Inventory clerks can manage PO items
CREATE POLICY "Inventory clerks can manage PO items" ON "public"."purchase_order_items" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['inventory_clerk'::"text", 'super_admin'::"text"])::"text"[]))))));

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant permissions to functions
GRANT ALL ON FUNCTION "public"."generate_po_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_po_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_po_number"() TO "service_role";

GRANT ALL ON FUNCTION "public"."set_po_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_po_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_po_number"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_po_total"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_po_total"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_po_total"() TO "service_role";

GRANT ALL ON FUNCTION "public"."create_stock_movement_from_po"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_stock_movement_from_po"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_stock_movement_from_po"() TO "service_role";

-- Grant table permissions
GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";

GRANT ALL ON TABLE "public"."purchase_orders" TO "anon";
GRANT ALL ON TABLE "public"."purchase_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_orders" TO "service_role";

GRANT ALL ON TABLE "public"."purchase_order_items" TO "anon";
GRANT ALL ON TABLE "public"."purchase_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_order_items" TO "service_role";
