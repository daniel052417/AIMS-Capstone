-- =====================================================
-- AIMS Database Schema - Products & Inventory Module
-- =====================================================
-- This module contains product management, categories, inventory, and stock management
-- Dependencies: 01_core_functions.sql, 02_auth_users.sql, 03_branches.sql

-- =====================================================
-- TABLES
-- =====================================================

-- Categories table
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

-- Units of measure table
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

-- Products table
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

-- Product variants table
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

-- Inventory table
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

-- Stock movements table
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

-- Stock adjustments table
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

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Primary keys
ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."units_of_measure"
    ADD CONSTRAINT "units_of_measure_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."stock_adjustments"
    ADD CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id");

-- Unique constraints
ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."units_of_measure"
    ADD CONSTRAINT "units_of_measure_code_key" UNIQUE ("code");

ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_sku_key" UNIQUE ("sku");

ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_sku_key" UNIQUE ("sku");

ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_branch_product_key" UNIQUE ("branch_id", "product_variant_id");

-- Foreign key constraints
ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");

ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");

ALTER TABLE ONLY "public"."stock_adjustments"
    ADD CONSTRAINT "stock_adjustments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."stock_adjustments"
    ADD CONSTRAINT "stock_adjustments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");

ALTER TABLE ONLY "public"."stock_adjustments"
    ADD CONSTRAINT "stock_adjustments_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Get available stock for a product variant at a branch
CREATE OR REPLACE FUNCTION "public"."get_available_stock"("p_branch_id" "uuid", "p_product_variant_id" "uuid") RETURNS numeric
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COALESCE(quantity_available, 0)
  FROM inventory
  WHERE branch_id = p_branch_id AND product_variant_id = p_product_variant_id;
$$;

ALTER FUNCTION "public"."get_available_stock"("p_branch_id" "uuid", "p_product_variant_id" "uuid") OWNER TO "postgres";

-- Get stock level for a product variant at a branch
CREATE OR REPLACE FUNCTION "public"."get_stock_level"("p_branch_id" "uuid", "p_product_variant_id" "uuid") RETURNS numeric
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COALESCE(quantity_on_hand, 0)
  FROM inventory
  WHERE branch_id = p_branch_id AND product_variant_id = p_product_variant_id;
$$;

ALTER FUNCTION "public"."get_stock_level"("p_branch_id" "uuid", "p_product_variant_id" "uuid") OWNER TO "postgres";

-- Update inventory levels when stock movements are created
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
  
  -- Update quantity based on movement type
  IF NEW.movement_type = 'in' THEN
    UPDATE inventory
    SET quantity_on_hand = quantity_on_hand + NEW.quantity
    WHERE branch_id = NEW.branch_id AND product_variant_id = NEW.product_variant_id;
  ELSIF NEW.movement_type = 'out' THEN
    UPDATE inventory
    SET quantity_on_hand = quantity_on_hand - NEW.quantity
    WHERE branch_id = NEW.branch_id AND product_variant_id = NEW.product_variant_id;
  ELSIF NEW.movement_type = 'adjustment' THEN
    UPDATE inventory
    SET quantity_on_hand = NEW.quantity
    WHERE branch_id = NEW.branch_id AND product_variant_id = NEW.product_variant_id;
  END IF;
  
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_inventory_levels"() OWNER TO "postgres";

-- Update inventory reservation when order items change
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
    SET quantity_reserved = quantity_reserved + quantity_change
    WHERE branch_id = order_record.branch_id AND product_variant_id = COALESCE(NEW.product_variant_id, OLD.product_variant_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

ALTER FUNCTION "public"."update_inventory_reservation"() OWNER TO "postgres";

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Audit triggers
CREATE OR REPLACE TRIGGER "audit_categories_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();

CREATE OR REPLACE TRIGGER "audit_products_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();

CREATE OR REPLACE TRIGGER "audit_product_variants_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."product_variants" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();

CREATE OR REPLACE TRIGGER "audit_inventory_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."inventory" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();

-- Update triggers
CREATE OR REPLACE TRIGGER "update_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE OR REPLACE TRIGGER "update_inventory_updated_at" BEFORE UPDATE ON "public"."inventory" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Inventory management triggers
CREATE OR REPLACE TRIGGER "update_inventory_levels_trigger" AFTER INSERT ON "public"."stock_movements" FOR EACH ROW EXECUTE FUNCTION "public"."update_inventory_levels"();

CREATE OR REPLACE TRIGGER "update_inventory_reservation_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."order_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_inventory_reservation"();

-- =====================================================
-- INDEXES
-- =====================================================

-- Categories indexes
CREATE INDEX "idx_categories_is_active" ON "public"."categories" USING "btree" ("is_active");
CREATE INDEX "idx_categories_parent_id" ON "public"."categories" USING "btree" ("parent_id");

-- Products indexes
CREATE INDEX "idx_products_category_id" ON "public"."products" USING "btree" ("category_id");
CREATE INDEX "idx_products_is_active" ON "public"."products" USING "btree" ("is_active");
CREATE INDEX "idx_products_sku" ON "public"."products" USING "btree" ("sku");

-- Product variants indexes
CREATE INDEX "idx_product_variants_is_active" ON "public"."product_variants" USING "btree" ("is_active");
CREATE INDEX "idx_product_variants_product_id" ON "public"."product_variants" USING "btree" ("product_id");
CREATE INDEX "idx_product_variants_sku" ON "public"."product_variants" USING "btree" ("sku");

-- Inventory indexes
CREATE INDEX "idx_inventory_branch_product" ON "public"."inventory" USING "btree" ("branch_id", "product_variant_id");
CREATE INDEX "idx_inventory_reorder_level" ON "public"."inventory" USING "btree" ("reorder_level") WHERE ("quantity_on_hand" <= "reorder_level");

-- Stock movements indexes
CREATE INDEX "idx_stock_movements_branch_product" ON "public"."stock_movements" USING "btree" ("branch_id", "product_variant_id");
CREATE INDEX "idx_stock_movements_created_at" ON "public"."stock_movements" USING "btree" ("created_at");
CREATE INDEX "idx_stock_movements_reference" ON "public"."stock_movements" USING "btree" ("reference_type", "reference_id");

-- Stock adjustments indexes
CREATE INDEX "idx_stock_adjustments_branch_id" ON "public"."stock_adjustments" USING "btree" ("branch_id");
CREATE INDEX "idx_stock_adjustments_status" ON "public"."stock_adjustments" USING "btree" ("status");

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- All authenticated users can read active categories
CREATE POLICY "All authenticated users can read active categories" ON "public"."categories" FOR SELECT TO "authenticated" USING (("is_active" = true));

-- All authenticated users can read active products
CREATE POLICY "All authenticated users can read active products" ON "public"."products" FOR SELECT TO "authenticated" USING (("is_active" = true));

-- All authenticated users can read active product variants
CREATE POLICY "All authenticated users can read active product variants" ON "public"."product_variants" FOR SELECT TO "authenticated" USING (("is_active" = true));

-- All authenticated users can read active units of measure
CREATE POLICY "All authenticated users can read active units of measure" ON "public"."units_of_measure" FOR SELECT TO "authenticated" USING (("is_active" = true));

-- Users can read inventory for their branch
CREATE POLICY "Users can read inventory for their branch" ON "public"."inventory" FOR SELECT TO "authenticated" USING (("branch_id" IN ( SELECT "users"."branch_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));

-- Inventory clerks and admins can manage categories
CREATE POLICY "Inventory clerks and admins can manage categories" ON "public"."categories" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['inventory_clerk'::"text", 'super_admin'::"text"])::"text"[]))))));

