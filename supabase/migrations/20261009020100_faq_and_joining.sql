-- « Rejoindre » rehearsal times and the FAQ, managed in the admin (plan
-- /mnt/project-files/admin-content/plan-2026-10-08.md, phase 4). /rejoindre
-- lists the published joining_slots, /faq and its FAQPage JSON-LD the
-- published faq_items, both in the admin's order.
--
-- Needs 20261008233000_site_documents.sql (content_revisions).
-- Backward compatible: new tables only, seeded with what the website shows
-- today (apps/website/lib/faq.ts and lib/joining.ts). The app keeps its own
-- copy (public_content.dart) until it reads these.
--
-- Rollback: DROP TABLE IF EXISTS public.faq_items, public.joining_slots;

CREATE TABLE IF NOT EXISTS public.faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL CHECK (length(btrim(question)) BETWEEN 1 AND 200),
  -- Plain text: shown as is and copied into the FAQPage JSON-LD.
  answer text NOT NULL CHECK (length(btrim(answer)) BETWEEN 1 AND 1500),
  -- An optional link under the answer: a page of the site or an https address.
  link_href text CHECK (
    link_href IS NULL OR (
      length(link_href) <= 500
      AND (link_href ~ '^/([^/]|$)' OR link_href ~ '^https://[^\s]+$')
    )
  ),
  link_label text CHECK (link_label IS NULL OR length(btrim(link_label)) BETWEEN 1 AND 60),
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'archived')),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((link_href IS NULL) = (link_label IS NULL))
);

COMMENT ON TABLE public.faq_items IS
  'Questions of /faq (and its FAQPage JSON-LD), edited in the admin (Concerts et site public › Rejoindre et FAQ).';

CREATE TABLE IF NOT EXISTS public.joining_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name text NOT NULL CHECK (length(btrim(group_name)) BETWEEN 1 AND 80),
  day text NOT NULL CHECK (length(btrim(day)) BETWEEN 1 AND 40),
  time_label text NOT NULL CHECK (length(btrim(time_label)) BETWEEN 1 AND 40),
  -- Where, with its preposition: « à Wangen », « au Conservatoire… ».
  place text NOT NULL CHECK (length(btrim(place)) BETWEEN 1 AND 120),
  rhythm text NOT NULL CHECK (length(btrim(rhythm)) BETWEEN 1 AND 120),
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'archived')),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.joining_slots IS
  'Usual rehearsal times listed on /rejoindre, edited in the admin (Concerts et site public › Rejoindre et FAQ).';

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "FAQ: everyone reads published" ON public.faq_items;
CREATE POLICY "FAQ: everyone reads published"
  ON public.faq_items FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "FAQ: admins read all" ON public.faq_items;
CREATE POLICY "FAQ: admins read all"
  ON public.faq_items FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "FAQ: admins add" ON public.faq_items;
CREATE POLICY "FAQ: admins add"
  ON public.faq_items FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "FAQ: admins edit" ON public.faq_items;
CREATE POLICY "FAQ: admins edit"
  ON public.faq_items FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "FAQ: superadmins delete" ON public.faq_items;
CREATE POLICY "FAQ: superadmins delete"
  ON public.faq_items FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'superadmin'
    )
  );

REVOKE ALL ON TABLE public.faq_items FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.faq_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.faq_items TO authenticated;
GRANT ALL ON TABLE public.faq_items TO service_role;

DROP TRIGGER IF EXISTS faq_items_updated_at ON public.faq_items;
CREATE TRIGGER faq_items_updated_at
  BEFORE UPDATE ON public.faq_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS faq_items_revision ON public.faq_items;
CREATE TRIGGER faq_items_revision
  AFTER UPDATE OR DELETE ON public.faq_items
  FOR EACH ROW EXECUTE FUNCTION public.record_content_revision();

ALTER TABLE public.joining_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Joining slots: everyone reads published" ON public.joining_slots;
CREATE POLICY "Joining slots: everyone reads published"
  ON public.joining_slots FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "Joining slots: admins read all" ON public.joining_slots;
CREATE POLICY "Joining slots: admins read all"
  ON public.joining_slots FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Joining slots: admins add" ON public.joining_slots;
CREATE POLICY "Joining slots: admins add"
  ON public.joining_slots FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Joining slots: admins edit" ON public.joining_slots;
CREATE POLICY "Joining slots: admins edit"
  ON public.joining_slots FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Joining slots: superadmins delete" ON public.joining_slots;
CREATE POLICY "Joining slots: superadmins delete"
  ON public.joining_slots FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'superadmin'
    )
  );

