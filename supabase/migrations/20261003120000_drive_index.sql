-- Migration: Google Drive index and reviewed sync (F3, part 1)
-- Refs #433
--
-- Drive stays the source of truth for the members' documents; Supabase keeps
-- an index of what the service account sees under the six `drive_folders`
-- roots (IDs and metadata, never file contents). The edge function
-- `sync-drive-index` fills it: a dry run records a diff in `drive_sync_runs`,
-- an apply upserts the nodes and soft-deletes the ones that disappeared,
-- through `drive_index_apply()` in one transaction.
--
-- Additive: nothing existing is changed. Nothing reads these tables until
-- part 2 (website and app), so the migration can be applied before or after
-- the code ships.
--
-- Prerequisites (owner, once; already there if the ETA cron and the push
-- trigger work):
--   select vault.create_secret('https://YOUR_PROJECT.supabase.co', 'project_url');
--   select vault.create_secret('YOUR_ANON_KEY', 'anon_key');
--   select vault.create_secret('<random hex 32>', 'internal_function_secret');
--
-- Rollback:
--   select cron.unschedule('sync-drive-index');
--   drop function public.drive_index_apply(uuid, jsonb, text[], jsonb, jsonb, text, text);
--   drop table public.drive_sync_runs;
--   drop table public.drive_index_nodes;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- The cron job below reads the Vault secrets at run time and silently sends
-- nothing when one is missing (net.http_post gets a null header value and
-- the function answers 401): refuse to apply without them, as
-- 20261002100000_internal_function_secret_and_tracking_rpc.sql does.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'internal_function_secret')
     OR NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'project_url')
     OR NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'anon_key') THEN
    RAISE EXCEPTION 'Create the Vault secrets project_url, anon_key and internal_function_secret before applying this migration';
  END IF;
END;
$$;

-- 1. The index: one row per folder or file seen under a root.
CREATE TABLE IF NOT EXISTS public.drive_index_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id text NOT NULL UNIQUE,
  parent_drive_id text,
  root_slug text NOT NULL REFERENCES public.drive_folders (slug) ON UPDATE CASCADE,
  kind text NOT NULL CHECK (kind IN ('folder', 'file')),
  name text NOT NULL,
  mime_type text,
  size bigint,
  modified_time timestamptz,
  md5_checksum text,
  path text NOT NULL,
  depth integer NOT NULL CHECK (depth >= 0),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  synced_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz
);

CREATE INDEX IF NOT EXISTS drive_index_nodes_root_parent_idx
  ON public.drive_index_nodes (root_slug, parent_drive_id);

COMMENT ON TABLE public.drive_index_nodes IS
  'Index of the Google Drive folders and files under the drive_folders roots, as seen by the service account. Filled by the sync-drive-index edge function; removed_at marks nodes no longer seen (soft delete). Never holds file contents.';
COMMENT ON COLUMN public.drive_index_nodes.path IS
  'Names from the root folder down to this node, joined by " / ".';
COMMENT ON COLUMN public.drive_index_nodes.removed_at IS
  'Set when a sync no longer sees the node under a readable root; cleared when it reappears.';

-- 2. One row per sync run (dry run or apply), with the diff it found.
CREATE TABLE IF NOT EXISTS public.drive_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  mode text NOT NULL CHECK (mode IN ('dry_run', 'apply')),
  trigger text NOT NULL CHECK (trigger IN ('cron', 'admin')),
  triggered_by uuid,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
  counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  diff jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text
);

CREATE INDEX IF NOT EXISTS drive_sync_runs_started_at_idx
  ON public.drive_sync_runs (started_at DESC);

COMMENT ON TABLE public.drive_sync_runs IS
  'Runs of the sync-drive-index edge function. counts: {added, renamed, moved, removed, unchanged, unreadable_roots}; diff: capped lists of names and paths per group (no Drive IDs).';
COMMENT ON COLUMN public.drive_sync_runs.triggered_by IS
  'The admin who started the run (profiles.id); null for the nightly cron.';

-- 3. Row-level security: members read the live index, admins read the runs,
--    nobody writes from a client (the edge function uses the service role).
ALTER TABLE public.drive_index_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read live drive index nodes" ON public.drive_index_nodes;
CREATE POLICY "Authenticated users read live drive index nodes"
  ON public.drive_index_nodes
  FOR SELECT
  TO authenticated
  USING (removed_at IS NULL);

-- Same admin check as the drive_folders update policy
-- (20260914000000_create_drive_folders.sql).
DROP POLICY IF EXISTS "Admins read drive sync runs" ON public.drive_sync_runs;
CREATE POLICY "Admins read drive sync runs"
  ON public.drive_sync_runs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- 4. Atomic apply, called by the edge function with the service role:
