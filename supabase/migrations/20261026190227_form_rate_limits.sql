-- Audit 2026-10-26 (SEC-010): rate limits for the public forms, and a cap on
-- the pushes that bug reports send.
--
-- Before:
--   - no rate-limit table or function: /api/contact, /api/subscribe and
--     /api/anniversary/submit-memory send their e-mails for every request
--     that passes the honeypot and timing checks;
--   - notify_bug_report_push() as in
--     20261008223000_edge_function_key_headers.sql (section 2b): every new
--     report and every new message calls notify-bug-report.
--
-- After:
--   1. public.rate_limit_events: one row per counted event (a form sent, a
--      bug-report push), keyed by a scope and a SHA-256 hash (of an IP
--      address, an e-mail address or a member's id): the table never holds
--      the address or the id itself, and a CHECK refuses anything that is
--      not a hash. RLS on with no policy, nothing granted to anon or
--      authenticated: only the function below reads and writes it.
--   2. public.rate_limit_allow(scope, key_hash, max, window_seconds): counts
--      the key's events in the window. At the limit it records nothing and
--      returns false; otherwise it records one event and returns true. Calls
--      for the same key run one after the other (advisory lock), so requests
--      sent at the same moment can't all pass. Each call also deletes events
--      older than a day (no window is longer). EXECUTE for service_role
--      only: the website calls it with the service-role key before the three
--      forms send anything (apps/website/lib/formRateLimit.ts).
--   3. notify_bug_report_push(): the body of 20261008223000, plus a cap: the
--      reports and messages of anyone but a superadmin push at most 10 times
--      an hour (counted with rate_limit_allow, scope bug-report-push). Past
--      the cap, the report or message is saved as before and no push is
--      sent. Superadmins' answers are not capped. If the count fails, the
--      push is sent (a WARNING is logged). Same signature; the two triggers
--      are unchanged.
--
-- Order: none. The website works with or without this migration: when the
-- function is missing or the call fails, the form is allowed (fail-open)
-- and the server logs a warning. Safe to run twice.
--
-- Check after applying (expected: false, false, true, false):
--   select has_function_privilege('anon', 'public.rate_limit_allow(text, text, integer, integer)', 'EXECUTE'),
--          has_function_privilege('authenticated', 'public.rate_limit_allow(text, text, integer, integer)', 'EXECUTE'),
--          has_function_privilege('service_role', 'public.rate_limit_allow(text, text, integer, integer)', 'EXECUTE'),
--          has_table_privilege('authenticated', 'public.rate_limit_events', 'SELECT');
--
-- Rollback, in this order (the trigger function calls rate_limit_allow, so
-- restore it first): re-run notify_bug_report_push() from
-- 20261008223000_edge_function_key_headers.sql (section 2b), then
--   DROP FUNCTION public.rate_limit_allow(text, text, integer, integer);
--   DROP TABLE public.rate_limit_events;
-- The website then allows every form again (fail-open); no deploy needed.

begin;

-- 1. Counted events.
create table if not exists public.rate_limit_events (
  id bigint generated always as identity primary key,
  scope text not null
    constraint rate_limit_events_scope_format check (scope ~ '^[a-z0-9:_-]{1,64}$'),
  key_hash text not null
    constraint rate_limit_events_key_is_sha256 check (key_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_scope_key_created_idx
  on public.rate_limit_events (scope, key_hash, created_at);
create index if not exists rate_limit_events_created_idx
  on public.rate_limit_events (created_at);

alter table public.rate_limit_events enable row level security;
revoke all on table public.rate_limit_events from public, anon, authenticated;
revoke all on sequence public.rate_limit_events_id_seq from public, anon, authenticated;

comment on table public.rate_limit_events is
  'Events counted by rate_limit_allow(): public forms sent (per IP address and per recipient) and bug-report pushes (per author). key_hash is a SHA-256 hash, never the address or id itself. Rows older than a day are deleted by rate_limit_allow(). No policy: only that function reads and writes.';

-- 2. The limiter.
create or replace function public.rate_limit_allow(
  p_scope text,
  p_key_hash text,
  p_max integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  _recent integer;
begin
  if p_scope is null or p_scope !~ '^[a-z0-9:_-]{1,64}$'
     or p_key_hash is null or p_key_hash !~ '^[0-9a-f]{64}$'
     or p_max is null or p_max < 1
     or p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'rate_limit_allow: invalid arguments' using errcode = '22023';
  end if;

  -- One call at a time per key, so simultaneous requests can't all pass.
  perform pg_advisory_xact_lock(
    hashtext('rate_limit_events'),
    hashtext(p_scope || ':' || p_key_hash)
  );

  -- Events older than a day never count: delete them (in batches, skipping
  -- rows another call is deleting at the same moment).
  delete from public.rate_limit_events
   where id in (
     select id from public.rate_limit_events
      where created_at < now() - interval '1 day'
      limit 1000
      for update skip locked
   );

  select count(*) into _recent
    from public.rate_limit_events
   where scope = p_scope
     and key_hash = p_key_hash
     and created_at > now() - make_interval(secs => p_window_seconds);

  if _recent >= p_max then
    return false;
  end if;

  insert into public.rate_limit_events (scope, key_hash) values (p_scope, p_key_hash);
  return true;
end;
$$;

revoke all on function public.rate_limit_allow(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_allow(text, text, integer, integer) to service_role;

comment on function public.rate_limit_allow(text, text, integer, integer) is
  'True, and the event is recorded, when the key has fewer than p_max events in the last p_window_seconds (at most a day); false, and nothing is recorded, otherwise. Called by the website with the service-role key (public forms) and by notify_bug_report_push().';

-- 3. Bug-report push: the body of 20261008223000, plus the hourly cap.
CREATE OR REPLACE FUNCTION public.notify_bug_report_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _url text;
  _key text;
  _secret text;
  _author uuid;
  _allowed boolean;
BEGIN
  IF current_setting('app.silence_push', true) = 'true' THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO _url FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO _key FROM vault.decrypted_secrets WHERE name = 'anon_key';
  SELECT decrypted_secret INTO _secret FROM vault.decrypted_secrets WHERE name = 'internal_function_secret';
  IF _url IS NULL OR _key IS NULL OR _secret IS NULL THEN
    RETURN NEW;
  END IF;

  -- At most 10 pushes an hour for the reports and messages of anyone but a
  -- superadmin. Past that, the row is saved and no push is sent. If the
  -- count fails, the push is sent.
  IF TG_TABLE_NAME = 'bug_reports' THEN
    _author := NEW.reported_by;
  ELSE
    _author := NEW.sender_id;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _author AND role = 'superadmin'
  ) THEN
    BEGIN
      _allowed := public.rate_limit_allow(
        'bug-report-push',
        encode(sha256(convert_to(_author::text, 'UTF8')), 'hex'),
        10,
        3600
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_bug_report_push: push cap unavailable (%), push sent', SQLERRM;
      _allowed := true;
    END;
    IF NOT _allowed THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Only ids: the function reads the rows itself.
  PERFORM net.http_post(
    url := _url || '/functions/v1/notify-bug-report',
    headers := public.edge_function_auth_headers() || jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', _secret
    ),
    body := jsonb_build_object(
      'kind', CASE TG_TABLE_NAME WHEN 'bug_reports' THEN 'report' ELSE 'message' END,
      'id', NEW.id
    ),
    timeout_milliseconds := 15000
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_bug_report_push() FROM PUBLIC, anon, authenticated;

-- Checks: the table and the limiter stay out of reach of anon and authenticated.
do $$
begin
  if has_function_privilege('anon', 'public.rate_limit_allow(text, text, integer, integer)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.rate_limit_allow(text, text, integer, integer)', 'EXECUTE')
     or has_table_privilege('anon', 'public.rate_limit_events', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
     or has_table_privilege('authenticated', 'public.rate_limit_events', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') then
    raise exception 'rate_limit_events and rate_limit_allow() must not be reachable by anon or authenticated';
  end if;
  if not has_function_privilege('service_role', 'public.rate_limit_allow(text, text, integer, integer)', 'EXECUTE') then
    raise exception 'service_role must be able to execute rate_limit_allow()';
  end if;
end;
$$;

commit;
