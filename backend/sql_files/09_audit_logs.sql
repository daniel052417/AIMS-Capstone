-- =====================================================
-- AIMS Database Schema - Audit Logs Module
-- =====================================================
-- This module contains audit logging functionality
-- Dependencies: 01_core_functions.sql, 02_auth_users.sql

-- =====================================================
-- TABLES
-- =====================================================

-- Audit logs table
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

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Primary key
ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");

-- Foreign key constraints
ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs" USING "btree" ("action");
CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at");
CREATE INDEX "idx_audit_logs_table_record" ON "public"."audit_logs" USING "btree" ("table_name", "record_id");
CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Super admins can read all audit logs
CREATE POLICY "Super admins can read all audit logs" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = 'super_admin'::"text")))));

-- Users can read their own audit logs
CREATE POLICY "Users can read their own audit logs" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant table permissions
GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";
