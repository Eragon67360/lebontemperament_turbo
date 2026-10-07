-- Staging prelude: run first, on a NEW, EMPTY Supabase project only.
--
-- 1. Extensions production uses that a new project lacks (pg_cron for the
--    housekeeping functions, pg_net for the functions that call edge
--    functions). No cron job is scheduled on staging: production's jobs
--    (calendar sync, Drive sync, ops alerts, purge, backup) stay production's.
-- 2. pg_dump writes privileges relative to Postgres' built-in defaults, but a
--    Supabase project's default privileges already grant everything in
--    `public` to anon, authenticated and service_role. Without this revoke,
--    every REVOKE production applied (on functions especially) would be
--    silently lost. 01_schema.sql re-creates the default privileges at its end.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role;