-- Inventory clerks and admins can manage products
CREATE POLICY "Inventory clerks and admins can manage products" ON "public"."products" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['inventory_clerk'::"text", 'super_admin'::"text"])::"text"[]))))));

-- Inventory clerks and admins can manage product variants
CREATE POLICY "Inventory clerks and admins can manage product variants" ON "public"."product_variants" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['inventory_clerk'::"text", 'super_admin'::"text"])::"text"[]))))));

-- Inventory clerks can manage inventory
CREATE POLICY "Inventory clerks can manage inventory" ON "public"."inventory" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['inventory_clerk'::"text", 'super_admin'::"text"])::"text"[]))))));

-- Inventory clerks and cashiers can create stock movements
CREATE POLICY "Inventory clerks and cashiers can create stock movements" ON "public"."stock_movements" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['inventory_clerk'::"text", 'cashier'::"text", 'super_admin'::"text"])::"text"[]))))));

-- Inventory clerks can update stock movements
CREATE POLICY "Inventory clerks can update stock movements" ON "public"."stock_movements" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['inventory_clerk'::"text", 'super_admin'::"text"])::"text"[]))))));

-- Inventory clerks can manage stock adjustments
CREATE POLICY "Inventory clerks can manage stock adjustments" ON "public"."stock_adjustments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['inventory_clerk'::"text", 'super_admin'::"text"])::"text"[]))))));

-- Users can read stock adjustments for their branch
CREATE POLICY "Users can read stock adjustments for their branch" ON "public"."stock_adjustments" FOR SELECT TO "authenticated" USING (("branch_id" IN ( SELECT "users"."branch_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));

-- Users can read stock movements for their branch
CREATE POLICY "Users can read stock movements for their branch" ON "public"."stock_movements" FOR SELECT TO "authenticated" USING (("branch_id" IN ( SELECT "users"."branch_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant permissions to functions
GRANT ALL ON FUNCTION "public"."get_available_stock"("p_branch_id" "uuid", "p_product_variant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_stock"("p_branch_id" "uuid", "p_product_variant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_stock"("p_branch_id" "uuid", "p_product_variant_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_stock_level"("p_branch_id" "uuid", "p_product_variant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_stock_level"("p_branch_id" "uuid", "p_product_variant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_stock_level"("p_branch_id" "uuid", "p_product_variant_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."update_inventory_levels"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_inventory_levels"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_inventory_levels"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_inventory_reservation"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_inventory_reservation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_inventory_reservation"() TO "service_role";

-- Grant table permissions
GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";

GRANT ALL ON TABLE "public"."units_of_measure" TO "anon";
GRANT ALL ON TABLE "public"."units_of_measure" TO "authenticated";
GRANT ALL ON TABLE "public"."units_of_measure" TO "service_role";

GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";

GRANT ALL ON TABLE "public"."product_variants" TO "anon";
GRANT ALL ON TABLE "public"."product_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."product_variants" TO "service_role";

GRANT ALL ON TABLE "public"."inventory" TO "anon";
GRANT ALL ON TABLE "public"."inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory" TO "service_role";

GRANT ALL ON TABLE "public"."stock_movements" TO "anon";
GRANT ALL ON TABLE "public"."stock_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_movements" TO "service_role";

GRANT ALL ON TABLE "public"."stock_adjustments" TO "anon";
GRANT ALL ON TABLE "public"."stock_adjustments" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_adjustments" TO "service_role";
