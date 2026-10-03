-- rehearsals_sync_write() is SECURITY DEFINER and writes rehearsals. Its
-- migration revoked EXECUTE from PUBLIC only, but Supabase's default
-- privileges grant EXECUTE on new functions in `public` explicitly to `anon`
-- and `authenticated`, and revoking from PUBLIC doesn't remove those grants.
-- So anyone holding the public anon key could call it through PostgREST.
-- Only the calendar-sync Edge Function (service role) may call it.

REVOKE ALL ON FUNCTION public.rehearsals_sync_write(jsonb, uuid[], boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rehearsals_sync_write(jsonb, uuid[], boolean)
  TO service_role;
