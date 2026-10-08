-- #350: profiles were readable without signing in.
--
-- Before (read from production on 2026-10-08):
--   policy "Enable read access for all users"  FOR SELECT TO public USING (true)
--   policy "Users can view own profile"        FOR SELECT TO authenticated USING (auth.uid() = id)
--   anon held every table privilege on public.profiles (Supabase default grants).
-- "public" includes the anon role, so anyone holding the project's public key
-- could read every profile, contact details included.
--
-- Every reader of profiles (website, admin, mobile apps, edge functions) is
-- signed in or uses the service role, so limiting the read to signed-in users
-- changes nothing they see. Members still read each other's rows; hiding other
-- members' contact columns comes later, once the app reads member_directory().
--
-- Rollback (restores the exposure, only if something unexpected breaks):
--   drop policy "Signed-in users can read profiles" on public.profiles;
--   create policy "Enable read access for all users" on public.profiles
--     for select to public using (true);
--   grant select on public.profiles to anon;

begin;

drop policy if exists "Enable read access for all users" on public.profiles;

create policy "Signed-in users can read profiles" on public.profiles
  for select to authenticated using (true);

revoke all on public.profiles from anon;

commit;
