-- =====================================================
-- AIMS Database Schema - Core Functions Module
-- =====================================================
-- This module contains core utility functions used across multiple modules
-- Run this module first before other modules

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE SCHEMA IF NOT EXISTS "public";
ALTER SCHEMA "public" OWNER TO "pg_database_owner";
COMMENT ON SCHEMA "public" IS 'standard public schema';

-- =====================================================
-- AUDIT TRIGGER FUNCTION
-- =====================================================
-- Core function used by all audit triggers across the system
CREATE OR REPLACE FUNCTION "public"."audit_trigger_function"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  old_data jsonb;
  new_data jsonb;
  audit_action varchar(20);
BEGIN
  -- Determine action type
  IF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    new_data := NULL;
    audit_action := 'delete';
  ELSIF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    audit_action := 'update';
  ELSIF TG_OP = 'INSERT' THEN
    old_data := NULL;
    new_data := to_jsonb(NEW);
    audit_action := 'insert';
  END IF;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    user_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    audit_action,
    old_data,
    new_data,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

ALTER FUNCTION "public"."audit_trigger_function"() OWNER TO "postgres";

-- =====================================================
-- UPDATE TIMESTAMP FUNCTION
-- =====================================================
-- Generic function to update the updated_at column
CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

-- =====================================================
-- SYSTEM SETTINGS FUNCTIONS
-- =====================================================
-- Get system setting value
CREATE OR REPLACE FUNCTION "public"."get_system_setting"("setting_key" character varying) RETURNS "jsonb"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT value
  FROM system_settings
  WHERE key = setting_key;
$$;

ALTER FUNCTION "public"."get_system_setting"("setting_key" character varying) OWNER TO "postgres";

-- Set system setting value
CREATE OR REPLACE FUNCTION "public"."set_system_setting"("setting_key" character varying, "setting_value" "jsonb", "setting_description" "text" DEFAULT NULL::"text", "is_public_setting" boolean DEFAULT false) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO system_settings (key, value, description, is_public, updated_by)
  VALUES (setting_key, setting_value, setting_description, is_public_setting, auth.uid())
  ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = COALESCE(EXCLUDED.description, system_settings.description),
    is_public = EXCLUDED.is_public,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();
END;
$$;

ALTER FUNCTION "public"."set_system_setting"("setting_key" character varying, "setting_value" "jsonb", "setting_description" "text", "is_public_setting" boolean) OWNER TO "postgres";

-- =====================================================
-- AUDIT LOGGING FUNCTIONS
-- =====================================================
-- Cleanup old audit logs based on retention policy
CREATE OR REPLACE FUNCTION "public"."cleanup_old_audit_logs"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  retention_days integer;
BEGIN
  -- Get retention setting
  SELECT (value::text)::integer INTO retention_days
  FROM system_settings
  WHERE key = 'audit_retention_days';
  
  -- Default to 365 days if setting not found
  retention_days := COALESCE(retention_days, 365);
  
  -- Delete old audit logs
  DELETE FROM audit_logs
  WHERE created_at < (now() - (retention_days || ' days')::interval);
END;
$$;

ALTER FUNCTION "public"."cleanup_old_audit_logs"() OWNER TO "postgres";

-- Get table change statistics
CREATE OR REPLACE FUNCTION "public"."get_table_change_stats"("p_table_name" character varying, "p_days" integer DEFAULT 30) RETURNS TABLE("action" character varying, "count" bigint, "unique_users" bigint, "last_change" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT 
    al.action,
    COUNT(*) as count,
    COUNT(DISTINCT al.user_id) as unique_users,
    MAX(al.created_at) as last_change
  FROM audit_logs al
  WHERE al.table_name = p_table_name
  AND al.created_at >= (now() - (p_days || ' days')::interval)
  GROUP BY al.action
  ORDER BY count DESC;
$$;

ALTER FUNCTION "public"."get_table_change_stats"("p_table_name" character varying, "p_days" integer) OWNER TO "postgres";

-- Get user activity summary
CREATE OR REPLACE FUNCTION "public"."get_user_activity_summary"("p_user_id" "uuid", "p_days" integer DEFAULT 30) RETURNS TABLE("action" character varying, "table_name" character varying, "count" bigint, "last_activity" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT 
    al.action,
    al.table_name,
    COUNT(*) as count,
    MAX(al.created_at) as last_activity
  FROM audit_logs al
  WHERE al.user_id = p_user_id
  AND al.created_at >= (now() - (p_days || ' days')::interval)
  GROUP BY al.action, al.table_name
  ORDER BY count DESC, last_activity DESC;
$$;

ALTER FUNCTION "public"."get_user_activity_summary"("p_user_id" "uuid", "p_days" integer) OWNER TO "postgres";
