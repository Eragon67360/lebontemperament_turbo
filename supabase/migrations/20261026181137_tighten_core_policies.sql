-- Audit 2026-10-26 (SEC-001, SEC-002, SEC-005, SEC-003): access rules that
-- were wider than the code that uses these tables. Applied to production by
-- the owner in the SQL Editor on 2026-10-26 (every check below returned
-- true); this file is the same SQL, safe to run again (every policy is
-- dropped if it exists before it is created).
--
-- Before (read from production on 2026-10-26; these policies predate the
-- migrations folder):
--   storage.objects "Allow public read CA documents"    SELECT TO public, bucket ca-documents
--   storage.objects "Allow authenticated uploads"        INSERT TO authenticated, bucket concert-posters
--   storage.objects "Allow authenticated users to delete objects"
--                                                        DELETE TO authenticated, bucket concert-posters
--   public.profiles "Allow admins to update roles", "Allow admins to delete users",
--                   "Allow admins to create profiles" (writes by admin sessions)
--   public.activities "Enable read access for all users" SELECT TO authenticated USING (true)
--   public.activities "Activities can be inserted by authenticated users"
--                                                        INSERT TO authenticated WITH CHECK (true)
--   public.programs "Enable insert for authenticated users only"
--                                                        INSERT TO authenticated WITH CHECK (true)
--   public.drive_index_nodes "Authenticated users read live drive index nodes"
--                                                        SELECT TO authenticated USING (removed_at IS NULL)
--
-- After:
--   1. ca-documents: only admins list the objects. The bucket stays public,
--      so the links stored in cas.file_url (opened by the admin and the app)
--      keep working.
--   2. concert-posters: everyone still views; only admins upload and delete
--      (apps/admin/app/api/upload and api/prochains-concerts use the admin's
--      session); images up to 5 MB, as validateUpload already enforces.
--   3. profiles: no write from a session. Every write goes through the
--      service role (admin api/users/*, website lib/profilePhoto.ts); the app
--      only reads. Read policies are unchanged.
--   4. activities: admins read; an admin inserts only as themself (the cas,
--      tours and prochains-concerts routes). The service role (users/*, the
--      website's data export) is unaffected. anon loses its grants.
--   5. programs: only admins insert (nothing in the code inserts today).
--   6. drive_index_nodes: rows under the whole-Drive root (racine) are for
--      admins only. Only the admin reads this table today.
--
-- Check after applying: production-fix-check.sql from the audit (every row
-- true), or:
--   select tablename, policyname, cmd, roles from pg_policies
--   where tablename in ('objects', 'profiles', 'activities', 'programs', 'drive_index_nodes');
--
-- Rollback (re-opens the exposure, emergency only): recreate the "Before"
-- policies above and `grant insert, update, delete on public.profiles to
-- authenticated; grant select, insert on public.activities to anon;`.

begin;

-- 1. Board (CA) documents: only admins can list them; links keep working.
drop policy if exists "Allow public read CA documents" on storage.objects;
drop policy if exists "Admins read CA documents" on storage.objects;
create policy "Admins read CA documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'ca-documents' and public.is_admin());

-- 2. Concert posters: only admins upload or delete; images up to 5 MB.
drop policy if exists "Allow authenticated uploads" on storage.objects;
drop policy if exists "Allow authenticated users to delete objects" on storage.objects;
drop policy if exists "Admins upload concert posters" on storage.objects;
drop policy if exists "Admins delete concert posters" on storage.objects;
create policy "Admins upload concert posters" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'concert-posters' and public.is_admin());
create policy "Admins delete concert posters" on storage.objects
  for delete to authenticated
  using (bucket_id = 'concert-posters' and public.is_admin());
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp',
                                  'image/gif', 'image/avif']
 where id = 'concert-posters';

-- 3. Profiles: no direct writes from a session (the sites use the service role).
drop policy if exists "Allow admins to update roles" on public.profiles;
drop policy if exists "Allow admins to delete users" on public.profiles;
drop policy if exists "Allow admins to create profiles" on public.profiles;
revoke insert, update, delete, truncate on public.profiles from anon, authenticated;

-- 4. Activity log: admins only, and an admin writes only as themself.
drop policy if exists "Enable read access for all users" on public.activities;
drop policy if exists "Activities can be inserted by authenticated users" on public.activities;
drop policy if exists "Admins read activities" on public.activities;
drop policy if exists "Admins add their own activities" on public.activities;
create policy "Admins read activities" on public.activities
  for select to authenticated using (public.is_admin());
create policy "Admins add their own activities" on public.activities
  for insert to authenticated
  with check (public.is_admin() and user_id = auth.uid());
revoke all on public.activities from anon;

-- 5. Old programs table: only admins add rows.
drop policy if exists "Enable insert for authenticated users only" on public.programs;
drop policy if exists "Admins add programs" on public.programs;
create policy "Admins add programs" on public.programs
  for insert to authenticated with check (public.is_admin());

-- 6. Drive index: the whole-Drive root (racine) is for admins only.
drop policy if exists "Authenticated users read live drive index nodes" on public.drive_index_nodes;
create policy "Authenticated users read live drive index nodes" on public.drive_index_nodes
  for select to authenticated
  using (removed_at is null and (root_slug <> 'racine' or public.is_admin()));

commit;
