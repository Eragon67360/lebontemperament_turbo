-- #350: the members directory as a function, so members can list each other's
-- name, email, voice and photo without reading the profiles table itself.
-- Additive: nothing calls it until the website and the app switch to it. Once
-- the app that calls it is installed, a later migration limits members to
-- their own row in profiles (admins keep every row).
--
-- Callers must be signed in and have a profile (members only). Rows are
-- ordered by display name, empty names last.
--
-- Rollback: drop function public.member_directory();

create or replace function public.member_directory()
returns table (
  id uuid,
  display_name text,
  email text,
  voice text,
  profile_picture_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, p.email, p.voice, p.profile_picture_url
  from public.profiles p
  where exists (select 1 from public.profiles me where me.id = auth.uid())
  order by p.display_name asc nulls last;
$$;

revoke all on function public.member_directory() from public, anon, authenticated;
grant execute on function public.member_directory() to authenticated;
