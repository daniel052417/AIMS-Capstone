-- =====================================================
-- AIMS Database Schema - System Settings Module
-- =====================================================
-- This module contains system configuration and settings
-- Dependencies: 01_core_functions.sql, 02_auth_users.sql

-- =====================================================
-- TABLES
-- =====================================================

-- System settings table
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

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Primary key
ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");

-- Unique constraints
ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_key_key" UNIQUE ("key");

-- Foreign key constraints
ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE TRIGGER "update_system_settings_updated_at" BEFORE UPDATE ON "public"."system_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX "idx_system_settings_is_public" ON "public"."system_settings" USING "btree" ("is_public");
CREATE INDEX "idx_system_settings_key" ON "public"."system_settings" USING "btree" ("key");

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- All authenticated users can read public settings
CREATE POLICY "All authenticated users can read public settings" ON "public"."system_settings" FOR SELECT TO "authenticated" USING (("is_public" = true));

-- Super admins can read all settings
CREATE POLICY "Super admins can read all settings" ON "public"."system_settings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = 'super_admin'::"text")))));

-- Super admins can manage settings
CREATE POLICY "Super admins can manage settings" ON "public"."system_settings" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = 'super_admin'::"text")))));

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant table permissions
GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";
