-- Staging seed: fake content so the staging website, admin and app have
-- something to show. Run on the STAGING project only, after 03. Safe to run
-- again: it deletes only rows it marks with the [staging] tag or the fixed
-- ids below, then inserts them afresh, with dates relative to today so the
-- "upcoming" lists never go stale.
--
-- No personal data and no accounts: test accounts are created in the
-- Supabase dashboard (see README.md), so their passwords never touch git.
-- The Drive folder ids are fake on purpose: staging must never point at the
-- association's real Drive.

-- Silence the push trigger for this transaction (it is inert anyway on a
-- project without the vault secrets, but this keeps the seed self-evident).
select set_config('app.silence_push', 'true', true);

-- Content from the migrations (the website's fixed texts).
insert into public.feature_flags (flag_key, flag_name, description, is_enabled)
values ('anniversary_40_years', '40 ans - Page anniversaire',
        'Active ou désactive la page anniversaire des 40 ans et tous les éléments associés (navigation, bubble, etc.)',
        true)
on conflict (flag_key) do nothing;

insert into public.anniversary_hero (hero_number, hero_subtitle, description)
values ('40', 'Années de Passion Musicale', '[staging] Texte d''introduction de la page anniversaire.')
on conflict do nothing;

insert into public.anniversary_form_config (section_title, section_description)
values ('Partagez Vos Souvenirs', '[staging] Partagez votre témoignage avec nous !')
on conflict do nothing;

delete from public.anniversary_hero_stats where label like '[staging]%';
insert into public.anniversary_hero_stats (icon_name, number, label, display_order) values
  ('FaCalendarAlt', '40', '[staging] Années', 1),
  ('FaMusic', '200+', '[staging] Concerts', 2),
  ('FaUsers', '500+', '[staging] Membres', 3);

delete from public.anniversary_navigation_cards where title like '[staging]%';
insert into public.anniversary_navigation_cards (title, description, icon_name, target_section_id, display_order) values
  ('[staging] Notre Histoire', 'Quarante ans de moments marquants', 'FaHistory', 'timeline', 1),
  ('[staging] Témoignages', 'Partagez vos souvenirs', 'FaHeart', 'memories', 2);

delete from public.anniversary_timeline_events where title like '[staging]%';
insert into public.anniversary_timeline_events (year, title, description, icon_name, display_order) values
  (1984, '[staging] La création', 'Texte factice pour la frise.', 'FaMusic', 1),
  (2024, '[staging] Quarante ans', 'Texte factice pour la frise.', 'FaStar', 2);

-- Members-area structure.
insert into public.groups (name, slug, icon, description, type, order_index) values
  ('Chœur adultes', 'staging-choeur-adultes', 'FaUsers', '[staging]', 'choir', 1),
  ('Chœur jeunes', 'staging-choeur-jeunes', 'FaChild', '[staging]', 'choir', 2),
  ('Orchestre', 'staging-orchestre', 'FaViolin', '[staging]', 'orchestra', 3)
on conflict (slug) do nothing;

delete from public.drive_index_nodes where root_slug like 'staging-%';
delete from public.drive_folders where slug like 'staging-%';
insert into public.drive_folders (slug, label, folder_id, display_order) values
  ('staging-adultes', '[staging] Adultes', 'staging-fake-folder-adultes', 1),
  ('staging-orchestre', '[staging] Orchestre', 'staging-fake-folder-orchestre', 2);

-- Season: tours, concerts, events, rehearsals.
delete from public.concerts where name like '[staging]%';
delete from public.tours where name like '[staging]%';
insert into public.tours (id, name, description, context, start_date, end_date, is_active) values
  ('5a9e0000-0000-4000-8000-000000000001', '[staging] Tournée de printemps', 'Tournée factice.',
   'orchestre_et_choeur', current_date + 30, current_date + 45, true);

insert into public.concerts (name, place, date, "time", context, additional_informations, tour_id,
                             venue_name, city, postal_code, country, is_free, price) values
  ('[staging] Concert de l''Avent', 'Église Saint-Paul, Strasbourg', current_date + 10, '17:00', 'choeur',
   'Concert factice pour les tests.', null, 'Église Saint-Paul', 'Strasbourg', '67000', 'FR', true, null),
  ('[staging] Tournée, soir 1', 'Salle des fêtes, Wangen', current_date + 30, '20:00', 'orchestre_et_choeur',
   null, '5a9e0000-0000-4000-8000-000000000001', 'Salle des fêtes', 'Wangen', '67520', 'FR', false, 15),
  ('[staging] Tournée, soir 2', 'Église, Nordheim', current_date + 45, '20:00', 'orchestre',
   null, '5a9e0000-0000-4000-8000-000000000001', 'Église', 'Nordheim', '67520', 'FR', false, 12),
  ('[staging] Concert passé', 'Conservatoire de Strasbourg', current_date - 60, '18:00', 'orchestre',
   null, null, 'Conservatoire de Strasbourg', 'Strasbourg', '67000', 'FR', true, null);

delete from public.events where title like '[staging]%';
insert into public.events (title, date_from, "time", location, responsible_name, event_type, description, is_public) values
  ('[staging] Vente de gâteaux', current_date + 7, '10:00', 'Wangen', 'Équipe staging', 'vente', 'Événement factice.', true),
  ('[staging] Week-end de répétitions', current_date + 20, '09:30', 'Nordheim', 'Équipe staging', 'sejour', 'Événement factice.', false);

delete from public.rehearsals where name like '[staging]%';
insert into public.rehearsals (name, place, date, start_time, end_time, group_type)
select '[staging] Répétition ' || g.label, g.place, current_date + g.offset_days, g.start_time, g.end_time, g.group_type::public.group_type
from (values
  ('Femmes', 'Wangen', 2, time '20:00', time '22:00', 'Femmes'),
  ('Hommes', 'Wangen', 5, time '14:00', time '16:00', 'Hommes'),
  ('chœur complet', 'Nordheim', 6, time '10:00', time '12:30', 'Choeur complet'),
  ('orchestre', 'Conservatoire de Strasbourg', 3, time '19:30', time '22:00', 'Orchestre'),
  ('chœur complet', 'Nordheim', 13, time '10:00', time '12:30', 'Choeur complet')
) as g(label, place, offset_days, start_time, end_time, group_type);

-- Public pages: discover (projects) and videos.
delete from public.projects where slug like 'staging-%';
insert into public.projects (name, sub_name, slug, date, explanation, text1, author_name, display_order) values
  ('[staging] Stabat Mater', 'Karl Jenkins', 'staging-stabat-mater', current_date + 120,
   'Projet factice pour la page Découvrir.', 'Texte factice.', 'Équipe staging', 1);

delete from public.youtube_links where title like '[staging]%';
insert into public.youtube_links (title, composer, youtube_url, performance_date, venue, is_active, display_order) values
  ('[staging] Vidéo de test', 'Compositeur factice', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
   current_date - 365, 'Salle factice', true, 1);

-- Working files (structure only; no storage objects).
delete from public.programs where name like '[staging]%';
insert into public.programs (name, start_date, end_date, is_active) values
  ('[staging] Saison en cours', current_date - 30, current_date + 240, true);
