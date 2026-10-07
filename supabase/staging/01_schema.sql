-- Production schema snapshot (structure only, no data) for the staging project.
-- Source: pg_dump --schema-only --no-owner -n public of production, taken by
-- the owner on 2026-10-07 after migration 20261007140000. Comments stripped;
-- default-privilege lines for supabase_admin removed (only that role may set
-- them, and a new project already has them). Apply after 00_prelude.sql.
-- Regenerate with the commands in README.md; never edit by hand.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE TYPE public.activity_type AS ENUM (
    'user_created',
    'user_role_changed',
    'concert_created',
    'concert_updated',
    'concert_deleted',
    'poster_updated',
    'group_updated',
    'ca_created',
    'tour_created'
);

CREATE TYPE public.group_type AS ENUM (
    'Orchestre',
    'Choeur complet',
    'Tous',
    'Hommes',
    'Femmes',
    'Jeunes/Enfants'
);

CREATE TYPE public.user_role AS ENUM (
    'superadmin',
    'admin',
    'user'
);

CREATE FUNCTION public.concert_event_data_write(p_id uuid, p_venue_name text, p_street_address text, p_postal_code text, p_city text, p_country text, p_is_free boolean, p_price numeric) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Local to this transaction: notify_push_notification() returns early.
  PERFORM set_config('app.silence_push', 'true', true);

  UPDATE public.concerts
  SET venue_name = p_venue_name,
      street_address = p_street_address,
      postal_code = p_postal_code,
      city = p_city,
      country = p_country,
      is_free = p_is_free,
      price = p_price,
      event_data_generated_at = now()
  WHERE id = p_id;

  RETURN FOUND;
END;
$$;

CREATE FUNCTION public.create_bug_message_notification() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        reference_id
    )
    SELECT 
        bug_reports.reported_by,
        'New message on your bug report',
        substring(NEW.message from 1 for 100) || '...',
        'bug_message',
        NEW.bug_report_id
    FROM bug_reports
    WHERE bug_reports.id = NEW.bug_report_id;
    
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.create_bug_status_notification() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            reference_id
        ) VALUES (
            OLD.reported_by,
            'Bug Report Status Updated',
            CASE 
                WHEN NEW.status = 'in_progress' THEN 'Your bug report is now being investigated'
                WHEN NEW.status = 'resolved' THEN 'Your bug report has been resolved'
                ELSE 'Your bug report status has been updated to: ' || NEW.status
            END,
            'bug_status',
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.create_message_notification() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO notifications (
        user_id,
        title,
        message,
        bug_report_id,
        type
    )
    SELECT 
        bug_reports.reported_by,
        'Nouveau message sur votre rapport de bug',
        substring(NEW.message from 1 for 100) || CASE WHEN length(NEW.message) > 100 THEN '...' ELSE '' END,
        NEW.bug_report_id,
        'message'
    FROM bug_reports
    WHERE bug_reports.id = NEW.bug_report_id
    AND bug_reports.reported_by != NEW.sender_id;
    
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.create_status_update_notification() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO notifications (
            user_id,
            title,
            message,
            bug_report_id,
            type
        )
        VALUES (
            NEW.reported_by,
            'Mise à jour du statut du rapport de bug',
            CASE 
                WHEN NEW.status = 'in_progress' THEN 'Votre rapport de bug "' || NEW.title || '" est en cours d''investigation.'
                WHEN NEW.status = 'resolved' THEN 'Votre rapport de bug "' || NEW.title || '" a été résolu.'
                ELSE 'Le statut de votre rapport de bug "' || NEW.title || '" a été mis à jour : ' || NEW.status
            END,
            NEW.id,
            'status_update'
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.drive_index_apply(p_run_id uuid, p_nodes jsonb, p_remove_ids text[], p_counts jsonb, p_diff jsonb, p_status text DEFAULT 'success'::text, p_error text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_upserted integer := 0;
  v_removed integer := 0;
  v_now timestamptz := now();
BEGIN
  INSERT INTO public.drive_index_nodes (
    drive_id, parent_drive_id, root_slug, kind, name, mime_type, size,
    modified_time, md5_checksum, path, depth, first_seen_at, synced_at, removed_at
  )
  SELECT
    n->>'drive_id',
    n->>'parent_drive_id',
    n->>'root_slug',
    n->>'kind',
    n->>'name',
    n->>'mime_type',
    (n->>'size')::bigint,
    (n->>'modified_time')::timestamptz,
    n->>'md5_checksum',
    n->>'path',
    (n->>'depth')::integer,
    v_now,
    v_now,
    NULL
  FROM jsonb_array_elements(COALESCE(p_nodes, '[]'::jsonb)) AS n
  ON CONFLICT (drive_id) DO UPDATE SET
    parent_drive_id = EXCLUDED.parent_drive_id,
    root_slug = EXCLUDED.root_slug,
    kind = EXCLUDED.kind,
    name = EXCLUDED.name,
    mime_type = EXCLUDED.mime_type,
    size = EXCLUDED.size,
    modified_time = EXCLUDED.modified_time,
    md5_checksum = EXCLUDED.md5_checksum,
    path = EXCLUDED.path,
    depth = EXCLUDED.depth,
    synced_at = EXCLUDED.synced_at,
    removed_at = NULL;

  GET DIAGNOSTICS v_upserted = ROW_COUNT;

  IF p_remove_ids IS NOT NULL AND array_length(p_remove_ids, 1) > 0 THEN
    UPDATE public.drive_index_nodes
    SET removed_at = v_now, synced_at = v_now
    WHERE drive_id = ANY (p_remove_ids)
      AND removed_at IS NULL;

    GET DIAGNOSTICS v_removed = ROW_COUNT;
  END IF;

  IF p_status NOT IN ('success', 'error') THEN
    RAISE EXCEPTION 'drive_index_apply: p_status must be success or error';
  END IF;

  UPDATE public.drive_sync_runs
  SET finished_at = v_now,
      status = p_status,
      counts = COALESCE(p_counts, '{}'::jsonb),
      diff = COALESCE(p_diff, '{}'::jsonb),
      error = p_error
  WHERE id = p_run_id;

  RETURN jsonb_build_object('upserted', v_upserted, 'removed', v_removed);
END;
$$;

CREATE FUNCTION public.get_delivery_by_token(token text) RETURNS TABLE(id uuid, driver_id uuid, public_token text, latitude double precision, longitude double precision, is_tracking_active boolean, expires_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone, scheduled_at timestamp with time zone, scheduled_end_at timestamp with time zone, is_delayed boolean, delay_minutes integer, problem_message text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.driver_id,
    d.public_token,
    d.latitude,
    d.longitude,
    d.is_tracking_active,
    d.expires_at,
    d.created_at,
    d.updated_at,
    d.scheduled_at,
    d.scheduled_end_at,
    d.is_delayed,
    d.delay_minutes,
    d.problem_message
  FROM deliveries d
  WHERE d.public_token = token
    AND d.expires_at > NOW();
END;
$$;

CREATE FUNCTION public.get_next_receipt_number(p_year integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
  DECLARE
    v_num INT;
  BEGIN
    INSERT INTO donation_receipt_seq (year, next_val)
    VALUES (p_year, 1)
    ON CONFLICT (year) DO UPDATE SET next_val = donation_receipt_seq.next_val + 1
    RETURNING next_val INTO v_num;
    RETURN p_year::TEXT || '-' || LPAD(v_num::TEXT, 3, '0');
  END;
$$;

CREATE FUNCTION public.get_tracking_by_recipient_token(token text) RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT jsonb_build_object(
    'recipient', jsonb_build_object(
      'id', r.id,
      'delivery_id', r.delivery_id,
      'label', r.label,
      'scheduled_at', r.scheduled_at,
      'delivered_at', r.delivered_at,
      'latitude', r.latitude,
      'longitude', r.longitude
    ),
    'delivery', jsonb_build_object(
      'id', d.id,
      -- The driver's position only while this recipient is the one being served.
      'latitude', CASE WHEN r.delivered_at IS NULL AND d.current_recipient_id = r.id THEN d.latitude END,
      'longitude', CASE WHEN r.delivered_at IS NULL AND d.current_recipient_id = r.id THEN d.longitude END,
      'is_tracking_active', d.is_tracking_active,
      'expires_at', d.expires_at,
      'updated_at', d.updated_at,
      'scheduled_at', d.scheduled_at,
      'scheduled_end_at', d.scheduled_end_at,
      'is_delayed', d.is_delayed,
      'delay_minutes', d.delay_minutes,
      'problem_message', d.problem_message,
      'current_recipient_id', d.current_recipient_id
    )
  )
  FROM delivery_recipients r
  JOIN deliveries d ON d.id = r.delivery_id
  WHERE r.public_token = token
    AND d.expires_at > now()
  LIMIT 1;
$$;

CREATE FUNCTION public.handle_new_bug_report() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  -- You could add additional logic here if needed
  
  -- Trigger the Edge Function for email notification
  select net.http_post(
    'https://fsklunxplbbtzgurwqmc.functions.supabase.co/notify-bug-report',
    json_build_object('bugReport', row_to_json(NEW))::text,
    'application/json'
  );
  
  return NEW;
end;
$$;

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$BEGIN
  INSERT INTO public.profiles (id, email, role, display_name)
  VALUES (new.id, new.email, 'user', COALESCE(
      (new.raw_user_meta_data->>'display_name')::text,
      split_part(new.email, '@', 1)
    ));
  RETURN new;
END;$$;

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  );
END;
$$;

CREATE FUNCTION public.is_admin_or_superadmin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE auth.uid() = user_id) IN ('admin', 'superadmin');
END;
$$;

CREATE FUNCTION public.notify_push_notification() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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

  PERFORM net.http_post(
    url := _url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _key,
      'x-internal-secret', _secret
    ),
    body := _body,
    timeout_milliseconds := 15000
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE FUNCTION public.ops_alert_facts(p_window_minutes integer DEFAULT 30) RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT jsonb_build_object(
    'rehearsal_sync', (
      SELECT jsonb_build_object(
        'started_at', l.started_at,
        'finished_at', l.finished_at,
        'status', l.status,
        'error_count', CASE WHEN jsonb_typeof(l.errors) = 'array'
                            THEN jsonb_array_length(l.errors) ELSE 0 END
      )
      FROM public.rehearsal_sync_logs l
      WHERE l.mode = 'cron'
      ORDER BY l.started_at DESC
      LIMIT 1
    ),
    'drive_sync', (
      SELECT jsonb_build_object(
        'started_at', r.started_at,
        'finished_at', r.finished_at,
        'status', r.status,
        'error', left(r.error, 200)
      )
      FROM public.drive_sync_runs r
      WHERE r.trigger = 'cron'
      ORDER BY r.started_at DESC
      LIMIT 1
    ),
    'cron_failures', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('jobname', f.jobname, 'failures', f.failures))
      FROM (
        SELECT j.jobname, count(*) AS failures
        FROM cron.job_run_details d
        JOIN cron.job j ON j.jobid = d.jobid
        WHERE d.status = 'failed'
          AND d.start_time > now() - make_interval(mins => p_window_minutes)
        GROUP BY j.jobname
        ORDER BY j.jobname
      ) f
    ), '[]'::jsonb),
    'http_failures', (
      SELECT jsonb_build_object(
        'count', count(*),
        'codes', COALESCE(to_jsonb(array_agg(DISTINCT
          CASE WHEN h.timed_out THEN 'timeout'
               WHEN h.status_code IS NULL THEN 'erreur'
               ELSE h.status_code::text END)), '[]'::jsonb)
      )
      FROM net._http_response h
      WHERE h.created > now() - make_interval(mins => p_window_minutes)
        AND (h.timed_out OR h.status_code IS NULL OR h.status_code >= 400)
    )
  );
