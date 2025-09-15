-- =====================================================
-- AIMS Database Schema - Branches Module
-- =====================================================
-- This module contains branch management and operating hours
-- Dependencies: 01_core_functions.sql, 02_auth_users.sql

-- =====================================================
-- TABLES
-- =====================================================

-- Branch operating hours table
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

-- Branches table
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

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Primary keys
ALTER TABLE ONLY "public"."branch_operating_hours"
    ADD CONSTRAINT "branch_operating_hours_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_pkey" PRIMARY KEY ("id");

-- Unique constraints
ALTER TABLE ONLY "public"."branch_operating_hours"
    ADD CONSTRAINT "branch_operating_hours_branch_id_day_of_week_key" UNIQUE ("branch_id", "day_of_week");

ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_code_key" UNIQUE ("code");

-- Foreign key constraints
ALTER TABLE ONLY "public"."branch_operating_hours"
    ADD CONSTRAINT "branch_operating_hours_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE CASCADE;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Get branches that are currently open
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

-- Check if a specific branch is currently open
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

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Audit trigger for branches table
CREATE OR REPLACE TRIGGER "audit_branches_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."branches" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX "idx_branches_code" ON "public"."branches" USING "btree" ("code");
CREATE INDEX "idx_branches_is_active" ON "public"."branches" USING "btree" ("is_active");

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- All authenticated users can read active branches
CREATE POLICY "All authenticated users can read active branches" ON "public"."branches" FOR SELECT TO "authenticated" USING (("is_active" = true));

-- All authenticated users can read branch operating hours
CREATE POLICY "All authenticated users can read branch operating hours" ON "public"."branch_operating_hours" FOR SELECT TO "authenticated" USING (true);

-- HR admins can manage branches
CREATE POLICY "HR admins can manage branches" ON "public"."branches" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = 'hr_admin'::"text")))));

-- Admins can manage branch operating hours
CREATE POLICY "Admins can manage branch operating hours" ON "public"."branch_operating_hours" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['super_admin'::"text", 'hr_admin'::"text"])::"text"[]))))));

-- Super admins can manage all branches
CREATE POLICY "Super admins can manage all branches" ON "public"."branches" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = 'super_admin'::"text")))));

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant permissions to functions
GRANT ALL ON FUNCTION "public"."get_branches_open_now"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_branches_open_now"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_branches_open_now"() TO "service_role";

GRANT ALL ON FUNCTION "public"."is_branch_open_now"("p_branch_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_branch_open_now"("p_branch_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_branch_open_now"("p_branch_id" "uuid") TO "service_role";

-- Grant table permissions
GRANT ALL ON TABLE "public"."branches" TO "anon";
GRANT ALL ON TABLE "public"."branches" TO "authenticated";
GRANT ALL ON TABLE "public"."branches" TO "service_role";

GRANT ALL ON TABLE "public"."branch_operating_hours" TO "anon";
GRANT ALL ON TABLE "public"."branch_operating_hours" TO "authenticated";
GRANT ALL ON TABLE "public"."branch_operating_hours" TO "service_role";
