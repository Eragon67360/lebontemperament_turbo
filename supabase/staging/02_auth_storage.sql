-- Staging auth and storage objects: run after 01_schema.sql.
-- From the owner's 2026-10-07 dump of production's auth and storage schemas:
-- only the sign-up trigger and the storage.objects policies are kept (the
-- tables themselves belong to Supabase). Bucket list and settings come from
-- the migrations and the code: profile-pictures, ca-documents and
-- concert-posters are read through public URLs; programs and
-- donation-receipts are private.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-pictures', 'profile-pictures', true, null, null),
  ('ca-documents', 'ca-documents', true, null, null),
  ('concert-posters', 'concert-posters', true, null, null),
  ('donation-receipts', 'donation-receipts', false, null, null),
  ('programs', 'programs', false, null, null)
on conflict (id) do nothing;

-- programs limits, same as migration 20261007100000.
UPDATE storage.buckets
   SET file_size_limit = 52428800, -- 50 MB
       allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/heic',
    'image/heif',
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/x-m4a',
    'audio/aac',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/ogg',
    'audio/webm',
    'audio/flac',
    'audio/x-flac',
    'audio/midi',
    'audio/x-midi',
    'application/vnd.recordare.musicxml+xml',
    'application/vnd.recordare.musicxml',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation'
       ]
 WHERE id = 'programs';

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "Admins can delete files and folders in programs bucket" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'programs'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])))))));

CREATE POLICY "Admins can delete profile pictures" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'profile-pictures'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])))))));

CREATE POLICY "Admins can delete program files" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'programs'::text) AND (auth.role() = 'authenticated'::text) AND ( SELECT public.is_admin() AS is_admin)));

CREATE POLICY "Admins can list files in programs bucket" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'programs'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])))))));

CREATE POLICY "Admins can manage program files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'programs'::text) AND (auth.role() = 'authenticated'::text) AND ( SELECT public.is_admin() AS is_admin)));

CREATE POLICY "Admins can update profile pictures" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'profile-pictures'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))))) WITH CHECK (((bucket_id = 'profile-pictures'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])))))));

CREATE POLICY "Admins can update program files" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'programs'::text) AND (auth.role() = 'authenticated'::text) AND ( SELECT public.is_admin() AS is_admin))) WITH CHECK (((bucket_id = 'programs'::text) AND (auth.role() = 'authenticated'::text) AND ( SELECT public.is_admin() AS is_admin)));

CREATE POLICY "Admins can upload profile pictures" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'profile-pictures'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])))))));

CREATE POLICY "Allow admin delete CA documents" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'ca-documents'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])))))));

CREATE POLICY "Allow admin update CA documents" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'ca-documents'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))))) WITH CHECK (((bucket_id = 'ca-documents'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])))))));

CREATE POLICY "Allow admin upload CA documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'ca-documents'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])))))));

CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'concert-posters'::text));

CREATE POLICY "Allow authenticated users to delete objects" ON storage.objects FOR DELETE TO authenticated USING ((bucket_id = 'concert-posters'::text));

CREATE POLICY "Allow public read CA documents" ON storage.objects FOR SELECT USING ((bucket_id = 'ca-documents'::text));

CREATE POLICY "Allow public viewing" ON storage.objects FOR SELECT USING ((bucket_id = 'concert-posters'::text));

CREATE POLICY "Authenticated users can read program files" ON storage.objects FOR SELECT TO authenticated USING ((bucket_id = 'programs'::text));

CREATE POLICY "Authenticated users can view profile pictures" ON storage.objects FOR SELECT TO authenticated USING ((bucket_id = 'profile-pictures'::text));

CREATE POLICY "Service role can read donation receipts" ON storage.objects FOR SELECT TO service_role USING ((bucket_id = 'donation-receipts'::text));

CREATE POLICY "Service role can upload donation receipts" ON storage.objects FOR INSERT TO service_role WITH CHECK ((bucket_id = 'donation-receipts'::text));


-- Realtime: the tables the migrations add to supabase_realtime (pg_dump of
-- `public` keeps REPLICA IDENTITY FULL but not the publication membership).
alter publication supabase_realtime add table
  public.feature_flags,
  public.anniversary_hero_stats,
  public.anniversary_hero,
  public.anniversary_navigation_cards,
  public.anniversary_timeline_events,
  public.anniversary_videos,
  public.anniversary_audio_memories,
  public.anniversary_photos,
  public.anniversary_form_config,
  public.anniversary_memories,
  public.deliveries,
  public.delivery_recipients,
  public.rehearsals,
  public.events,
  public.concerts;
