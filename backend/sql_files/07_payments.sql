-- =====================================================
-- AIMS Database Schema - Payments Module
-- =====================================================
-- This module contains payment processing and payment methods
-- Dependencies: 01_core_functions.sql, 02_auth_users.sql, 06_customers_orders.sql

-- =====================================================
-- TABLES
-- =====================================================

-- Payment methods table
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

-- Payments table
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

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Primary keys
ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");

-- Unique constraints
ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_name_key" UNIQUE ("name");

-- Foreign key constraints
ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id");

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id");

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Calculate processing fee for payments
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

-- Process a payment
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
    'completed',
    p_notes,
    auth.uid()
  ) RETURNING id INTO payment_id;
  
  RETURN payment_id;
END;
$$;

ALTER FUNCTION "public"."process_payment"("p_order_id" "uuid", "p_payment_method_id" "uuid", "p_amount" numeric, "p_reference_number" character varying, "p_notes" "text") OWNER TO "postgres";

-- Refund a payment
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
    p_notes,
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

-- Update order payment status when payments change
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

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Audit triggers
CREATE OR REPLACE TRIGGER "audit_payments_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();

-- Payment processing triggers
CREATE OR REPLACE TRIGGER "calculate_processing_fee_trigger" BEFORE INSERT OR UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_processing_fee"();

CREATE OR REPLACE TRIGGER "update_order_payment_status_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_order_payment_status"();

-- =====================================================
-- INDEXES
-- =====================================================

-- Payment methods indexes
CREATE INDEX "idx_payment_methods_is_active" ON "public"."payment_methods" USING "btree" ("is_active");
CREATE INDEX "idx_payment_methods_type" ON "public"."payment_methods" USING "btree" ("type");

-- Payments indexes
CREATE INDEX "idx_payments_order_id" ON "public"."payments" USING "btree" ("order_id");
CREATE INDEX "idx_payments_payment_date" ON "public"."payments" USING "btree" ("payment_date");
CREATE INDEX "idx_payments_payment_method_id" ON "public"."payments" USING "btree" ("payment_method_id");
CREATE INDEX "idx_payments_processed_by" ON "public"."payments" USING "btree" ("processed_by");
CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("status");

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- All authenticated users can read active payment methods
CREATE POLICY "All authenticated users can read active payment methods" ON "public"."payment_methods" FOR SELECT TO "authenticated" USING (("is_active" = true));

-- Cashiers can manage payments
CREATE POLICY "Cashiers can manage payments" ON "public"."payments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['cashier'::"text", 'super_admin'::"text"])::"text"[]))))));

-- Users can read payments for accessible orders
CREATE POLICY "Users can read payments for accessible orders" ON "public"."payments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
   JOIN "public"."users" "u" ON "o"."branch_id" = "u"."branch_id"
  WHERE (("o"."id" = "payments"."order_id") AND ("u"."id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."orders" "o"
   JOIN "public"."customers" "c" ON "o"."customer_id" = "c"."id"
  WHERE (("o"."id" = "payments"."order_id") AND ("c"."user_id" = "auth"."uid"()))))));

-- Super admins can manage payment methods
CREATE POLICY "Super admins can manage payment methods" ON "public"."payment_methods" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = 'super_admin'::"text")))));

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant permissions to functions
GRANT ALL ON FUNCTION "public"."calculate_processing_fee"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_processing_fee"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_processing_fee"() TO "service_role";

GRANT ALL ON FUNCTION "public"."process_payment"("p_order_id" "uuid", "p_payment_method_id" "uuid", "p_amount" numeric, "p_reference_number" character varying, "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_payment"("p_order_id" "uuid", "p_payment_method_id" "uuid", "p_amount" numeric, "p_reference_number" character varying, "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_payment"("p_order_id" "uuid", "p_payment_method_id" "uuid", "p_amount" numeric, "p_reference_number" character varying, "p_notes" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."refund_payment"("p_payment_id" "uuid", "p_refund_amount" numeric, "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."refund_payment"("p_payment_id" "uuid", "p_refund_amount" numeric, "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."refund_payment"("p_payment_id" "uuid", "p_refund_amount" numeric, "p_notes" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."update_order_payment_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_order_payment_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_order_payment_status"() TO "service_role";

-- Grant table permissions
GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";

GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";
