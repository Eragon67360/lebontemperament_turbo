-- Migration: private events are readable by signed-in members only
--
-- Before: the policy « View events » let anyone read every row of
-- public.events (SELECT, roles public, USING true), so a visitor reading the
-- table, or the website's /api/events, also got events marked private
-- (is_public = false) with their organiser's name and e-mail.
--
-- After: signed-out visitors (anon) read public events only; signed-in users
-- (authenticated: members, admins) still read every event, as the members
-- area, the admin and the app need. Writes are unchanged (admin-only
-- policies « Create events », « Update events », « Delete events »).
-- event_documents already follows the same rule (is_public or signed in).
--
-- Who is affected: the public website already filters is_public on
-- /concerts; /api/events signed out now lists public events only; the app
-- signed out lists public events only; signed-in reads are unchanged.
-- Realtime follows the same policies.
--
-- Captured before the change (production, 2026-10-11):
--   CREATE POLICY "View events" ON public.events FOR SELECT USING (true);
--
-- Rollback:
--   DROP POLICY IF EXISTS "Events: visitors read public events" ON public.events;
--   DROP POLICY IF EXISTS "Events: signed-in users read all events" ON public.events;
--   CREATE POLICY "View events" ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "View events" ON public.events;

DROP POLICY IF EXISTS "Events: visitors read public events" ON public.events;
CREATE POLICY "Events: visitors read public events"
  ON public.events FOR SELECT TO anon
  USING (is_public);

DROP POLICY IF EXISTS "Events: signed-in users read all events" ON public.events;
CREATE POLICY "Events: signed-in users read all events"
  ON public.events FOR SELECT TO authenticated
  USING (true);
