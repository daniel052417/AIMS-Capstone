-- =====================================================
-- AIMS Database Schema - Customers & Orders Module
-- =====================================================
-- This module contains customer management and order processing
-- Dependencies: 01_core_functions.sql, 02_auth_users.sql, 03_branches.sql, 04_products_inventory.sql

-- =====================================================
-- TABLES
-- =====================================================

-- Customers table
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

-- Orders table
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

-- Order items table
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

-- Order status history table
CREATE TABLE IF NOT EXISTS "public"."order_status_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "status" character varying(20) NOT NULL,
    "notes" "text",
    "changed_by" "uuid" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."order_status_history" OWNER TO "postgres";

-- Prescriptions table
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

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Primary keys
ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."order_status_history"
    ADD CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id");

-- Unique constraints
ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_customer_number_key" UNIQUE ("customer_number");

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_order_number_key" UNIQUE ("order_number");

-- Foreign key constraints
ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id");

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");

ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id");

ALTER TABLE ONLY "public"."order_status_history"
    ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."order_status_history"
    ADD CONSTRAINT "order_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id");

ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Generate customer number
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

-- Generate order number
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

-- Set customer number on insert
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

-- Set order number on insert
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

-- Log order status changes
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

-- Update order totals when items change
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

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Audit triggers
CREATE OR REPLACE TRIGGER "audit_customers_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();

CREATE OR REPLACE TRIGGER "audit_orders_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();

-- Order management triggers
CREATE OR REPLACE TRIGGER "set_customer_number_trigger" BEFORE INSERT ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."set_customer_number"();

CREATE OR REPLACE TRIGGER "set_order_number_trigger" BEFORE INSERT ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_order_number"();

CREATE OR REPLACE TRIGGER "log_order_status_change_trigger" AFTER UPDATE ON "public"."orders" FOR EACH ROW WHEN ((("new"."status")::"text" <> ("old"."status")::"text")) EXECUTE FUNCTION "public"."log_order_status_change"();

CREATE OR REPLACE TRIGGER "update_order_totals_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."order_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_order_totals"();

-- Inventory management triggers (from products_inventory module)
CREATE OR REPLACE TRIGGER "update_inventory_reservation_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."order_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_inventory_reservation"();

-- Stock movement trigger (from products_inventory module)
CREATE OR REPLACE TRIGGER "create_stock_movement_from_order_trigger" AFTER UPDATE ON "public"."orders" FOR EACH ROW WHEN (((("new"."status")::"text" = 'completed'::"text") AND (("old"."status")::"text" <> 'completed'::"text"))) EXECUTE FUNCTION "public"."create_stock_movement_from_order"();

-- =====================================================
-- INDEXES
-- =====================================================

-- Customers indexes
CREATE INDEX "idx_customers_customer_number" ON "public"."customers" USING "btree" ("customer_number");
CREATE INDEX "idx_customers_customer_type" ON "public"."customers" USING "btree" ("customer_type");
CREATE INDEX "idx_customers_email" ON "public"."customers" USING "btree" ("email");
CREATE INDEX "idx_customers_phone" ON "public"."customers" USING "btree" ("phone");

-- Orders indexes
CREATE INDEX "idx_orders_branch_id" ON "public"."orders" USING "btree" ("branch_id");
CREATE INDEX "idx_orders_customer_id" ON "public"."orders" USING "btree" ("customer_id");
CREATE INDEX "idx_orders_order_date" ON "public"."orders" USING "btree" ("order_date");
CREATE INDEX "idx_orders_order_number" ON "public"."orders" USING "btree" ("order_number");
CREATE INDEX "idx_orders_payment_status" ON "public"."orders" USING "btree" ("payment_status");
CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");

-- Order items indexes
CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");
CREATE INDEX "idx_order_items_product_variant_id" ON "public"."order_items" USING "btree" ("product_variant_id");

