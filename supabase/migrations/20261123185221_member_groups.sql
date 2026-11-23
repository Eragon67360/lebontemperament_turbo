-- Member groups (Thomas, 2026-11-23, concept « Groupes : CA et commissions »,
-- variant A): the CA, each commission or any other group of members is a row
-- managed from the admin, not a migration. An event can be reserved for one
-- or more groups: only their members (and the admins) see it, and only their
-- members' phones are notified.
--
-- 1. member_groups: a group (name, kind, a sentence, tint, icon, visibility,
--    archived instead of deleted). The CA is created here as the first group.
-- 2. member_group_members: who is in which group (role member | manager,
--    optional title such as « Présidente »). A member can be in several
--    groups; deleting a profile removes their memberships.
-- 3. event_audiences: who an event is for. No row = every member, as before.
--    One or more rows = only the members of those groups, plus the admins.
--    A group used by an event can't be deleted (archive it instead), so an
--    event never silently becomes visible to everyone.
-- 4. is_in_group(), can_see_event(): the rules, SECURITY DEFINER with an
--    empty search_path like the other helpers.
-- 5. RLS: signed-in users read the events can_see_event() allows (was: every
--    event). Visitors still read public events only; event_documents follows
--    automatically, its policy reads public.events under the reader's RLS.
--    member_groups: open groups (« members ») to every member, private ones to
--    their members, all to admins. member_group_members: your own rows, the
--    lists of your groups and of open groups, all for admins. event_audiences:
--    with the event. No write policy: the admin writes with the service role.
-- 6. A group event can't be public (checked on both tables).
-- 7. save_event_with_audience(): the admin's one write for an event and its
--    audience, in one transaction, so the push (sent by pg_net after commit)
--    always finds the audience. service_role only.
-- 8. notify_push_notification(): events now carry `audience` (the group ids
--    at trigger time) in the body, and the events trigger fires BEFORE DELETE
--    (instead of after) so a deleted event's audience is still there to read:
--    its rows cascade with the event. send-push-notification sends an event
--    that has an audience to the group members' devices only (push_devices)
--    and never to the `members` / `all_users` topics.
--
-- What members notice: an event reserved for a group disappears for the
-- others (the goal). Nothing changes for existing events (no audience).
-- The shipped app (3.0.0) reads events with the member's session, so RLS
-- already hides group events from the others; no app change is needed.
--
-- Order: apply before (or with) the admin code of the same pull request; the
-- function deploy of send-push-notification can come before or after (an old
-- function ignores `audience`, but would send a group event to every member,
-- so deploy it before creating the first group event).
--
-- Rollback (emergency only; group events become visible to every member):
--   DROP TRIGGER IF EXISTS events_push_notification_delete ON public.events;
--   DROP TRIGGER IF EXISTS events_push_notification ON public.events;
--   CREATE TRIGGER events_push_notification AFTER INSERT OR DELETE OR UPDATE
--     ON public.events FOR EACH ROW EXECUTE FUNCTION public.notify_push_notification();
--   re-run notify_push_notification() from 20261011190000_push_old_record.sql;
--   DROP POLICY IF EXISTS "Events: signed-in users read the events they may see" ON public.events;
--   CREATE POLICY "Events: signed-in users read all events" ON public.events
--     FOR SELECT TO authenticated USING (true);
--   DROP TRIGGER IF EXISTS events_group_events_not_public ON public.events;
--   DROP FUNCTION IF EXISTS public.save_event_with_audience(jsonb, uuid[], uuid);
--   DROP TABLE IF EXISTS public.event_audiences, public.member_group_members,
--     public.member_groups;
--   DROP FUNCTION IF EXISTS public.can_see_event(uuid);
--   DROP FUNCTION IF EXISTS public.is_in_group(uuid);
--   DROP FUNCTION IF EXISTS public.event_audience_not_public();
--   DROP FUNCTION IF EXISTS public.event_not_public_with_audience();

BEGIN;