$$;

CREATE FUNCTION public.purge_cron_run_history() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'cron', 'pg_temp'
    AS $$
DECLARE
  _deleted integer;
BEGIN
  DELETE FROM cron.job_run_details
   WHERE end_time < now() - interval '7 days';
  GET DIAGNOSTICS _deleted = ROW_COUNT;
  RETURN _deleted;
END;
$$;

CREATE FUNCTION public.purge_expired_delivery_personal_data() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _recipients integer;
BEGIN
  UPDATE delivery_recipients r
     SET label = 'Destinataire',
         address = NULL,
         phone_number = NULL,
         latitude = NULL,
         longitude = NULL
    FROM deliveries d
   WHERE r.delivery_id = d.id
     AND d.expires_at < now() - interval '30 days'
     AND (r.label <> 'Destinataire'
          OR r.address IS NOT NULL
          OR r.phone_number IS NOT NULL
          OR r.latitude IS NOT NULL
          OR r.longitude IS NOT NULL);
  GET DIAGNOSTICS _recipients = ROW_COUNT;

  UPDATE deliveries
     SET latitude = NULL,
         longitude = NULL
   WHERE expires_at < now()
     AND (latitude IS NOT NULL OR longitude IS NOT NULL);

  RETURN _recipients;
END;
$$;

CREATE FUNCTION public.register_push_device(p_token text, p_platform text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in' USING ERRCODE = '42501';
  END IF;
  IF p_token IS NULL OR length(p_token) < 20 OR length(p_token) > 4096 THEN
    RAISE EXCEPTION 'Invalid token' USING ERRCODE = '22023';
  END IF;
  IF p_platform IS NULL OR p_platform NOT IN ('android', 'ios') THEN
    RAISE EXCEPTION 'Invalid platform' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _uid AND role = 'superadmin'
  ) THEN
    DELETE FROM public.push_devices WHERE token = p_token;
    RETURN false;
  END IF;

  INSERT INTO public.push_devices (token, user_id, platform)
  VALUES (p_token, _uid, p_platform)
  ON CONFLICT (token) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        platform = EXCLUDED.platform,
        last_seen_at = now();
  RETURN true;
END;
$$;

CREATE FUNCTION public.rehearsals_sync_write(p_upserts jsonb, p_delete_ids uuid[], p_silence_push boolean DEFAULT false) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_created int := 0;
  v_updated int := 0;
  v_deleted int := 0;
  v_row jsonb;
  v_existing_id uuid;
BEGIN
  IF p_silence_push THEN
    PERFORM set_config('app.silence_push', 'true', true);
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(COALESCE(p_upserts, '[]'::jsonb))
  LOOP
    SELECT id INTO v_existing_id
    FROM public.rehearsals
    WHERE event_id = (v_row->>'event_id');

    IF v_existing_id IS NULL THEN
      INSERT INTO public.rehearsals (
        name,
        place,
        date,
        start_time,
        end_time,
        group_type,
        event_id,
        google_updated_at
      )
      VALUES (
        v_row->>'name',
        v_row->>'place',
        (v_row->>'date')::date,
        (v_row->>'start_time')::time,
        (v_row->>'end_time')::time,
        (v_row->>'group_type')::group_type,
        v_row->>'event_id',
        (v_row->>'google_updated_at')::timestamptz
      );

      v_created := v_created + 1;
    ELSE
      UPDATE public.rehearsals
      SET name = v_row->>'name',
          place = v_row->>'place',
          date = (v_row->>'date')::date,
          start_time = (v_row->>'start_time')::time,
          end_time = (v_row->>'end_time')::time,
          group_type = (v_row->>'group_type')::group_type,
          google_updated_at = (v_row->>'google_updated_at')::timestamptz,
          updated_at = now()
      WHERE id = v_existing_id;

      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  IF p_delete_ids IS NOT NULL AND array_length(p_delete_ids, 1) > 0 THEN
    DELETE FROM public.rehearsals
    WHERE id = ANY(p_delete_ids)
      AND event_id IS NOT NULL;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'created', v_created,
    'updated', v_updated,
    'deleted', v_deleted
  );
