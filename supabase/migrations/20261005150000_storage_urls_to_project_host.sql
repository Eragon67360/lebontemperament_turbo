-- Migration: stored file URLs move from the custom domain to the project host
--
-- The custom domain https://api.lebontemperament.com is a Pro plan add-on and
-- disappears when the org moves to the Free plan. The project's own host
-- https://fsklunxplbbtzgurwqmc.supabase.co serves the same files and works
-- today, alongside the custom domain. On 2026-10-05 58 public URLs used the
-- custom domain: cas.file_url (26), profiles.profile_picture_url (17),
-- concerts.affiche (13), tours.tour_poster (2).
--
-- Apply only after the website runs with the image hosts added in the same PR
-- (both hosts allowed in next.config.js), otherwise its posters stop
-- rendering. Re-run it just before the plan switch: installed apps that
-- haven't updated keep writing custom-domain URLs (profile pictures).
--
-- The concerts push-notification trigger and the updated_at triggers are
-- switched off for this statement only: a URL rewrite is not a change members
-- should be notified about, nor a content edit.
--
-- Rollback: the same UPDATEs with the two hosts swapped.

ALTER TABLE public.concerts DISABLE TRIGGER concerts_push_notification;
ALTER TABLE public.concerts DISABLE TRIGGER update_concerts_updated_at;
ALTER TABLE public.tours DISABLE TRIGGER update_tours_updated_at;
ALTER TABLE public.cas DISABLE TRIGGER update_ca_timestamp;

UPDATE public.cas
   SET file_url = replace(file_url, 'https://api.lebontemperament.com/', 'https://fsklunxplbbtzgurwqmc.supabase.co/')
 WHERE file_url LIKE 'https://api.lebontemperament.com/%';

UPDATE public.profiles
   SET profile_picture_url = replace(profile_picture_url, 'https://api.lebontemperament.com/', 'https://fsklunxplbbtzgurwqmc.supabase.co/')
 WHERE profile_picture_url LIKE 'https://api.lebontemperament.com/%';

UPDATE public.concerts
   SET affiche = replace(affiche, 'https://api.lebontemperament.com/', 'https://fsklunxplbbtzgurwqmc.supabase.co/')
 WHERE affiche LIKE 'https://api.lebontemperament.com/%';

UPDATE public.tours
   SET tour_poster = replace(tour_poster, 'https://api.lebontemperament.com/', 'https://fsklunxplbbtzgurwqmc.supabase.co/')
 WHERE tour_poster LIKE 'https://api.lebontemperament.com/%';

ALTER TABLE public.concerts ENABLE TRIGGER concerts_push_notification;
ALTER TABLE public.concerts ENABLE TRIGGER update_concerts_updated_at;
ALTER TABLE public.tours ENABLE TRIGGER update_tours_updated_at;
ALTER TABLE public.cas ENABLE TRIGGER update_ca_timestamp;
