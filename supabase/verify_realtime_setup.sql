-- ============================================================================
-- Supabase Realtime Verification (single result set)
-- ============================================================================
-- Run in Supabase Dashboard → SQL Editor. One query = one result you'll see.
-- ============================================================================

SELECT
  check_name,
  result,
  CASE WHEN result_ok THEN 'OK' ELSE 'FIX NEEDED' END AS status
FROM (
  SELECT 'rehearsals in realtime pub' AS check_name,
    COALESCE(
      (SELECT string_agg(tablename, ', ') FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND tablename IN ('rehearsals', 'events', 'concerts')),
      'NONE'
    ) AS result,
    EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'rehearsals') AS result_ok
  UNION ALL
  SELECT 'replica identity',
    COALESCE(
      (SELECT CASE relreplident WHEN 'f' THEN 'FULL' WHEN 'd' THEN 'DEFAULT' ELSE relreplident::text END
       FROM pg_class WHERE relname = 'rehearsals' AND relkind = 'r'),
      'table not found'
    ),
    (SELECT relreplident = 'f' FROM pg_class WHERE relname = 'rehearsals' AND relkind = 'r' LIMIT 1)
  UNION ALL
  SELECT 'RLS on rehearsals',
    (SELECT CASE WHEN relrowsecurity THEN 'ON' ELSE 'OFF' END FROM pg_class WHERE relname = 'rehearsals' AND relkind = 'r' LIMIT 1),
    true
  UNION ALL
  SELECT 'has enum column (group_type)',
    (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='rehearsals' AND udt_name='group_type') THEN 'YES - known Realtime bug' ELSE 'NO' END),
    NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='rehearsals' AND udt_name='group_type')
  UNION ALL
  SELECT 'row count',
    (SELECT COUNT(*)::text FROM public.rehearsals),
    true
) t;

-- If "rehearsals in realtime pub" = FIX NEEDED: run migration 20250607000000_enable_...
-- If "replica identity" != FULL: run ALTER TABLE public.rehearsals REPLICA IDENTITY FULL;
-- If "has enum column" = FIX NEEDED: known Supabase Cloud bug, consider converting to varchar