-- 1. Groups ----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.member_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 80),
  slug text NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 60),
  kind text NOT NULL DEFAULT 'autre'
    CHECK (kind IN ('instance', 'commission', 'ensemble', 'autre')),
  description text CHECK (description IS NULL OR length(description) <= 300),
  color text NOT NULL DEFAULT 'teal'
    CHECK (color IN ('teal', 'blue', 'green', 'gold', 'slate')),
  icon text NOT NULL DEFAULT 'users' CHECK (icon ~ '^[a-z0-9-]{1,40}$'),
  visibility text NOT NULL DEFAULT 'members'
    CHECK (visibility IN ('private', 'members')),
  is_system boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.member_groups IS
  'Groups of members managed in the admin (« Groupes »): the CA, commissions… An event can be reserved for groups (event_audiences). Archived, never deleted once used.';

-- Two live groups can't share a name (archived ones can).
CREATE UNIQUE INDEX IF NOT EXISTS member_groups_live_name_idx
  ON public.member_groups (lower(btrim(name))) WHERE archived_at IS NULL;

DROP TRIGGER IF EXISTS member_groups_updated_at ON public.member_groups;
CREATE TRIGGER member_groups_updated_at
  BEFORE UPDATE ON public.member_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Memberships -----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.member_group_members (
  group_id uuid NOT NULL REFERENCES public.member_groups (id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'manager')),
  title text CHECK (title IS NULL OR length(btrim(title)) BETWEEN 1 AND 60),
  added_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, profile_id)
);

COMMENT ON TABLE public.member_group_members IS
  'Who is in which member group; role manager = « Responsable » (no admin access). Written by the admin with the service role.';

CREATE INDEX IF NOT EXISTS member_group_members_profile_idx
  ON public.member_group_members (profile_id);

-- 3. Event audiences -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.event_audiences (
  event_id uuid NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.member_groups (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, group_id)
);

COMMENT ON TABLE public.event_audiences IS
  'Who an event is for: no row = every member; rows = only the members of those groups (and the admins). Written through save_event_with_audience().';

CREATE INDEX IF NOT EXISTS event_audiences_group_idx
  ON public.event_audiences (group_id);

-- 4. Rules -----------------------------------------------------------------------

-- Is the signed-in person in this group?
CREATE OR REPLACE FUNCTION public.is_in_group(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.member_group_members m
     WHERE m.group_id = p_group_id
       AND m.profile_id = (SELECT auth.uid())
  );
$$;