END;
$$;

CREATE FUNCTION public.unregister_push_device(p_token text) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  DELETE FROM public.push_devices
  WHERE token = p_token AND user_id = auth.uid();
$$;

CREATE FUNCTION public.update_anniversary_archives_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.update_ca_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.update_deliveries_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

SET default_tablespace = '';

SET default_table_access_method = heap;

CREATE TABLE public.activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    type public.activity_type NOT NULL,
    user_id uuid,
    target_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    title text NOT NULL,
    description text
);

CREATE TABLE public.anniversary_archives (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    year integer NOT NULL,
    type text NOT NULL,
    theme text NOT NULL,
    file_url text NOT NULL,
    file_size text NOT NULL,
    is_visible boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT anniversary_archives_type_check CHECK ((type = ANY (ARRAY['assemblée-générale'::text, 'rapport-annuel'::text, 'rapport-financier'::text, 'gazette'::text, 'programme'::text, 'document-historique'::text])))
);

CREATE TABLE public.anniversary_audio_memories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    speaker_name text,
    year integer,
    duration text NOT NULL,
    audio_url text NOT NULL,
    display_order integer NOT NULL,
    is_visible boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.anniversary_audio_memories REPLICA IDENTITY FULL;

CREATE TABLE public.anniversary_form_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    section_title text DEFAULT 'Partagez Vos Souvenirs'::text NOT NULL,
    section_description text DEFAULT 'Vous avez des souvenirs avec Le Bon Tempérament ? Partagez-les avec nous !'::text NOT NULL,
    name_label text DEFAULT 'Votre nom'::text,
    email_label text DEFAULT 'Votre email'::text,
    message_label text DEFAULT 'Votre souvenir'::text,
    year_label text DEFAULT 'Année (optionnel)'::text,
    submit_button_text text DEFAULT 'Partager mon souvenir'::text,
    success_message text DEFAULT 'Merci pour votre partage ! Il sera publié après modération.'::text,
    is_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.anniversary_form_config REPLICA IDENTITY FULL;

CREATE TABLE public.anniversary_hero (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hero_number text DEFAULT '40'::text NOT NULL,
    hero_subtitle text DEFAULT 'Années de Passion Musicale'::text NOT NULL,
    description text,
    cta_text text DEFAULT 'Découvrir Notre Histoire'::text,
    cta_target_section text DEFAULT 'anniversary-navigation'::text,
    enable_intro_animation boolean DEFAULT true,
    skip_button_text text DEFAULT 'Passer l''animation'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.anniversary_hero REPLICA IDENTITY FULL;

CREATE TABLE public.anniversary_hero_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    icon_name character varying(50) NOT NULL,
    number character varying(20) NOT NULL,
    label character varying(100) NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.anniversary_hero_stats REPLICA IDENTITY FULL;

COMMENT ON TABLE public.anniversary_hero_stats IS 'Statistics cards displayed in the anniversary page hero section';

CREATE TABLE public.anniversary_memories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    message text NOT NULL,
    year integer,
    is_approved boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.anniversary_memories REPLICA IDENTITY FULL;

CREATE TABLE public.anniversary_navigation_cards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    icon_name text NOT NULL,
    target_section_id text NOT NULL,
    display_order integer NOT NULL,
    is_visible boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.anniversary_navigation_cards REPLICA IDENTITY FULL;

CREATE TABLE public.anniversary_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    year integer,
    category text NOT NULL,
    image_url text NOT NULL,
    display_order integer NOT NULL,
    is_visible boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.anniversary_photos REPLICA IDENTITY FULL;

CREATE TABLE public.anniversary_timeline_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    year integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    icon_name text NOT NULL,
    display_order integer NOT NULL,
    is_visible boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.anniversary_timeline_events REPLICA IDENTITY FULL;

CREATE TABLE public.anniversary_videos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    thumbnail_url text NOT NULL,
    video_url text,
    year integer,
    category text NOT NULL,
    display_order integer NOT NULL,
    is_visible boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.anniversary_videos REPLICA IDENTITY FULL;

CREATE TABLE public.bug_messages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    bug_report_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    receiver_id uuid,
    is_read boolean DEFAULT false NOT NULL
);

COMMENT ON COLUMN public.bug_messages.receiver_id IS 'The user who should receive this message';

COMMENT ON COLUMN public.bug_messages.is_read IS 'Whether the message has been read by the receiver';

CREATE TABLE public.bug_reports (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'pending'::text,
    reported_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_read boolean DEFAULT false,
    CONSTRAINT bug_reports_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'resolved'::text])))
);

COMMENT ON TABLE public.bug_reports IS 'Stores bug reports submitted by users';

CREATE TABLE public.cas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    date_from date NOT NULL,
    file_url text,
    created_by uuid NOT NULL
);

COMMENT ON TABLE public.cas IS 'Compte-rendus de Conseil d''Administration';

COMMENT ON COLUMN public.cas.id IS 'Unique identifier';

COMMENT ON COLUMN public.cas.created_at IS 'Timestamp when the record was created';

COMMENT ON COLUMN public.cas.updated_at IS 'Timestamp when the record was last updated';

COMMENT ON COLUMN public.cas.title IS 'Title of the CA meeting (e.g., "CA du 25 mai 2025")';

COMMENT ON COLUMN public.cas.date_from IS 'Date of the CA meeting';

COMMENT ON COLUMN public.cas.file_url IS 'URL to the PDF file of the meeting minutes';

COMMENT ON COLUMN public.cas.created_by IS 'UUID of the user who created this record';

CREATE TABLE public.concerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    place text NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    context text NOT NULL,
    additional_informations text,
    name text,
    created_by uuid,
    affiche text,
    tour_id uuid,
    related_link text,
    venue_name text,
    street_address text,
    postal_code text,
    city text,
    country text,
    is_free boolean,
    price numeric(8,2),
    event_data_generated_at timestamp with time zone,
    CONSTRAINT concerts_context_check CHECK ((context = ANY (ARRAY['orchestre'::text, 'choeur'::text, 'orchestre_et_choeur'::text, 'autre'::text]))),
    CONSTRAINT concerts_country_iso2 CHECK (((country IS NULL) OR (country ~ '^[A-Z]{2}$'::text))),
    CONSTRAINT concerts_price_range CHECK (((price IS NULL) OR ((price >= (0)::numeric) AND (price <= (1000)::numeric))))
);

ALTER TABLE ONLY public.concerts REPLICA IDENTITY FULL;

COMMENT ON COLUMN public.concerts.related_link IS 'External link related to the concert';

COMMENT ON COLUMN public.concerts.venue_name IS 'Venue name without the city (AI, #328)';

COMMENT ON COLUMN public.concerts.street_address IS 'Street and number, only when stated in the inputs (AI, #328)';

COMMENT ON COLUMN public.concerts.postal_code IS 'Postal code (AI, #328)';

COMMENT ON COLUMN public.concerts.city IS 'Town of the venue (AI, #328)';

COMMENT ON COLUMN public.concerts.country IS 'ISO 3166-1 alpha-2 country code (AI, #328)';

COMMENT ON COLUMN public.concerts.is_free IS 'true: free entry or donation box; false: paid; null: unknown (AI, #328)';

COMMENT ON COLUMN public.concerts.price IS 'Full adult price in euros when paid (AI, #328)';

COMMENT ON COLUMN public.concerts.event_data_generated_at IS 'When generate-concert-event-data last filled the columns above';

