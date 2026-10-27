-- Audit 2026-10-26 (SEC-012): rehearsals (dates, hours, places, rooms,
-- addresses, groups) are read by signed-in members only, like the members' API
-- (/api/rehearsals) and the app's rehearsal screens. Safe to run again: the
-- policy is dropped if it exists before it is created.
--
-- APPLY ONLY AFTER the website change « /concerts reads the next rehearsal on
-- the server » (apps/website/lib/nextRehearsal.ts) is live in production.
-- Before that, the public agenda reads this table with the public key and
-- would lose its « Prochaine répétition annoncée » line.
--
-- Before (production, owner's read-only check, 2026-10-26; the policy
-- predates the migrations folder):
--   "Enable read access for all users"  FOR SELECT TO public USING (true)
--   anon holds SELECT on public.rehearsals (staging: Supabase's default grants)
-- Unchanged: the admins' "Allow admin to create rehearsals", "Allow admin to
-- update rehearsals" and "Allow admin to delete rehearsals" policies, and the
-- table's place in the supabase_realtime publication.
--
-- After:
--   "Signed-in users read rehearsals"  FOR SELECT TO authenticated USING (true)
--   anon holds no privilege on public.rehearsals
-- Readers after this: the app signed in (lists, details, Realtime), the
-- admin's session, the website's /api/rehearsals and /concerts (service role,
-- on the server), and the calendar sync and push notifications (service role
-- and SECURITY DEFINER functions). Realtime keeps sending changes to signed-in
-- subscribers only. The app's public screens read /api/joining (the
-- joining_slots table), not this one; signed out, the app's background reads
-- of this table (reminders, Realtime) get nothing, as when it is offline.
--
-- Check after applying (four policies: this SELECT for {authenticated} and the
-- three admin ones; then false, true):
--   select policyname, cmd, roles, qual from pg_policies
--    where schemaname = 'public' and tablename = 'rehearsals' order by policyname;
--   select has_table_privilege('anon', 'public.rehearsals', 'select'),
--          has_table_privilege('authenticated', 'public.rehearsals', 'select');
--
-- Rollback (restores the previous read rule; emergency only):
--   drop policy "Signed-in users read rehearsals" on public.rehearsals;
--   create policy "Enable read access for all users" on public.rehearsals
--     for select to public using (true);
--   grant select on public.rehearsals to anon;

begin;

drop policy if exists "Enable read access for all users" on public.rehearsals;

drop policy if exists "Signed-in users read rehearsals" on public.rehearsals;
create policy "Signed-in users read rehearsals" on public.rehearsals
  for select to authenticated using (true);

revoke all on public.rehearsals from anon;

commit;