-- May the signed-in person see this event? Yes when it has no audience, when
-- they are an admin, or when they are in one of its groups.
CREATE OR REPLACE FUNCTION public.can_see_event(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NOT EXISTS (
           SELECT 1 FROM public.event_audiences a WHERE a.event_id = p_event_id
         )
      OR public.is_admin()
      OR EXISTS (
           SELECT 1
             FROM public.event_audiences a
             JOIN public.member_group_members m ON m.group_id = a.group_id
            WHERE a.event_id = p_event_id
              AND m.profile_id = (SELECT auth.uid())
         );
$$;

REVOKE ALL ON FUNCTION public.is_in_group(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_see_event(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_in_group(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_see_event(uuid) TO authenticated, service_role;

-- 5. Row-level security ----------------------------------------------------------

DROP POLICY IF EXISTS "Events: signed-in users read all events" ON public.events;
DROP POLICY IF EXISTS "Events: signed-in users read the events they may see" ON public.events;
CREATE POLICY "Events: signed-in users read the events they may see"
  ON public.events FOR SELECT TO authenticated
  USING (public.can_see_event(id));

ALTER TABLE public.member_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_audiences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Member groups: read" ON public.member_groups;
CREATE POLICY "Member groups: read" ON public.member_groups
  FOR SELECT TO authenticated
  USING (
    visibility = 'members'
    OR (SELECT public.is_admin())
    OR public.is_in_group(id)
  );

DROP POLICY IF EXISTS "Member group members: read" ON public.member_group_members;
CREATE POLICY "Member group members: read" ON public.member_group_members
  FOR SELECT TO authenticated
  USING (
    profile_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
    OR public.is_in_group(group_id)
    OR EXISTS (
      SELECT 1 FROM public.member_groups g
       WHERE g.id = member_group_members.group_id
         AND g.visibility = 'members'
    )
  );

DROP POLICY IF EXISTS "Event audiences: read with the event" ON public.event_audiences;
CREATE POLICY "Event audiences: read with the event" ON public.event_audiences
  FOR SELECT TO authenticated
  USING (public.can_see_event(event_id));

REVOKE ALL ON TABLE public.member_groups FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.member_group_members FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.event_audiences FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.member_groups TO authenticated;
GRANT SELECT ON TABLE public.member_group_members TO authenticated;
GRANT SELECT ON TABLE public.event_audiences TO authenticated;
GRANT ALL ON TABLE public.member_groups TO service_role;
GRANT ALL ON TABLE public.member_group_members TO service_role;
GRANT ALL ON TABLE public.event_audiences TO service_role;

-- 6. A group event is never public ----------------------------------------------

CREATE OR REPLACE FUNCTION public.event_audience_not_public()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = NEW.event_id AND e.is_public
  ) THEN
    RAISE EXCEPTION 'Un événement public ne peut pas être réservé à des groupes'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.event_not_public_with_audience()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.is_public AND EXISTS (
    SELECT 1 FROM public.event_audiences a WHERE a.event_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Un événement réservé à des groupes ne peut pas être public'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.event_audience_not_public() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.event_not_public_with_audience() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS event_audiences_not_public ON public.event_audiences;
CREATE TRIGGER event_audiences_not_public
  BEFORE INSERT OR UPDATE ON public.event_audiences
  FOR EACH ROW EXECUTE FUNCTION public.event_audience_not_public();

DROP TRIGGER IF EXISTS events_group_events_not_public ON public.events;
CREATE TRIGGER events_group_events_not_public
  BEFORE UPDATE OF is_public ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.event_not_public_with_audience();

-- 7. One write for an event and its audience -------------------------------------
-- p_id null: a new event; else that event (every column of the dialog is in
-- p_event, as the admin's route checks). p_group_ids empty: every member.
-- Order matters for the push: groups leaving the audience go first, then the
-- event row (its trigger queues the push, sent after commit), then the new
-- groups, so the function reads the final audience when it runs.

CREATE OR REPLACE FUNCTION public.save_event_with_audience(
  p_event jsonb,
  p_group_ids uuid[],
  p_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
  v_groups uuid[] := ARRAY(
    SELECT DISTINCT g FROM unnest(COALESCE(p_group_ids, '{}'::uuid[])) g
  );
  v_row public.events;
BEGIN
  IF p_event IS NULL OR jsonb_typeof(p_event) <> 'object' THEN
    RAISE EXCEPTION 'Événement manquant' USING ERRCODE = '22023';
  END IF;
  v_row := jsonb_populate_record(NULL::public.events, p_event);

  IF cardinality(v_groups) > 0 AND COALESCE(v_row.is_public, false) THEN
    RAISE EXCEPTION 'Un événement réservé à des groupes ne peut pas être public'
      USING ERRCODE = '23514';
  END IF;

  -- Every group must exist; an archived one only if the event already has it.
  IF EXISTS (
    SELECT 1 FROM unnest(v_groups) g
     WHERE NOT EXISTS (
       SELECT 1 FROM public.member_groups mg
        WHERE mg.id = g
          AND (mg.archived_at IS NULL OR EXISTS (
                SELECT 1 FROM public.event_audiences a
                 WHERE a.event_id = p_id AND a.group_id = g))
     )
  ) THEN
    RAISE EXCEPTION 'Groupe inconnu ou archivé' USING ERRCODE = '22023';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.events (
      title, date_from, date_to, "time", location, responsible_name,
      responsible_email, event_type, description, link, is_public
    ) VALUES (
      v_row.title, v_row.date_from, v_row.date_to, v_row."time",
      v_row.location, v_row.responsible_name, v_row.responsible_email,
      v_row.event_type, v_row.description, v_row.link,
      COALESCE(v_row.is_public, false)
    )
    RETURNING id INTO v_id;
  ELSE
    DELETE FROM public.event_audiences a
     WHERE a.event_id = p_id AND NOT (a.group_id = ANY (v_groups));

    UPDATE public.events e SET
      title = v_row.title,
      date_from = v_row.date_from,
      date_to = v_row.date_to,
      "time" = v_row."time",
      location = v_row.location,
      responsible_name = v_row.responsible_name,
      responsible_email = v_row.responsible_email,
      event_type = v_row.event_type,
      description = v_row.description,
      link = v_row.link,
      is_public = COALESCE(v_row.is_public, false),
      updated_at = now()
     WHERE e.id = p_id
    RETURNING e.id INTO v_id;

    IF v_id IS NULL THEN
      RAISE EXCEPTION 'Événement introuvable' USING ERRCODE = 'P0002';
    END IF;
  END IF;

  INSERT INTO public.event_audiences (event_id, group_id)
  SELECT v_id, g FROM unnest(v_groups) g
  ON CONFLICT (event_id, group_id) DO NOTHING;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_event_with_audience(jsonb, uuid[], uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_event_with_audience(jsonb, uuid[], uuid)
  TO service_role;

-- 8. Pushes ----------------------------------------------------------------------
-- Same body as 20261011190000_push_old_record.sql, plus `audience` for events.

CREATE OR REPLACE FUNCTION public.notify_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _url text;
  _key text;
  _secret text;
  _body jsonb;
  _row jsonb;
  _op text;
BEGIN
  IF current_setting('app.silence_push', true) = 'true' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT decrypted_secret INTO _url FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO _key FROM vault.decrypted_secrets WHERE name = 'anon_key';
  SELECT decrypted_secret INTO _secret FROM vault.decrypted_secrets WHERE name = 'internal_function_secret';
  IF _url IS NULL OR _key IS NULL OR _secret IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  _op := TG_OP;
  IF _op = 'DELETE' THEN
    _row := to_jsonb(OLD);
  ELSE
    _row := to_jsonb(NEW);
  END IF;

  _body := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'operation', _op,
    'record', _row
  );
  IF _op = 'UPDATE' THEN
    _body := _body || jsonb_build_object('old_record', to_jsonb(OLD));
  END IF;
  -- The groups the event is for, as they are now. On DELETE the trigger runs
  -- BEFORE the row goes, while its audience rows are still there.
  IF TG_TABLE_NAME = 'events' THEN
    _body := _body || jsonb_build_object('audience', COALESCE((
      SELECT jsonb_agg(a.group_id ORDER BY a.group_id)
        FROM public.event_audiences a
       WHERE a.event_id = (_row->>'id')::uuid
    ), '[]'::jsonb));
  END IF;

  PERFORM net.http_post(
    url := _url || '/functions/v1/send-push-notification',
    headers := public.edge_function_auth_headers() || jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', _secret
    ),
    body := _body,
    timeout_milliseconds := 15000
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS events_push_notification ON public.events;
DROP TRIGGER IF EXISTS events_push_notification_delete ON public.events;
CREATE TRIGGER events_push_notification
  AFTER INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.notify_push_notification();
CREATE TRIGGER events_push_notification_delete
  BEFORE DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.notify_push_notification();

-- 9. The first group ---------------------------------------------------------------

INSERT INTO public.member_groups (name, slug, kind, description, color, icon, visibility, is_system)
VALUES (
  'Conseil d''administration', 'ca', 'instance',
  'Les administrateurs élus en assemblée générale : réunions et décisions.',
  'teal', 'landmark', 'private', true
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
