-- =====================================================
-- AIMS Database Schema - Authentication & Users Module
-- =====================================================
-- This module contains user management, roles, and permissions
-- Dependencies: 01_core_functions.sql

-- =====================================================
-- TABLES
-- =====================================================

-- Users table
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

-- Permissions table
CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "resource" character varying(50) NOT NULL,
    "action" character varying(50) NOT NULL,
    "description" "text"
);

ALTER TABLE "public"."permissions" OWNER TO "postgres";

-- Roles table
CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "description" "text",
    "is_system_role" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."roles" OWNER TO "postgres";

-- User roles junction table
CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."user_roles" OWNER TO "postgres";

-- Role permissions junction table
CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "role_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."role_permissions" OWNER TO "postgres";

-- Role permission audit table
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

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Primary keys
ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."role_permission_audit"
    ADD CONSTRAINT "role_permission_audit_pkey" PRIMARY KEY ("id");

-- Unique constraints
ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");

ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id");

ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");

-- Foreign key constraints
ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."role_permission_audit"
    ADD CONSTRAINT "role_permission_audit_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id");

ALTER TABLE ONLY "public"."role_permission_audit"
    ADD CONSTRAINT "role_permission_audit_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id");

ALTER TABLE ONLY "public"."role_permission_audit"
    ADD CONSTRAINT "role_permission_audit_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id");

ALTER TABLE ONLY "public"."role_permission_audit"
    ADD CONSTRAINT "role_permission_audit_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id");

ALTER TABLE ONLY "public"."role_permission_audit"
    ADD CONSTRAINT "role_permission_audit_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id");

ALTER TABLE ONLY "public"."role_permission_audit"
    ADD CONSTRAINT "role_permission_audit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Get user permissions
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

-- Get user role permissions with details
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

-- Get users by role
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

-- Check if user has permission
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

-- Check if user has role
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

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Audit trigger for users table
CREATE OR REPLACE TRIGGER "audit_users_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_function"();

-- Update timestamp trigger for users table
CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX "idx_users_branch_id" ON "public"."users" USING "btree" ("branch_id");

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Users can read own data
CREATE POLICY "Users can read own data" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));

-- Users can read own roles
CREATE POLICY "Users can read own roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));

-- HR admins can manage users
CREATE POLICY "HR admins can manage users" ON "public"."users" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = 'hr_admin'::"text")))));

-- Admins can manage user roles
CREATE POLICY "Admins can manage user roles" ON "public"."user_roles" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = ANY ((ARRAY['super_admin'::"text", 'hr_admin'::"text"])::"text"[]))))));

-- All authenticated users can read permissions
CREATE POLICY "All authenticated users can read permissions" ON "public"."permissions" FOR SELECT TO "authenticated" USING (true);

-- All authenticated users can read roles
CREATE POLICY "All authenticated users can read roles" ON "public"."roles" FOR SELECT TO "authenticated" USING (true);

-- All authenticated users can read role permissions
CREATE POLICY "All authenticated users can read role permissions" ON "public"."role_permissions" FOR SELECT TO "authenticated" USING (true);

-- Only super admins can manage permissions
CREATE POLICY "Only super admins can manage permissions" ON "public"."permissions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = 'super_admin'::"text")))));

-- Only super admins can manage roles
CREATE POLICY "Only super admins can manage roles" ON "public"."roles" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = 'super_admin'::"text")))));

-- Only super admins can manage role permissions
CREATE POLICY "Only super admins can manage role permissions" ON "public"."role_permissions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = 'super_admin'::"text")))));

-- Super admins can read all users
CREATE POLICY "Super admins can read all users" ON "public"."users" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = 'super_admin'::"text")))));

-- Super admins can read role permission audit
CREATE POLICY "Super admins can read role permission audit" ON "public"."role_permission_audit" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
   JOIN "public"."user_roles" "ur" ON "u"."id" = "ur"."user_id"
   JOIN "public"."roles" "r" ON "ur"."role_id" = "r"."id"
  WHERE (("u"."id" = "auth"."uid"()) AND ("r"."name" = 'super_admin'::"text")))));

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant permissions to functions
GRANT ALL ON FUNCTION "public"."get_user_permissions"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("user_uuid" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_user_role_permissions"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role_permissions"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role_permissions"("user_uuid" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_users_by_role"("role_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_users_by_role"("role_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_users_by_role"("role_name" character varying) TO "service_role";

GRANT ALL ON FUNCTION "public"."user_has_permission"("user_uuid" "uuid", "permission_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_permission"("user_uuid" "uuid", "permission_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_permission"("user_uuid" "uuid", "permission_name" character varying) TO "service_role";

GRANT ALL ON FUNCTION "public"."user_has_role"("user_uuid" "uuid", "role_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_role"("user_uuid" "uuid", "role_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_role"("user_uuid" "uuid", "role_name" character varying) TO "service_role";

-- Grant table permissions
GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";

GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";

GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";

GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";

GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";

GRANT ALL ON TABLE "public"."role_permission_audit" TO "anon";
GRANT ALL ON TABLE "public"."role_permission_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permission_audit" TO "service_role";
