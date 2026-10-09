-- Migration: deleting a member's account works and keeps the association's content
-- Refs #354
--
-- Measured on website-staging (production's structure) on 2026-10-08:
-- deleting an account (admin › Membres › « Supprimer définitivement… », which
-- calls auth.admin.deleteUser) deletes auth.users, which cascades to
-- profiles, and then:
--   * FAILS for anyone who has a notification, a bug report, or a message in
--     a bug conversation (notifications, bug_reports and bug_messages point at
--     profiles with NO ACTION), and for an admin who created a concert, a
--     tour, a video or uploaded an old Storage file (NO ACTION towards
--     auth.users). So most deletion requests could not be carried out;
--   * DELETES the board minutes (cas) an admin uploaded (ON DELETE CASCADE).
--
-- After this migration:
--   * the member's own rows go with the account: notifications, their bug
--     reports with the reports' conversations and notifications, and the
--     messages they wrote in other conversations (the app reads sender_id as
--     non-null, so messages are deleted, not anonymised);
--   * the association's content stays, without its author: concerts, tours,
--     videos, board minutes, files (created_by / uploaded_by set to NULL;
--     cas.created_by becomes nullable for that);
--   * bug_messages.receiver_id (already nullable) is set to NULL.
--   activities (SET NULL), deliveries (CASCADE), push_devices (CASCADE) and
--   profiles (CASCADE) already behave and are unchanged.
--
-- Changes only what happens on DELETE; no row is touched when it runs.
-- Each constraint is dropped by name if it exists and re-added, so the file
-- can be run again.
--
-- Rollback (restores the old rules):
--   ALTER TABLE public.notifications DROP CONSTRAINT notifications_user_id_fkey,
--     ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
--   ALTER TABLE public.notifications DROP CONSTRAINT notifications_bug_report_id_fkey,
--     ADD CONSTRAINT notifications_bug_report_id_fkey FOREIGN KEY (bug_report_id) REFERENCES public.bug_reports(id);
--   ALTER TABLE public.bug_reports DROP CONSTRAINT bug_reports_reported_by_fkey,
--     ADD CONSTRAINT bug_reports_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.profiles(id);
--   ALTER TABLE public.bug_messages DROP CONSTRAINT bug_messages_bug_report_id_fkey,
--     ADD CONSTRAINT bug_messages_bug_report_id_fkey FOREIGN KEY (bug_report_id) REFERENCES public.bug_reports(id);
--   ALTER TABLE public.bug_messages DROP CONSTRAINT bug_messages_sender_id_fkey,
--     ADD CONSTRAINT bug_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id);
--   ALTER TABLE public.bug_messages DROP CONSTRAINT bug_messages_receiver_id_fkey,
--     ADD CONSTRAINT bug_messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id);
--   ALTER TABLE public.cas DROP CONSTRAINT cas_created_by_fkey,
--     ADD CONSTRAINT cas_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
--   (cas.created_by stays nullable: SET NOT NULL fails once an author was deleted)
--   ALTER TABLE public.concerts DROP CONSTRAINT concerts_created_by_fkey,
--     ADD CONSTRAINT concerts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
--   ALTER TABLE public.tours DROP CONSTRAINT tours_created_by_fkey,
--     ADD CONSTRAINT tours_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
--   ALTER TABLE public.youtube_links DROP CONSTRAINT youtube_links_created_by_fkey,
--     ADD CONSTRAINT youtube_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
--   ALTER TABLE public.files DROP CONSTRAINT files_uploaded_by_fkey,
--     ADD CONSTRAINT files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);

BEGIN;

-- The member's own rows go with the account.
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
  ADD CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_bug_report_id_fkey,
  ADD CONSTRAINT notifications_bug_report_id_fkey
    FOREIGN KEY (bug_report_id) REFERENCES public.bug_reports (id) ON DELETE CASCADE;

ALTER TABLE public.bug_reports
  DROP CONSTRAINT IF EXISTS bug_reports_reported_by_fkey,
  ADD CONSTRAINT bug_reports_reported_by_fkey
    FOREIGN KEY (reported_by) REFERENCES public.profiles (id) ON DELETE CASCADE;

ALTER TABLE public.bug_messages
  DROP CONSTRAINT IF EXISTS bug_messages_bug_report_id_fkey,
  ADD CONSTRAINT bug_messages_bug_report_id_fkey
    FOREIGN KEY (bug_report_id) REFERENCES public.bug_reports (id) ON DELETE CASCADE;

ALTER TABLE public.bug_messages
  DROP CONSTRAINT IF EXISTS bug_messages_sender_id_fkey,
  ADD CONSTRAINT bug_messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

ALTER TABLE public.bug_messages
  DROP CONSTRAINT IF EXISTS bug_messages_receiver_id_fkey,
  ADD CONSTRAINT bug_messages_receiver_id_fkey
    FOREIGN KEY (receiver_id) REFERENCES public.profiles (id) ON DELETE SET NULL;

-- The association's content stays, without its author.
ALTER TABLE public.cas ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE public.cas
  DROP CONSTRAINT IF EXISTS cas_created_by_fkey,
  ADD CONSTRAINT cas_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.concerts
  DROP CONSTRAINT IF EXISTS concerts_created_by_fkey,
  ADD CONSTRAINT concerts_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.tours
  DROP CONSTRAINT IF EXISTS tours_created_by_fkey,
  ADD CONSTRAINT tours_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.youtube_links
  DROP CONSTRAINT IF EXISTS youtube_links_created_by_fkey,
  ADD CONSTRAINT youtube_links_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.files
  DROP CONSTRAINT IF EXISTS files_uploaded_by_fkey,
  ADD CONSTRAINT files_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES auth.users (id) ON DELETE SET NULL;

COMMIT;
