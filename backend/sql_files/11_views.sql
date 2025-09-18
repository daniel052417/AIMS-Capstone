-- =====================================================
-- AIMS Database Schema - Views Module
-- =====================================================
-- This module contains database views for reporting and analytics
-- Dependencies: All other modules

-- =====================================================
-- VIEWS
-- =====================================================

-- Recent activity view
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

-- Role permissions view
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

-- System statistics view
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

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant view permissions
GRANT ALL ON TABLE "public"."recent_activity" TO "anon";
GRANT ALL ON TABLE "public"."recent_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."recent_activity" TO "service_role";

GRANT ALL ON TABLE "public"."role_permissions_view" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions_view" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions_view" TO "service_role";

GRANT ALL ON TABLE "public"."system_stats" TO "anon";
GRANT ALL ON TABLE "public"."system_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."system_stats" TO "service_role";
