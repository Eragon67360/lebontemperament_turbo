-- Audit 2026-10-26 (SEC-008): the profile read rules that production has used
-- since #350 (applied by hand on 2026-10-08), written down here so that
-- staging and any rebuild from this folder get them too. Safe to run again:
-- every policy is dropped if it exists before it is created.
--
-- Before:
--   production (owner's read-only check, 2026-10-26):
--     "Admins can read all profiles"  FOR SELECT TO authenticated USING (is_admin())
--     "Users can view own profile"    FOR SELECT TO authenticated USING (auth.uid() = id)
--     anon holds no privilege on public.profiles
--   this folder (20261008140050_profiles_signed_in_read_only.sql):
--     "Signed-in users can read profiles"  FOR SELECT TO authenticated USING (true)
--     "Users can view own profile"         (as above)
--   website-staging (production's schema dump of 2026-10-07):
--     "Enable read access for all users"   FOR SELECT TO public USING (true)
--     "Users can view own profile"         (as above)
--     anon keeps Supabase's default grants on public.profiles
--
-- After (production's two policies, everywhere): a member reads only their own
-- row, admins and superadmins read every row, anon reads nothing. Members see
-- each other through member_directory() and member_directory_with_avatars()
-- (SECURITY DEFINER: name, email, voice and photo), which the website and the
-- app (from 2.0.139) call. The admin reads other members' rows with an admin
-- session or the service role; API routes and edge functions use the service
-- role.
--
-- Production should not change when the owner applies this file there: it
-- already has exactly these two policies, and anon already holds nothing.
--
-- Check after applying (two SELECT rows for {authenticated}, then false):
--   select policyname, cmd, roles, qual from pg_policies
--    where schemaname = 'public' and tablename = 'profiles' order by policyname;
--   select has_table_privilege('anon', 'public.profiles', 'select');
--
-- Rollback (this folder's previous state, where every signed-in member reads
-- every profile row; emergency only):
--   drop policy "Admins can read all profiles" on public.profiles;
--   create policy "Signed-in users can read profiles" on public.profiles
--     for select to authenticated using (true);

begin;

drop policy if exists "Signed-in users can read profiles" on public.profiles;
drop policy if exists "Enable read access for all users" on public.profiles;

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles" on public.profiles
  for select to authenticated using (public.is_admin());

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);

revoke all on public.profiles from anon;

commit;
