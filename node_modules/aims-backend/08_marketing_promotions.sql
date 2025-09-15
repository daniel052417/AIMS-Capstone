-- =====================================================
-- AIMS Database Schema - Marketing & Promotions Module
-- =====================================================
-- This module contains marketing campaigns and promotion management
-- Dependencies: 01_core_functions.sql, 02_auth_users.sql, 04_products_inventory.sql

-- =====================================================
-- TABLES
-- =====================================================

-- Campaigns table
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

-- Promotions table
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

-- Promotion products junction table
CREATE TABLE IF NOT EXISTS "public"."promotion_products" (
    "promotion_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "category_id" "uuid",
    CONSTRAINT "chk_product_or_category" CHECK (((("product_id" IS NOT NULL) AND ("category_id" IS NULL)) OR (("product_id" IS NULL) AND ("category_id" IS NOT NULL))))
);

ALTER TABLE "public"."promotion_products" OWNER TO "postgres";

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Primary keys
ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."promotions"
    ADD CONSTRAINT "promotions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."promotion_products"
    ADD CONSTRAINT "promotion_products_pkey" PRIMARY KEY ("promotion_id", "product_id", "category_id");

-- Unique constraints
ALTER TABLE ONLY "public"."promotions"
    ADD CONSTRAINT "promotions_code_key" UNIQUE ("code");

-- Foreign key constraints
ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");

ALTER TABLE ONLY "public"."promotions"
    ADD CONSTRAINT "promotions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."promotion_products"
    ADD CONSTRAINT "promotion_products_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."promotion_products"
    ADD CONSTRAINT "promotion_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."promotion_products"
    ADD CONSTRAINT "promotion_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Apply promotion to an order
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

-- Calculate discount amount for a promotion
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
  
  -- Apply maximum discount limit if set
  IF promotion_record.maximum_discount IS NOT NULL 
     AND discount_amount > promotion_record.maximum_discount THEN
    discount_amount := promotion_record.maximum_discount;
  END IF;
  
  RETURN discount_amount;
END;
$$;

ALTER FUNCTION "public"."calculate_discount"("p_promotion_id" "uuid", "p_amount" numeric, "p_quantity" numeric) OWNER TO "postgres";

-- Check if a promotion is applicable to a product variant
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
  SELECT pv.*, p.category_id INTO product_record
  FROM product_variants pv
  JOIN products p ON pv.product_id = p.id
  WHERE pv.id = p_product_variant_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if applies to specific product
  IF promotion_record.applies_to = 'product' THEN
    RETURN EXISTS (
      SELECT 1 FROM promotion_products pp
      WHERE pp.promotion_id = p_promotion_id
      AND pp.product_id = product_record.product_id
    );
  END IF;
  
  -- Check if applies to specific category
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

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Audit triggers
CREATE OR REPLACE TRIGGER "audit_campaigns_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();

CREATE OR REPLACE TRIGGER "audit_promotions_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."promotions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();

-- =====================================================
-- INDEXES
-- =====================================================

-- Campaigns indexes
CREATE INDEX "idx_campaigns_dates" ON "public"."campaigns" USING "btree" ("start_date", "end_date");
CREATE INDEX "idx_campaigns_status" ON "public"."campaigns" USING "btree" ("status");

-- Promotions indexes
CREATE INDEX "idx_promotions_active" ON "public"."promotions" USING "btree" ("is_active");
CREATE INDEX "idx_promotions_campaign_id" ON "public"."promotions" USING "btree" ("campotion_id");
CREATE INDEX "idx_promotions_code" ON "public"."promotions" USING "btree" ("code");
CREATE INDEX "idx_promotions_dates" ON "public"."promotions" USING "btree" ("start_date", "end_date");

-- Promotion products indexes
CREATE INDEX "idx_promotion_products_category_id" ON "public"."promotion_products" USING "btree" ("category_id");
CREATE INDEX "idx_promotion_products_product_id" ON "public"."promotion_products" USING "btree" ("product_id");
CREATE INDEX "idx_promotion_products_promotion_id" ON "public"."promotion_products" USING "btree" ("promotion_id");

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- All authenticated users can read active campaigns
CREATE POLICY "All authenticated users can read active campaigns" ON "public"."campaigns" FOR SELECT TO "authenticated" USING (((("status")::"text" = 'active'::"text") AND ("start_date" <= CURRENT_DATE) AND ("end_date" >= CURRENT_DATE)));

-- All authenticated users can read active promotions
CREATE POLICY "All authenticated users can read active promotions" ON "public"."promotions" FOR SELECT TO "authenticated" USING ((("is_active" = true) AND ("start_date" <= "now"()) AND ("end_date" >= "now"()) AND (("usage_limit" IS NULL) OR ("usage_count" < "usage_limit"))));

-- All authenticated users can read promotion products
CREATE POLICY "All authenticated users can read promotion products" ON "public"."promotion_products" FOR SELECT TO "authenticated" USING (true);

-- Marketing staff can manage campaigns
CREATE POLICY "Marketing staff can manage campaigns" ON "public"."campaigns" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['marketing_staff'::"text", 'super_admin'::"text"])::"text"[]))))));

-- Marketing staff can manage promotions
CREATE POLICY "Marketing staff can manage promotions" ON "public"."promotions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['marketing_staff'::"text", 'super_admin'::"text"])::"text"[]))))));

-- Marketing staff can manage promotion products
CREATE POLICY "Marketing staff can manage promotion products" ON "public"."promotion_products" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['marketing_staff'::"text", 'super_admin'::"text"])::"text"[]))))));

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant permissions to functions
GRANT ALL ON FUNCTION "public"."apply_promotion_to_order"("p_order_id" "uuid", "p_promotion_code" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."apply_promotion_to_order"("p_order_id" "uuid", "p_promotion_code" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_promotion_to_order"("p_order_id" "uuid", "p_promotion_code" character varying) TO "service_role";

GRANT ALL ON FUNCTION "public"."calculate_discount"("p_promotion_id" "uuid", "p_amount" numeric, "p_quantity" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_discount"("p_promotion_id" "uuid", "p_amount" numeric, "p_quantity" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_discount"("p_promotion_id" "uuid", "p_amount" numeric, "p_quantity" numeric) TO "service_role";

GRANT ALL ON FUNCTION "public"."is_promotion_applicable"("p_promotion_id" "uuid", "p_product_variant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_promotion_applicable"("p_promotion_id" "uuid", "p_product_variant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_promotion_applicable"("p_promotion_id" "uuid", "p_product_variant_id" "uuid") TO "service_role";

-- Grant table permissions
GRANT ALL ON TABLE "public"."campaigns" TO "anon";
GRANT ALL ON TABLE "public"."campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."campaigns" TO "service_role";

GRANT ALL ON TABLE "public"."promotions" TO "anon";
GRANT ALL ON TABLE "public"."promotions" TO "authenticated";
GRANT ALL ON TABLE "public"."promotions" TO "service_role";

GRANT ALL ON TABLE "public"."promotion_products" TO "anon";
GRANT ALL ON TABLE "public"."promotion_products" TO "authenticated";
GRANT ALL ON TABLE "public"."promotion_products" TO "service_role";