CREATE TABLE public.deliveries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    driver_id uuid NOT NULL,
    public_token text NOT NULL,
    latitude double precision,
    longitude double precision,
    is_tracking_active boolean DEFAULT false NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    scheduled_at timestamp with time zone,
    is_delayed boolean DEFAULT false NOT NULL,
    delay_minutes integer,
    problem_message text,
    scheduled_end_at timestamp with time zone,
    current_recipient_id uuid
);

ALTER TABLE ONLY public.deliveries REPLICA IDENTITY FULL;

CREATE TABLE public.delivery_recipients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    delivery_id uuid NOT NULL,
    label text NOT NULL,
    scheduled_at timestamp with time zone,
    sort_order integer DEFAULT 0 NOT NULL,
    public_token text NOT NULL,
    delivered_at timestamp with time zone,
    address text,
    latitude double precision,
    longitude double precision,
    phone_number text,
    eta_arrival_sms_sent_at timestamp with time zone
);

ALTER TABLE ONLY public.delivery_recipients REPLICA IDENTITY FULL;

CREATE TABLE public.donation_receipt_seq (
    year integer NOT NULL,
    next_val integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.donations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    donor_id uuid NOT NULL,
    stripe_payment_intent_id text,
    stripe_checkout_session_id text NOT NULL,
    amount_cents integer NOT NULL,
    currency text DEFAULT 'eur'::text NOT NULL,
    receipt_number text NOT NULL,
    pdf_storage_path text,
    email_sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.donors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    postal_code text NOT NULL,
    city text NOT NULL,
    country text DEFAULT 'FR'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.drive_folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    label text NOT NULL,
    folder_id text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.drive_folders IS 'Google Drive folders browsed from the members area; slug "racine" is the direct Drive link.';

CREATE TABLE public.drive_index_nodes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    drive_id text NOT NULL,
    parent_drive_id text,
    root_slug text NOT NULL,
    kind text NOT NULL,
    name text NOT NULL,
    mime_type text,
    size bigint,
    modified_time timestamp with time zone,
    md5_checksum text,
    path text NOT NULL,
    depth integer NOT NULL,
    first_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    synced_at timestamp with time zone DEFAULT now() NOT NULL,
    removed_at timestamp with time zone,
    CONSTRAINT drive_index_nodes_depth_check CHECK ((depth >= 0)),
    CONSTRAINT drive_index_nodes_kind_check CHECK ((kind = ANY (ARRAY['folder'::text, 'file'::text])))
);

COMMENT ON TABLE public.drive_index_nodes IS 'Index of the Google Drive folders and files under the drive_folders roots, as seen by the service account. Filled by the sync-drive-index edge function; removed_at marks nodes no longer seen (soft delete). Never holds file contents.';

COMMENT ON COLUMN public.drive_index_nodes.path IS 'Names from the root folder down to this node, joined by " / ".';

COMMENT ON COLUMN public.drive_index_nodes.removed_at IS 'Set when a sync no longer sees the node under a readable root; cleared when it reappears.';

CREATE TABLE public.drive_sync_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone,
    mode text NOT NULL,
    trigger text NOT NULL,
    triggered_by uuid,
    status text DEFAULT 'running'::text NOT NULL,
    counts jsonb DEFAULT '{}'::jsonb NOT NULL,
    diff jsonb DEFAULT '{}'::jsonb NOT NULL,
    error text,
    CONSTRAINT drive_sync_runs_mode_check CHECK ((mode = ANY (ARRAY['dry_run'::text, 'apply'::text]))),
    CONSTRAINT drive_sync_runs_status_check CHECK ((status = ANY (ARRAY['running'::text, 'success'::text, 'error'::text]))),
    CONSTRAINT drive_sync_runs_trigger_check CHECK ((trigger = ANY (ARRAY['cron'::text, 'admin'::text])))
);

COMMENT ON TABLE public.drive_sync_runs IS 'Runs of the sync-drive-index edge function. counts: {added, renamed, moved, removed, unchanged, unreadable_roots}; diff: capped lists of names and paths per group (no Drive IDs).';

COMMENT ON COLUMN public.drive_sync_runs.triggered_by IS 'The admin who started the run (profiles.id); null for the nightly cron.';

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    date_from date NOT NULL,
    date_to date,
    "time" time without time zone NOT NULL,
    location text NOT NULL,
    responsible_name text NOT NULL,
    responsible_email text,
    event_type text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    link text,
    is_public boolean DEFAULT false NOT NULL,
    CONSTRAINT events_event_type_check CHECK ((event_type = ANY (ARRAY['concert'::text, 'vente'::text, 'repetition'::text, 'sejour'::text, 'autre'::text])))
);

ALTER TABLE ONLY public.events REPLICA IDENTITY FULL;

CREATE TABLE public.feature_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    flag_key text NOT NULL,
    flag_name text NOT NULL,
    description text,
    is_enabled boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.feature_flags REPLICA IDENTITY FULL;

CREATE TABLE public.files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    name text NOT NULL,
    original_name text NOT NULL,
    size integer NOT NULL,
    mime_type text NOT NULL,
    storage_path text NOT NULL,
    program_id uuid NOT NULL,
    group_id uuid NOT NULL,
    folder_id uuid,
    uploaded_by uuid
);

CREATE TABLE public.folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    name text NOT NULL,
    program_id uuid NOT NULL,
    group_id uuid NOT NULL,
    parent_folder_id uuid,
    path text NOT NULL
);

CREATE TABLE public.groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    name text NOT NULL,
    slug text NOT NULL,
    icon text NOT NULL,
    description text,
    type text NOT NULL,
    order_index integer NOT NULL,
    CONSTRAINT groups_type_check CHECK ((type = ANY (ARRAY['choir'::text, 'orchestra'::text])))
);

CREATE TABLE public.notifications (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    bug_report_id uuid,
    type text NOT NULL
);

ALTER TABLE ONLY public.notifications FORCE ROW LEVEL SECURITY;

CREATE TABLE public.ops_alerts (
    key text NOT NULL,
    status text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    first_fired_at timestamp with time zone,
    last_notified_at timestamp with time zone,
    notified_count integer DEFAULT 0 NOT NULL,
    resolved_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ops_alerts_status_check CHECK ((status = ANY (ARRAY['firing'::text, 'ok'::text])))
);

COMMENT ON TABLE public.ops_alerts IS 'State of the production alerts checked every 15 minutes by check-ops-alerts. last_notified_at stays null until a push reached a phone, so an alert raised before any phone was registered is pushed once one is.';

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    role public.user_role DEFAULT 'user'::public.user_role,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    display_name text,
    address text,
    home_phone text,
    mobile_phone text,
    voice text,
    profile_picture_url text
);

COMMENT ON COLUMN public.profiles.profile_picture_url IS 'URL of the profile picture stored in Supabase storage bucket profile-picture';

CREATE TABLE public.programs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_active boolean DEFAULT false
);

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    sub_name text,
    slug text NOT NULL,
    date date NOT NULL,
    image text,
    explanation text,
    banniere text,
    banniere_photographer_name text,
    banniere_photographer_url text,
    image2 text,
    image2_photographer_name text,
    image2_photographer_url text,
    image3 text,
    image3_photographer_name text,
    image3_photographer_url text,
    text1 text,
    text2 text,
    author_name text,
    press_articles jsonb,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.push_devices (
    token text NOT NULL,
    user_id uuid NOT NULL,
    platform text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT push_devices_platform_check CHECK ((platform = ANY (ARRAY['android'::text, 'ios'::text])))
);

COMMENT ON TABLE public.push_devices IS 'FCM registration tokens of superadmins'' phones, for the production alerts (check-ops-alerts). Written only through register_push_device() / unregister_push_device(); read by edge functions with the service role. Tokens FCM reports as unregistered are deleted at send time.';

