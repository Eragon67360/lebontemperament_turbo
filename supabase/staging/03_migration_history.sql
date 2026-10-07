-- Staging migration history: run last. The snapshot in 01_schema.sql already
-- contains every migration up to 20261007140000, so they are recorded as
-- applied; from then on staging takes new migrations the normal way
-- (`supabase db push` or the SQL editor) before production does.

create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  statements text[],
  name text
);

insert into supabase_migrations.schema_migrations (version, name) values
  ('20250120000000', 'add_member_fields'),
  ('20250121000000', 'add_voice_field'),
  ('20250122000000', 'add_profile_picture_url'),
  ('20250123000000', 'add_profile_picture_storage_policies'),
  ('20250124000000', 'create_anniversary_archives'),
  ('20250124000001', 'create_feature_flags'),
  ('20250125000000', 'create_anniversary_cms'),
  ('20250127000000', 'create_anniversary_hero_stats'),
  ('20250128000000', 'enable_anniversary_realtime'),
  ('20250129000000', 'create_delivery_tracking'),
  ('20250131000000', 'allow_authenticated_read_deliveries'),
  ('20250502131848', 'remote_schema'),
  ('20250601000000', 'delivery_tracking_enhancements'),
  ('20250602000000', 'delivery_recipient_token_delivered'),
  ('20250603000000', 'delivery_scheduled_end_at'),
  ('20250604000000', 'delivery_recipient_address_coords'),
  ('20250605000000', 'delivery_current_recipient'),
  ('20250606000000', 'eta_arrival_sms_sent_at'),
  ('20250606100000', 'cron_eta_arrival_sms'),
  ('20250607000000', 'enable_rehearsals_events_concerts_realtime'),
  ('20250608000000', 'add_sejour_event_type'),
  ('20250609000000', 'push_notification_trigger'),
  ('20250610000000', 'create_donations'),
  ('20260626090000', 'add_rehearsals_calendar_sync'),
  ('20260626091000', 'cron_sync_rehearsals'),
  ('20260904000000', 'add_tour_created_activity_type'),
  ('20260914000000', 'create_drive_folders'),
  ('20261002100000', 'internal_function_secret_and_tracking_rpc'),
  ('20261002100100', 'restrict_delivery_tracking_reads'),
  ('20261003100000', 'delivery_personal_data_retention'),
  ('20261003120000', 'drive_index'),
  ('20261003130000', 'restrict_rehearsals_sync_write'),
  ('20261004230000', 'purge_cron_run_history'),
  ('20261005150000', 'storage_urls_to_project_host'),
  ('20261007004500', 'concert_event_data'),
  ('20261007100000', 'programs_bucket_limits'),
  ('20261007140000', 'superadmin_ops_alerts')
on conflict (version) do nothing;