--    upserts every node of the walk, soft-deletes the ones no longer seen
--    under a readable root, and closes the run row (p_status / p_error let a
--    cron run that held back a root be recorded as an error), in one
--    transaction. p_nodes: array of {drive_id, parent_drive_id, root_slug,
--    kind, name, mime_type, size, modified_time, md5_checksum, path, depth}.
--    SECURITY INVOKER: only service_role may execute it (grants below) and
--    service_role already bypasses RLS, so definer rights would add nothing.
CREATE OR REPLACE FUNCTION public.drive_index_apply(
  p_run_id uuid,
  p_nodes jsonb,
  p_remove_ids text[],
  p_counts jsonb,
  p_diff jsonb,
  p_status text DEFAULT 'success',
  p_error text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_upserted integer := 0;
  v_removed integer := 0;
  v_now timestamptz := now();
BEGIN
  INSERT INTO public.drive_index_nodes (
    drive_id, parent_drive_id, root_slug, kind, name, mime_type, size,
    modified_time, md5_checksum, path, depth, first_seen_at, synced_at, removed_at
  )
  SELECT
    n->>'drive_id',
    n->>'parent_drive_id',
    n->>'root_slug',
    n->>'kind',
    n->>'name',
    n->>'mime_type',
    (n->>'size')::bigint,
    (n->>'modified_time')::timestamptz,
    n->>'md5_checksum',
    n->>'path',
    (n->>'depth')::integer,
    v_now,
    v_now,
    NULL
  FROM jsonb_array_elements(COALESCE(p_nodes, '[]'::jsonb)) AS n
  ON CONFLICT (drive_id) DO UPDATE SET
    parent_drive_id = EXCLUDED.parent_drive_id,
    root_slug = EXCLUDED.root_slug,
    kind = EXCLUDED.kind,
    name = EXCLUDED.name,
    mime_type = EXCLUDED.mime_type,
    size = EXCLUDED.size,
    modified_time = EXCLUDED.modified_time,
    md5_checksum = EXCLUDED.md5_checksum,
    path = EXCLUDED.path,
    depth = EXCLUDED.depth,
    synced_at = EXCLUDED.synced_at,
    removed_at = NULL;

  GET DIAGNOSTICS v_upserted = ROW_COUNT;

  IF p_remove_ids IS NOT NULL AND array_length(p_remove_ids, 1) > 0 THEN
    UPDATE public.drive_index_nodes
    SET removed_at = v_now, synced_at = v_now
    WHERE drive_id = ANY (p_remove_ids)
      AND removed_at IS NULL;

    GET DIAGNOSTICS v_removed = ROW_COUNT;
  END IF;

  IF p_status NOT IN ('success', 'error') THEN
    RAISE EXCEPTION 'drive_index_apply: p_status must be success or error';
  END IF;

  UPDATE public.drive_sync_runs
  SET finished_at = v_now,
      status = p_status,
      counts = COALESCE(p_counts, '{}'::jsonb),
      diff = COALESCE(p_diff, '{}'::jsonb),
      error = p_error
  WHERE id = p_run_id;

  RETURN jsonb_build_object('upserted', v_upserted, 'removed', v_removed);
END;
$$;

-- Supabase's default privileges grant EXECUTE on new public functions to
-- anon and authenticated explicitly; revoking from PUBLIC alone leaves them.
REVOKE ALL ON FUNCTION public.drive_index_apply(uuid, jsonb, text[], jsonb, jsonb, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.drive_index_apply(uuid, jsonb, text[], jsonb, jsonb, text, text)
  TO service_role;

-- 5. Nightly apply at 03:30 Europe/Paris.
--    The database clock is UTC: 03:30 Paris is 01:30 UTC in summer (CEST)
--    and 02:30 UTC in winter (CET). As the other jobs do, the cron expression
--    fires at :30 every hour and the body keeps only the Paris hour 3, so
--    Postgres' timezone rules handle the DST change.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-drive-index') THEN
    PERFORM cron.unschedule('sync-drive-index');
  END IF;
END;
$$;

SELECT cron.schedule(
  'sync-drive-index',
  '30 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/sync-drive-index',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key'),
      'x-internal-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'internal_function_secret')
    ),
    body := '{"mode": "apply"}'::jsonb,
    timeout_milliseconds := 120000
  ) AS request_id
  FROM (SELECT 1) AS _guard
  WHERE EXTRACT(HOUR FROM now() AT TIME ZONE 'Europe/Paris')::int = 3;
  $$
);