CREATE TABLE public.rehearsal_sync_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone,
    mode text DEFAULT 'cron'::text NOT NULL,
    status text NOT NULL,
    events_fetched integer DEFAULT 0,
    created integer DEFAULT 0,
    updated integer DEFAULT 0,
    deleted integer DEFAULT 0,
    skipped integer DEFAULT 0,
    errors jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT rehearsal_sync_logs_mode_check CHECK ((mode = ANY (ARRAY['cron'::text, 'test'::text, 'dry-run'::text]))),
    CONSTRAINT rehearsal_sync_logs_status_check CHECK ((status = ANY (ARRAY['running'::text, 'success'::text, 'partial'::text, 'failed'::text])))
);

CREATE TABLE public.rehearsals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    place character varying(255) NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    group_type public.group_type NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    event_id text,
    google_updated_at timestamp with time zone
);

ALTER TABLE ONLY public.rehearsals REPLICA IDENTITY FULL;

CREATE TABLE public.tours (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    name text NOT NULL,
    description text,
    context text NOT NULL,
    start_date date,
    end_date date,
    tour_poster text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    CONSTRAINT tours_context_check CHECK ((context = ANY (ARRAY['orchestre'::text, 'choeur'::text, 'orchestre_et_choeur'::text, 'autre'::text]))),
    CONSTRAINT tours_date_check CHECK ((((start_date IS NULL) AND (end_date IS NULL)) OR ((start_date IS NOT NULL) AND (end_date IS NOT NULL) AND (end_date >= start_date))))
);

CREATE TABLE public.youtube_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    title text NOT NULL,
    composer text NOT NULL,
    youtube_url text NOT NULL,
    performance_date date NOT NULL,
    venue text NOT NULL,
    soloists text[],
    created_by uuid,
    is_active boolean DEFAULT true,
    display_order integer
);

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.anniversary_archives
    ADD CONSTRAINT anniversary_archives_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.anniversary_audio_memories
    ADD CONSTRAINT anniversary_audio_memories_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.anniversary_form_config
    ADD CONSTRAINT anniversary_form_config_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.anniversary_hero
    ADD CONSTRAINT anniversary_hero_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.anniversary_hero_stats
    ADD CONSTRAINT anniversary_hero_stats_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.anniversary_memories
    ADD CONSTRAINT anniversary_memories_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.anniversary_navigation_cards
    ADD CONSTRAINT anniversary_navigation_cards_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.anniversary_photos
    ADD CONSTRAINT anniversary_photos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.anniversary_timeline_events
    ADD CONSTRAINT anniversary_timeline_events_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.anniversary_videos
    ADD CONSTRAINT anniversary_videos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.bug_messages
    ADD CONSTRAINT bug_messages_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.bug_reports
    ADD CONSTRAINT bug_reports_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.cas
    ADD CONSTRAINT cas_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.concerts
    ADD CONSTRAINT concerts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_public_token_key UNIQUE (public_token);

ALTER TABLE ONLY public.delivery_recipients
    ADD CONSTRAINT delivery_recipients_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.delivery_recipients
    ADD CONSTRAINT delivery_recipients_public_token_key UNIQUE (public_token);

ALTER TABLE ONLY public.donation_receipt_seq
    ADD CONSTRAINT donation_receipt_seq_pkey PRIMARY KEY (year);

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_receipt_number_key UNIQUE (receipt_number);

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_stripe_checkout_session_id_key UNIQUE (stripe_checkout_session_id);

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_stripe_payment_intent_id_key UNIQUE (stripe_payment_intent_id);

ALTER TABLE ONLY public.donors
    ADD CONSTRAINT donors_email_key UNIQUE (email);

ALTER TABLE ONLY public.donors
    ADD CONSTRAINT donors_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.drive_folders
    ADD CONSTRAINT drive_folders_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.drive_folders
    ADD CONSTRAINT drive_folders_slug_key UNIQUE (slug);

ALTER TABLE ONLY public.drive_index_nodes
    ADD CONSTRAINT drive_index_nodes_drive_id_key UNIQUE (drive_id);

ALTER TABLE ONLY public.drive_index_nodes
    ADD CONSTRAINT drive_index_nodes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.drive_sync_runs
    ADD CONSTRAINT drive_sync_runs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_flag_key_key UNIQUE (flag_key);

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_slug_unique UNIQUE (slug);

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ops_alerts
    ADD CONSTRAINT ops_alerts_pkey PRIMARY KEY (key);

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_slug_key UNIQUE (slug);

ALTER TABLE ONLY public.push_devices
    ADD CONSTRAINT push_devices_pkey PRIMARY KEY (token);

ALTER TABLE ONLY public.rehearsal_sync_logs
    ADD CONSTRAINT rehearsal_sync_logs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.rehearsals
    ADD CONSTRAINT rehearsals_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.youtube_links
    ADD CONSTRAINT youtube_links_pkey PRIMARY KEY (id);

CREATE INDEX bug_messages_bug_report_id_idx ON public.bug_messages USING btree (bug_report_id);

CREATE INDEX bug_messages_created_at_idx ON public.bug_messages USING btree (created_at);

CREATE INDEX bug_messages_sender_id_idx ON public.bug_messages USING btree (sender_id);

CREATE INDEX bug_reports_created_at_idx ON public.bug_reports USING btree (created_at);

CREATE INDEX bug_reports_is_read_idx ON public.bug_reports USING btree (is_read);

CREATE INDEX bug_reports_reported_by_idx ON public.bug_reports USING btree (reported_by);

CREATE INDEX bug_reports_status_idx ON public.bug_reports USING btree (status);

CREATE INDEX drive_index_nodes_root_parent_idx ON public.drive_index_nodes USING btree (root_slug, parent_drive_id);

CREATE INDEX drive_sync_runs_started_at_idx ON public.drive_sync_runs USING btree (started_at DESC);

CREATE INDEX idx_anniversary_archives_theme ON public.anniversary_archives USING btree (theme);

CREATE INDEX idx_anniversary_archives_type ON public.anniversary_archives USING btree (type);

CREATE INDEX idx_anniversary_archives_visible ON public.anniversary_archives USING btree (is_visible);

CREATE INDEX idx_anniversary_archives_year ON public.anniversary_archives USING btree (year);

CREATE INDEX idx_anniversary_audio_order ON public.anniversary_audio_memories USING btree (display_order);

CREATE INDEX idx_anniversary_audio_year ON public.anniversary_audio_memories USING btree (year);

CREATE UNIQUE INDEX idx_anniversary_form_singleton ON public.anniversary_form_config USING btree ((true));

CREATE UNIQUE INDEX idx_anniversary_hero_singleton ON public.anniversary_hero USING btree ((true));

CREATE INDEX idx_anniversary_hero_stats_order ON public.anniversary_hero_stats USING btree (display_order);

CREATE INDEX idx_anniversary_hero_stats_visible ON public.anniversary_hero_stats USING btree (is_visible);

CREATE INDEX idx_anniversary_memories_approved ON public.anniversary_memories USING btree (is_approved);

CREATE INDEX idx_anniversary_memories_created ON public.anniversary_memories USING btree (created_at DESC);

CREATE INDEX idx_anniversary_nav_cards_order ON public.anniversary_navigation_cards USING btree (display_order);

CREATE INDEX idx_anniversary_photos_category ON public.anniversary_photos USING btree (category);

CREATE INDEX idx_anniversary_photos_order ON public.anniversary_photos USING btree (display_order);

CREATE INDEX idx_anniversary_photos_year ON public.anniversary_photos USING btree (year);

CREATE INDEX idx_anniversary_timeline_order ON public.anniversary_timeline_events USING btree (display_order);

CREATE INDEX idx_anniversary_timeline_year ON public.anniversary_timeline_events USING btree (year);

CREATE INDEX idx_anniversary_videos_category ON public.anniversary_videos USING btree (category);

CREATE INDEX idx_anniversary_videos_order ON public.anniversary_videos USING btree (display_order);

