-- 081: Restore service_role privileges across the public schema.
-- Discovered 2026-04-26: every table except wa_* (created later with proper
-- defaults) had zero grants for the service_role PostgreSQL role, so every
-- API route using createServiceClient() was hitting 42501 permission denied.
-- Standard Supabase setup grants service_role ALL by default; whatever wiped
-- those defaults at the project level needs to be repaired here.

-- Existing objects
GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES  IN SCHEMA public TO service_role;

-- Same for anon + authenticated for completeness (they already have grants on
-- most tables, but doing this defensively to make the schema state consistent).
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Future objects created in public — re-apply the Supabase default privileges.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES  TO service_role;