-- Order status history indexes
CREATE INDEX "idx_order_status_history_changed_at" ON "public"."order_status_history" USING "btree" ("changed_at");
CREATE INDEX "idx_order_status_history_order_id" ON "public"."order_status_history" USING "btree" ("order_id");

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Customers can read own data
CREATE POLICY "Customers can read own data" ON "public"."customers" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."id" = "customers"."user_id"())))) OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['staff'::"text", 'cashier'::"text", 'super_admin'::"text"])::"text"[])))))));

-- Staff can manage customers
CREATE POLICY "Staff can manage customers" ON "public"."customers" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['staff'::"text", 'cashier'::"text", 'super_admin'::"text"])::"text"[]))))));

-- Staff can manage orders
CREATE POLICY "Staff can manage orders" ON "public"."orders" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['staff'::"text", 'cashier'::"text", 'super_admin'::"text"])::"text"[]))))));

-- Staff can manage order items
CREATE POLICY "Staff can manage order items" ON "public"."order_items" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['staff'::"text", 'cashier'::"text", 'super_admin'::"text"])::"text"[]))))));

-- Staff can create order status history
CREATE POLICY "Staff can create order status history" ON "public"."order_status_history" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['staff'::"text", 'cashier'::"text", 'super_admin'::"text"])::"text"[]))))));

-- Users can read orders for their branch or own orders
CREATE POLICY "Users can read orders for their branch or own orders" ON "public"."orders" FOR SELECT TO "authenticated" USING (("branch_id" IN ( SELECT "users"."branch_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) OR (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."user_id" = "auth"."uid"())))));

-- Users can read order items for accessible orders
CREATE POLICY "Users can read order items for accessible orders" ON "public"."order_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
   JOIN "public"."users" "u" ON "o"."branch_id" = "u"."branch_id"
  WHERE (("o"."id" = "order_items"."order_id") AND ("u"."id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."orders" "o"
   JOIN "public"."customers" "c" ON "o"."customer_id" = "c"."id"
  WHERE (("o"."id" = "order_items"."order_id") AND ("c"."user_id" = "auth"."uid"()))))));

-- Users can read order status history for accessible orders
CREATE POLICY "Users can read order status history for accessible orders" ON "public"."order_status_history" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
   JOIN "public"."users" "u" ON "o"."branch_id" = "u"."branch_id"
  WHERE (("o"."id" = "order_status_history"."order_id") AND ("u"."id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."orders" "o"
   JOIN "public"."customers" "c" ON "o"."customer_id" = "c"."id"
  WHERE (("o"."id" = "order_status_history"."order_id") AND ("c"."user_id" = "auth"."uid"()))))));

-- Users can read prescriptions for accessible customers
CREATE POLICY "Users can read prescriptions for accessible customers" ON "public"."prescriptions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."customers" "c"
  WHERE (("c"."id" = "prescriptions"."customer_id") AND ("c"."user_id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['staff'::"text", 'cashier'::"text", 'super_admin'::"text"])::"text"[]))))));

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant permissions to functions
GRANT ALL ON FUNCTION "public"."generate_customer_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_customer_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_customer_number"() TO "service_role";

GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "service_role";

GRANT ALL ON FUNCTION "public"."set_customer_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_customer_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_customer_number"() TO "service_role";

GRANT ALL ON FUNCTION "public"."set_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_order_number"() TO "service_role";

GRANT ALL ON FUNCTION "public"."log_order_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_order_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_order_status_change"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_order_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_order_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_order_totals"() TO "service_role";

-- Grant table permissions
GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";

GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";

GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";

GRANT ALL ON TABLE "public"."order_status_history" TO "anon";
GRANT ALL ON TABLE "public"."order_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."order_status_history" TO "service_role";

GRANT ALL ON TABLE "public"."prescriptions" TO "anon";
GRANT ALL ON TABLE "public"."prescriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."prescriptions" TO "service_role";