CREATE INDEX idx_anniversary_videos_year ON public.anniversary_videos USING btree (year);

CREATE INDEX idx_bug_messages_receiver_id ON public.bug_messages USING btree (receiver_id);

CREATE INDEX idx_bug_messages_sender_receiver ON public.bug_messages USING btree (sender_id, receiver_id);

CREATE INDEX idx_bug_messages_unread ON public.bug_messages USING btree (receiver_id, is_read) WHERE (is_read = false);

CREATE INDEX idx_ca_created_by ON public.cas USING btree (created_by);

CREATE INDEX idx_ca_date_from ON public.cas USING btree (date_from DESC);

CREATE INDEX idx_concerts_tour_id ON public.concerts USING btree (tour_id);

CREATE INDEX idx_deliveries_driver_id ON public.deliveries USING btree (driver_id);

CREATE INDEX idx_deliveries_expires_at ON public.deliveries USING btree (expires_at);

CREATE INDEX idx_deliveries_public_token ON public.deliveries USING btree (public_token);

CREATE INDEX idx_delivery_recipients_delivery_id ON public.delivery_recipients USING btree (delivery_id);

CREATE INDEX idx_donations_created_at ON public.donations USING btree (created_at);

CREATE INDEX idx_donations_donor_id ON public.donations USING btree (donor_id);

CREATE INDEX idx_donations_receipt_number ON public.donations USING btree (receipt_number);

CREATE INDEX idx_donations_stripe_checkout_session ON public.donations USING btree (stripe_checkout_session_id);

CREATE INDEX idx_donors_email ON public.donors USING btree (email);

CREATE INDEX idx_drive_folders_order ON public.drive_folders USING btree (display_order);

CREATE INDEX idx_feature_flags_flag_key ON public.feature_flags USING btree (flag_key);

CREATE INDEX idx_files_folder ON public.files USING btree (folder_id);

CREATE INDEX idx_files_program_group ON public.files USING btree (program_id, group_id);

CREATE INDEX idx_folders_parent ON public.folders USING btree (parent_folder_id);

CREATE INDEX idx_folders_program_group ON public.folders USING btree (program_id, group_id);

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);

CREATE INDEX idx_projects_date ON public.projects USING btree (date);

CREATE INDEX idx_projects_display_order ON public.projects USING btree (display_order);

CREATE INDEX idx_projects_slug ON public.projects USING btree (slug);

CREATE INDEX notifications_bug_report_id_idx ON public.notifications USING btree (bug_report_id);

CREATE INDEX notifications_created_at_idx ON public.notifications USING btree (created_at);

CREATE INDEX notifications_read_idx ON public.notifications USING btree (read);

CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id);

CREATE INDEX push_devices_user_id_idx ON public.push_devices USING btree (user_id);

CREATE INDEX rehearsals_event_id_date_idx ON public.rehearsals USING btree (event_id, date) WHERE (event_id IS NOT NULL);

CREATE UNIQUE INDEX rehearsals_event_id_unique ON public.rehearsals USING btree (event_id) WHERE (event_id IS NOT NULL);

CREATE TRIGGER bug_message_notification AFTER INSERT ON public.bug_messages FOR EACH ROW EXECUTE FUNCTION public.create_message_notification();

CREATE TRIGGER bug_status_change_notification AFTER UPDATE ON public.bug_reports FOR EACH ROW EXECUTE FUNCTION public.create_status_update_notification();

CREATE TRIGGER concerts_push_notification AFTER INSERT OR DELETE OR UPDATE ON public.concerts FOR EACH ROW EXECUTE FUNCTION public.notify_push_notification();

CREATE TRIGGER events_push_notification AFTER INSERT OR DELETE OR UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.notify_push_notification();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.youtube_links FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER rehearsals_push_notification AFTER INSERT OR DELETE OR UPDATE ON public.rehearsals FOR EACH ROW EXECUTE FUNCTION public.notify_push_notification();

CREATE TRIGGER update_anniversary_archives_updated_at BEFORE UPDATE ON public.anniversary_archives FOR EACH ROW EXECUTE FUNCTION public.update_anniversary_archives_updated_at();

CREATE TRIGGER update_anniversary_audio_updated_at BEFORE UPDATE ON public.anniversary_audio_memories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anniversary_form_config_updated_at BEFORE UPDATE ON public.anniversary_form_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anniversary_hero_stats_updated_at BEFORE UPDATE ON public.anniversary_hero_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anniversary_hero_updated_at BEFORE UPDATE ON public.anniversary_hero FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anniversary_memories_updated_at BEFORE UPDATE ON public.anniversary_memories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anniversary_nav_cards_updated_at BEFORE UPDATE ON public.anniversary_navigation_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anniversary_photos_updated_at BEFORE UPDATE ON public.anniversary_photos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anniversary_timeline_updated_at BEFORE UPDATE ON public.anniversary_timeline_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anniversary_videos_updated_at BEFORE UPDATE ON public.anniversary_videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ca_timestamp BEFORE UPDATE ON public.cas FOR EACH ROW EXECUTE FUNCTION public.update_ca_updated_at();

CREATE TRIGGER update_concerts_updated_at BEFORE UPDATE ON public.concerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.update_deliveries_updated_at();

CREATE TRIGGER update_drive_folders_updated_at BEFORE UPDATE ON public.drive_folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON public.files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON public.folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rehearsals_updated_at BEFORE UPDATE ON public.rehearsals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tours_updated_at BEFORE UPDATE ON public.tours FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.bug_messages
    ADD CONSTRAINT bug_messages_bug_report_id_fkey FOREIGN KEY (bug_report_id) REFERENCES public.bug_reports(id);

ALTER TABLE ONLY public.bug_messages
    ADD CONSTRAINT bug_messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id);

ALTER TABLE ONLY public.bug_messages
    ADD CONSTRAINT bug_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id);

ALTER TABLE ONLY public.bug_reports
    ADD CONSTRAINT bug_reports_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.profiles(id);

ALTER TABLE ONLY public.cas
    ADD CONSTRAINT cas_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.concerts
    ADD CONSTRAINT concerts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE ONLY public.concerts
    ADD CONSTRAINT concerts_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_current_recipient_id_fkey FOREIGN KEY (current_recipient_id) REFERENCES public.delivery_recipients(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.delivery_recipients
    ADD CONSTRAINT delivery_recipients_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.deliveries(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES public.donors(id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.drive_index_nodes
    ADD CONSTRAINT drive_index_nodes_root_slug_fkey FOREIGN KEY (root_slug) REFERENCES public.drive_folders(slug) ON UPDATE CASCADE;

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id);

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_parent_folder_id_fkey FOREIGN KEY (parent_folder_id) REFERENCES public.folders(id);

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_bug_report_id_fkey FOREIGN KEY (bug_report_id) REFERENCES public.bug_reports(id);

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.push_devices
    ADD CONSTRAINT push_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE ONLY public.youtube_links
    ADD CONSTRAINT youtube_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

CREATE POLICY "ADMINS can update feature flags" ON public.feature_flags FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Activities can be inserted by authenticated users" ON public.activities FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admin can create messages" ON public.bug_messages FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'superadmin'::public.user_role) OR (profiles.role = 'admin'::public.user_role))))));

CREATE POLICY "Admin can create youtube links" ON public.youtube_links FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'admin'::public.user_role) OR (profiles.role = 'superadmin'::public.user_role))))));

CREATE POLICY "Admin can delete youtube links" ON public.youtube_links FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'admin'::public.user_role) OR (profiles.role = 'superadmin'::public.user_role))))));

CREATE POLICY "Admin can update youtube links" ON public.youtube_links FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'admin'::public.user_role) OR (profiles.role = 'superadmin'::public.user_role))))));