REVOKE ALL ON TABLE public.joining_slots FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.joining_slots TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.joining_slots TO authenticated;
GRANT ALL ON TABLE public.joining_slots TO service_role;

DROP TRIGGER IF EXISTS joining_slots_updated_at ON public.joining_slots;
CREATE TRIGGER joining_slots_updated_at
  BEFORE UPDATE ON public.joining_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS joining_slots_revision ON public.joining_slots;
CREATE TRIGGER joining_slots_revision
  AFTER UPDATE OR DELETE ON public.joining_slots
  FOR EACH ROW EXECUTE FUNCTION public.record_content_revision();

-- The 19 questions of app/faq/page.tsx (lib/faq.ts), in the same order.
INSERT INTO public.faq_items (question, answer, link_href, link_label, sort_order)
SELECT * FROM (VALUES
  ('Qu''est-ce que Le Bon Tempérament?',
   'Le Bon Tempérament est un ensemble vocal et instrumental renommé basé à Saverne, en Alsace. Fondé en 1987 par Simone Duclos, l''ensemble se distingue par le mélange des générations, la diversité des parcours des chanteurs et des instrumentistes, et l''esprit de convivialité qui l''anime. Nous interprétons un répertoire varié allant de la musique classique sacrée et profane à des pièces populaires et folkloriques.',
   NULL, NULL, 10),
  ('Quand ont lieu les concerts du Bon Tempérament?',
   'Le Bon Tempérament organise des concerts tout au long de l''année, avec une tournée estivale de dix jours. Les dates exactes sont disponibles sur notre page concerts. Nous répétons également un dimanche par mois, et les répétitions de pupitres ont lieu tous les 15 jours.',
   NULL, NULL, 20),
  ('Comment rejoindre Le Bon Tempérament?',
   'Le Bon Tempérament accueille des choristes amateurs, des chanteurs solistes professionnels et des instrumentistes de tous horizons. Écrivez-nous à lebontemperament@gmail.com ou par le formulaire de contact : nous vous proposerons une répétition d''essai, puis c''est vous qui décidez si vous restez. Notre page Rejoindre donne toutes les informations sur l''adhésion.',
   '/rejoindre', 'Découvrir la page Rejoindre', 30),
  ('Y a-t-il une audition pour entrer dans le chœur?',
   'Il n’y a pas d’audition. Vous venez à une répétition d’essai, puis c’est vous qui décidez si vous restez.',
   NULL, NULL, 40),
  ('Faut-il savoir lire la musique?',
   'Non, il n’est pas nécessaire de savoir lire la musique pour chanter dans le chœur. L’important est l’envie de chanter ensemble.',
   NULL, NULL, 50),
  ('À partir de quel âge peut-on rejoindre Le Bon Tempérament?',
   'Tous les âges sont les bienvenus, des enfants aux seniors : le chœur des tout-jeunes, le chœur de jeunes, le chœur d’adultes et l’orchestre mêlent les générations.',
   NULL, NULL, 60),
  ('Quand peut-on rejoindre l''ensemble?',
   'Vous pouvez nous rejoindre à tout moment de l’année, il n’y a pas de date limite d’inscription.',
   NULL, NULL, 70),
  ('Faut-il avoir de l''expérience musicale pour rejoindre?',
   'Non, il n''est pas nécessaire d''avoir une expérience musicale préalable pour rejoindre certains de nos chœurs. Le Bon Tempérament accueille des membres de tous niveaux. Nous avons différents chœurs adaptés à différents niveaux : un chœur d''adultes, un chœur de jeunes, et un chœur des tout-jeunes. L''important est la motivation et l''envie de partager la passion pour la musique.',
   NULL, NULL, 80),
  ('Où se déroulent les concerts?',
   'Nos concerts se déroulent principalement à Saverne et dans la région Alsace, mais nous organisons également des tournées dans d''autres régions de France. Les lieux exacts sont indiqués sur chaque affiche de concert et sur notre page concerts. Certains concerts peuvent également avoir lieu dans des églises, des salles de spectacle, ou lors de festivals.',
   NULL, NULL, 90),
  ('Les concerts sont-ils payants?',
   'Les tarifs varient selon les concerts. Certains événements sont gratuits, d''autres nécessitent une réservation avec un tarif d''entrée. Les informations de tarification et de réservation sont toujours indiquées sur les affiches de concert et sur notre site web. Pour plus d''informations, n''hésitez pas à nous contacter.',
   NULL, NULL, 100),
  ('Qui dirige Le Bon Tempérament?',
   'Le Bon Tempérament est dirigé par Simone Duclos depuis sa création en 1987. L''orchestre symphonique, créé en 2023, est dirigé par Charlotte Lienhard. Nous avons également Camille Gerlier-Lienhard qui dirige le chœur des enfants, et Chloé Rozaire qui dirige le chœur des jeunes.',
   NULL, NULL, 110),
  ('Quels types de musique sont interprétés?',
   'Le Bon Tempérament se distingue par la diversité musicale de son répertoire. Nous interprétons des œuvres variées allant de la musique classique sacrée et profane à des pièces populaires et folkloriques, couvrant une large période musicale de la Renaissance à nos jours. Notre programme inclut notamment des opéras, de la musique baroque, des œuvres chorales contemporaines, et des adaptations de musique populaire.',
   NULL, NULL, 120),
  ('Comment puis-je être informé des prochains concerts?',
   'Plusieurs moyens de rester informé : consultez régulièrement notre site web, abonnez-vous à notre newsletter en utilisant le formulaire sur la page contact, suivez-nous sur nos réseaux sociaux (Facebook, Instagram, YouTube, TikTok), ou contactez-nous directement pour être ajouté à notre liste de diffusion.',
   NULL, NULL, 130),
  ('Le Bon Tempérament propose-t-il des cours de musique?',
   'Le Bon Tempérament est avant tout un ensemble de pratique musicale en groupe. Nous ne proposons pas de cours individuels, mais la participation aux répétitions et aux concerts permet d''apprendre et de progresser dans la pratique vocale et instrumentale. Les enfants découvrent la musique à travers le chant, la pratique instrumentale et l''interprétation de spectacles musicaux.',
   NULL, NULL, 140),
  ('Y a-t-il des frais d''adhésion?',
   'La cotisation est d’environ 40 € par an pour un adulte qui travaille, partitions comprises. Une commission de solidarité aide les membres qui en ont besoin.',
   NULL, NULL, 150),
  ('Le Bon Tempérament vend-il des CDs?',
   'Oui, Le Bon Tempérament a enregistré plusieurs CDs que vous pouvez découvrir et acheter. Consultez notre page ''Autres concerts'' pour voir nos productions disponibles. Les CDs sont également disponibles lors de certains de nos concerts.',
   NULL, NULL, 160),
  ('Le Bon Tempérament part-il en tournée?',
   'Oui. Chaque été, Le Bon Tempérament organise une tournée d''une dizaine de jours dans une autre région de France. C''est au cours de ces séjours que se peaufine le programme de l''année et que se tissent les liens entre les membres de l''ensemble.',
   NULL, NULL, 170),
  ('Où ont lieu les répétitions?',
   'Les répétitions ont lieu en plusieurs endroits du Bas-Rhin : principalement à Wangen et à Nordheim pour le chœur d’adultes, et au Conservatoire de Strasbourg pour l’orchestre. Nous vous indiquons le lieu de votre répétition d’essai quand vous nous contactez ; les membres retrouvent ensuite chaque répétition dans leur agenda.',
   NULL, NULL, 180),
  ('Quand ont lieu les répétitions?',
   'Pour le chœur d’adultes, en général : le mercredi de 20 h 30 à 22 h pour les pupitres de femmes et le samedi de 10 h à 11 h 30 pour les pupitres d’hommes, toutes les deux semaines ; le dimanche de 9 h 30 à 16 h, environ une fois par mois, pour le chœur complet. L’orchestre répète le jeudi de 19 h 45 à 21 h 45. Les chœurs d’enfants et de jeunes ont leurs propres horaires : demandez-les-nous.',
   '/rejoindre#repetitions', 'Voir les répétitions', 190)
) AS seed (question, answer, link_href, link_label, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.faq_items);

-- The usual rehearsals of lib/joining.ts.
INSERT INTO public.joining_slots (group_name, day, time_label, place, rhythm, sort_order)
SELECT * FROM (VALUES
  ('Pupitres de femmes', 'mercredi', '20 h 30 – 22 h', 'à Nordheim', 'toutes les deux semaines', 10),
  ('Pupitres d’hommes', 'samedi', '10 h – 11 h 30', 'à Wangen', 'toutes les deux semaines', 20),
  ('Chœur complet', 'dimanche', '9 h 30 – 16 h', 'à Wangen', 'environ une fois par mois', 30),
  ('Orchestre', 'jeudi', '19 h 45 – 21 h 45', 'au Conservatoire de Strasbourg', 'selon le calendrier de l’orchestre', 40)
) AS seed (group_name, day, time_label, place, rhythm, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.joining_slots);
