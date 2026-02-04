-- ============================================================================
-- Enable Supabase Realtime for rehearsals, events, concerts
-- ============================================================================
-- Required for the Flutter app to receive real-time INSERT/UPDATE/DELETE events.
--
-- Prerequisites:
-- 1. Tables must exist (rehearsals, events, concerts)
-- 2. If RLS is enabled, authenticated users must have SELECT permission
--
-- This migration is idempotent: safe to run multiple times.
-- ============================================================================

-- Rehearsals
ALTER TABLE public.rehearsals REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'rehearsals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rehearsals;
  END IF;
END $$;

-- Events (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
    EXECUTE 'ALTER TABLE public.events REPLICA IDENTITY FULL';
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'events'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
    END IF;
  END IF;
END $$;

-- Concerts (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'concerts') THEN
    EXECUTE 'ALTER TABLE public.concerts REPLICA IDENTITY FULL';
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'concerts'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.concerts;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION: Run supabase/verify_realtime_setup.sql in Supabase SQL Editor
--
-- KNOWN ISSUE: Tables with enum columns (e.g. group_type on rehearsals) may
-- not receive Realtime events on Supabase Cloud. Workaround: convert enum
-- to varchar, or track via GitHub: https://github.com/supabase/supabase/issues/30632
-- ============================================================================