CREATE POLICY "Admin/Superadmin can do anything" ON public.anniversary_hero_stats TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Admins can create projects" ON public.projects FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Admins can delete projects" ON public.projects FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Admins can manage files" ON public.files TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage folders" ON public.folders TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update projects" ON public.projects FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Admins read drive sync runs" ON public.drive_sync_runs FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Allow admin delete" ON public.concerts FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Allow admin delete" ON public.tours FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Allow admin insert" ON public.concerts FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Allow admin insert" ON public.tours FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Allow admin read on anniversary_memories" ON public.anniversary_memories FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Allow admin to create rehearsals" ON public.rehearsals FOR INSERT TO authenticated WITH CHECK ((( SELECT profiles.role
   FROM public.profiles
  WHERE (auth.uid() = profiles.id)) = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])));

CREATE POLICY "Allow admin to delete rehearsals" ON public.rehearsals FOR DELETE TO authenticated USING ((( SELECT profiles.role
   FROM public.profiles
  WHERE (auth.uid() = profiles.id)) = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])));

CREATE POLICY "Allow admin to update rehearsals" ON public.rehearsals FOR UPDATE TO authenticated USING ((( SELECT profiles.role
   FROM public.profiles
  WHERE (auth.uid() = profiles.id)) = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))) WITH CHECK ((( SELECT profiles.role
   FROM public.profiles
  WHERE (auth.uid() = profiles.id)) = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])));

CREATE POLICY "Allow admin update" ON public.concerts FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Allow admin update" ON public.tours FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Allow admin update on anniversary_memories" ON public.anniversary_memories FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Allow admin write on anniversary_archives" ON public.anniversary_archives TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Allow admin write on anniversary_audio_memories" ON public.anniversary_audio_memories TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Allow admin write on anniversary_form_config" ON public.anniversary_form_config TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Allow admin write on anniversary_hero" ON public.anniversary_hero TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Allow admin write on anniversary_navigation_cards" ON public.anniversary_navigation_cards TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Allow admin write on anniversary_photos" ON public.anniversary_photos TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Allow admin write on anniversary_timeline_events" ON public.anniversary_timeline_events TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Allow admin write on anniversary_videos" ON public.anniversary_videos TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Allow admin/superadmin to update drive folders" ON public.drive_folders FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Allow admins to create profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (((auth.uid() IN ( SELECT profiles_1.id
   FROM public.profiles profiles_1
  WHERE (profiles_1.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])))) AND (role = ANY (ARRAY['user'::public.user_role, 'admin'::public.user_role]))));

CREATE POLICY "Allow admins to delete users" ON public.profiles FOR DELETE TO authenticated USING (((auth.uid() IN ( SELECT profiles_1.id
   FROM public.profiles profiles_1
  WHERE (profiles_1.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])))) AND (( SELECT profiles_1.role
   FROM public.profiles profiles_1
  WHERE (profiles_1.id = profiles_1.id)) <> 'superadmin'::public.user_role) AND (id <> auth.uid())));

CREATE POLICY "Allow admins to update roles" ON public.profiles FOR UPDATE TO authenticated USING (((auth.uid() IN ( SELECT profiles_1.id
   FROM public.profiles profiles_1
  WHERE (profiles_1.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])))) AND (id <> auth.uid()))) WITH CHECK ((role = ANY (ARRAY['user'::public.user_role, 'admin'::public.user_role])));

CREATE POLICY "Allow anon insert on anniversary_memories" ON public.anniversary_memories FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated read access to drive folders" ON public.drive_folders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow public read on anniversary_archives" ON public.anniversary_archives FOR SELECT TO authenticated, anon USING ((is_visible = true));

CREATE POLICY "Allow public read on anniversary_audio_memories" ON public.anniversary_audio_memories FOR SELECT TO authenticated, anon USING ((is_visible = true));

CREATE POLICY "Allow public read on anniversary_form_config" ON public.anniversary_form_config FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Allow public read on anniversary_hero" ON public.anniversary_hero FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Allow public read on anniversary_navigation_cards" ON public.anniversary_navigation_cards FOR SELECT TO authenticated, anon USING ((is_visible = true));

CREATE POLICY "Allow public read on anniversary_photos" ON public.anniversary_photos FOR SELECT TO authenticated, anon USING ((is_visible = true));

CREATE POLICY "Allow public read on anniversary_timeline_events" ON public.anniversary_timeline_events FOR SELECT TO authenticated, anon USING ((is_visible = true));

CREATE POLICY "Allow public read on anniversary_videos" ON public.anniversary_videos FOR SELECT TO authenticated, anon USING ((is_visible = true));

CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT USING (true);

CREATE POLICY "Anyone can view tours" ON public.tours FOR SELECT USING (true);

CREATE POLICY "Anyone can view youtube links" ON public.youtube_links FOR SELECT USING (true);

CREATE POLICY "Authenticated users can read files" ON public.files FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read folders" ON public.folders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users read live drive index nodes" ON public.drive_index_nodes FOR SELECT TO authenticated USING ((removed_at IS NULL));

CREATE POLICY "Create events" ON public.events FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Delete events" ON public.events FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Enable insert for authenticated users only" ON public.programs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON public.activities FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all users" ON public.anniversary_hero_stats FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.feature_flags FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all users" ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.programs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all users" ON public.rehearsals FOR SELECT USING (true);

CREATE POLICY "Service role can manage donations" ON public.donations TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage donors" ON public.donors TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage receipt seq" ON public.donation_receipt_seq TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Superadmin can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'superadmin'::public.user_role)))));

CREATE POLICY "Superadmin can delete messages" ON public.bug_messages FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'superadmin'::public.user_role)))));

CREATE POLICY "Superadmin can delete notifications" ON public.notifications FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'superadmin'::public.user_role)))));

CREATE POLICY "Superadmin can update bug reports" ON public.bug_reports FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'superadmin'::public.user_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'superadmin'::public.user_role)))));

CREATE POLICY "Superadmin can update messages" ON public.bug_messages FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'superadmin'::public.user_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'superadmin'::public.user_role)))));

CREATE POLICY "Superadmin can view all bug reports" ON public.bug_reports FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'superadmin'::public.user_role)))));

CREATE POLICY "Superadmins can delete feature flags" ON public.feature_flags FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'superadmin'::public.user_role)))));

CREATE POLICY "Superadmins can insert feature flags" ON public.feature_flags FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'superadmin'::public.user_role)))));

CREATE POLICY "Superadmins can manage all deliveries" ON public.deliveries TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'superadmin'::public.user_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'superadmin'::public.user_role)))));

CREATE POLICY "Superadmins can manage all delivery_recipients" ON public.delivery_recipients TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'superadmin'::public.user_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'superadmin'::public.user_role)))));

CREATE POLICY "Superadmins read ops alerts" ON public.ops_alerts FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'superadmin'::public.user_role)))));

CREATE POLICY "Update events" ON public.events FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY "Users can create bug reports" ON public.bug_reports FOR INSERT TO authenticated WITH CHECK ((auth.uid() = reported_by));

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING ((auth.uid() = user_id));

CREATE POLICY "Users can view messages for their reports" ON public.bug_messages FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.bug_reports
  WHERE ((bug_reports.id = bug_messages.bug_report_id) AND ((bug_reports.reported_by = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.profiles
          WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'superadmin'::public.user_role)))))))));

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));

CREATE POLICY "Users can view their own bug reports" ON public.bug_reports FOR SELECT TO authenticated USING ((auth.uid() = reported_by));

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING ((auth.uid() = user_id));

CREATE POLICY "View concerts with tour info" ON public.concerts FOR SELECT USING (true);

CREATE POLICY "View events" ON public.events FOR SELECT USING (true);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.anniversary_archives ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.anniversary_audio_memories ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.anniversary_form_config ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.anniversary_hero ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.anniversary_hero_stats ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.anniversary_memories ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.anniversary_navigation_cards ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.anniversary_photos ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.anniversary_timeline_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.anniversary_videos ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bug_messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY ca_delete_policy ON public.cas FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY ca_insert_policy ON public.cas FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY ca_select_policy ON public.cas FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

CREATE POLICY ca_update_policy ON public.cas FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role]))))));

ALTER TABLE public.cas ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.concerts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.delivery_recipients ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.donation_receipt_seq ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.drive_folders ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.drive_index_nodes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.drive_sync_runs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ops_alerts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.rehearsal_sync_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.rehearsals ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.youtube_links ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

REVOKE ALL ON FUNCTION public.concert_event_data_write(p_id uuid, p_venue_name text, p_street_address text, p_postal_code text, p_city text, p_country text, p_is_free boolean, p_price numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION public.concert_event_data_write(p_id uuid, p_venue_name text, p_street_address text, p_postal_code text, p_city text, p_country text, p_is_free boolean, p_price numeric) TO service_role;

GRANT ALL ON FUNCTION public.create_bug_message_notification() TO anon;
GRANT ALL ON FUNCTION public.create_bug_message_notification() TO authenticated;
GRANT ALL ON FUNCTION public.create_bug_message_notification() TO service_role;

GRANT ALL ON FUNCTION public.create_bug_status_notification() TO anon;
GRANT ALL ON FUNCTION public.create_bug_status_notification() TO authenticated;
GRANT ALL ON FUNCTION public.create_bug_status_notification() TO service_role;

GRANT ALL ON FUNCTION public.create_message_notification() TO anon;
GRANT ALL ON FUNCTION public.create_message_notification() TO authenticated;
GRANT ALL ON FUNCTION public.create_message_notification() TO service_role;

GRANT ALL ON FUNCTION public.create_status_update_notification() TO anon;
GRANT ALL ON FUNCTION public.create_status_update_notification() TO authenticated;
GRANT ALL ON FUNCTION public.create_status_update_notification() TO service_role;

REVOKE ALL ON FUNCTION public.drive_index_apply(p_run_id uuid, p_nodes jsonb, p_remove_ids text[], p_counts jsonb, p_diff jsonb, p_status text, p_error text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.drive_index_apply(p_run_id uuid, p_nodes jsonb, p_remove_ids text[], p_counts jsonb, p_diff jsonb, p_status text, p_error text) TO service_role;

REVOKE ALL ON FUNCTION public.get_delivery_by_token(token text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_delivery_by_token(token text) TO service_role;

GRANT ALL ON FUNCTION public.get_next_receipt_number(p_year integer) TO anon;
GRANT ALL ON FUNCTION public.get_next_receipt_number(p_year integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_next_receipt_number(p_year integer) TO service_role;

REVOKE ALL ON FUNCTION public.get_tracking_by_recipient_token(token text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_tracking_by_recipient_token(token text) TO anon;
GRANT ALL ON FUNCTION public.get_tracking_by_recipient_token(token text) TO authenticated;
GRANT ALL ON FUNCTION public.get_tracking_by_recipient_token(token text) TO service_role;

GRANT ALL ON FUNCTION public.handle_new_bug_report() TO anon;
GRANT ALL ON FUNCTION public.handle_new_bug_report() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_bug_report() TO service_role;

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;

GRANT ALL ON FUNCTION public.handle_updated_at() TO anon;
GRANT ALL ON FUNCTION public.handle_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.handle_updated_at() TO service_role;

GRANT ALL ON FUNCTION public.is_admin() TO anon;
GRANT ALL ON FUNCTION public.is_admin() TO authenticated;
GRANT ALL ON FUNCTION public.is_admin() TO service_role;

GRANT ALL ON FUNCTION public.is_admin_or_superadmin() TO anon;
GRANT ALL ON FUNCTION public.is_admin_or_superadmin() TO authenticated;
GRANT ALL ON FUNCTION public.is_admin_or_superadmin() TO service_role;

GRANT ALL ON FUNCTION public.notify_push_notification() TO anon;
GRANT ALL ON FUNCTION public.notify_push_notification() TO authenticated;
GRANT ALL ON FUNCTION public.notify_push_notification() TO service_role;

REVOKE ALL ON FUNCTION public.ops_alert_facts(p_window_minutes integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.ops_alert_facts(p_window_minutes integer) TO service_role;

REVOKE ALL ON FUNCTION public.purge_cron_run_history() FROM PUBLIC;
GRANT ALL ON FUNCTION public.purge_cron_run_history() TO service_role;

REVOKE ALL ON FUNCTION public.purge_expired_delivery_personal_data() FROM PUBLIC;
GRANT ALL ON FUNCTION public.purge_expired_delivery_personal_data() TO service_role;

REVOKE ALL ON FUNCTION public.register_push_device(p_token text, p_platform text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.register_push_device(p_token text, p_platform text) TO service_role;
GRANT ALL ON FUNCTION public.register_push_device(p_token text, p_platform text) TO authenticated;

REVOKE ALL ON FUNCTION public.rehearsals_sync_write(p_upserts jsonb, p_delete_ids uuid[], p_silence_push boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.rehearsals_sync_write(p_upserts jsonb, p_delete_ids uuid[], p_silence_push boolean) TO service_role;

REVOKE ALL ON FUNCTION public.unregister_push_device(p_token text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.unregister_push_device(p_token text) TO service_role;
GRANT ALL ON FUNCTION public.unregister_push_device(p_token text) TO authenticated;

GRANT ALL ON FUNCTION public.update_anniversary_archives_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_anniversary_archives_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_anniversary_archives_updated_at() TO service_role;

GRANT ALL ON FUNCTION public.update_ca_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_ca_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_ca_updated_at() TO service_role;

GRANT ALL ON FUNCTION public.update_deliveries_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_deliveries_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_deliveries_updated_at() TO service_role;

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.activities TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.activities TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.activities TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_archives TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_archives TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_archives TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_audio_memories TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_audio_memories TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_audio_memories TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_form_config TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_form_config TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_form_config TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_hero TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_hero TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_hero TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_hero_stats TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_hero_stats TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_hero_stats TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_memories TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_memories TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_memories TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_navigation_cards TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_navigation_cards TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_navigation_cards TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_photos TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_photos TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_photos TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_timeline_events TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_timeline_events TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_timeline_events TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_videos TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_videos TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.anniversary_videos TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.bug_messages TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.bug_messages TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.bug_messages TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.bug_reports TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.bug_reports TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.bug_reports TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.cas TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.cas TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.cas TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.concerts TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.concerts TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.concerts TO service_role;

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.deliveries TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.deliveries TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.deliveries TO service_role;

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.delivery_recipients TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.delivery_recipients TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.delivery_recipients TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.donation_receipt_seq TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.donation_receipt_seq TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.donation_receipt_seq TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.donations TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.donations TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.donations TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.donors TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.donors TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.donors TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.drive_folders TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.drive_folders TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.drive_folders TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.drive_index_nodes TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.drive_index_nodes TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.drive_index_nodes TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.drive_sync_runs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.drive_sync_runs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.drive_sync_runs TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.events TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.events TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.events TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.feature_flags TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.feature_flags TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.feature_flags TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.files TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.files TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.files TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.folders TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.folders TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.folders TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.groups TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.groups TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.groups TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notifications TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notifications TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notifications TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.ops_alerts TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.ops_alerts TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.ops_alerts TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.profiles TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.profiles TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.programs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.programs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.programs TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.projects TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.projects TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.projects TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.push_devices TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.push_devices TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.push_devices TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.rehearsal_sync_logs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.rehearsal_sync_logs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.rehearsal_sync_logs TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.rehearsals TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.rehearsals TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.rehearsals TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tours TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tours TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tours TO service_role;

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.youtube_links TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.youtube_links TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.youtube_links TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO service_role;
