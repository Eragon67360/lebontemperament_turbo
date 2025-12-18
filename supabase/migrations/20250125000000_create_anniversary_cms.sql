-- Migration: Anniversary CMS Tables
-- Description: Create tables for admin-editable 40-year anniversary page content

-- ============================================================================
-- TABLE 1: anniversary_hero (Landing Section - Single Row)
-- ============================================================================
CREATE TABLE IF NOT EXISTS anniversary_hero (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hero_number TEXT NOT NULL DEFAULT '40',
  hero_subtitle TEXT NOT NULL DEFAULT 'Années de Passion Musicale',
  description TEXT,
  cta_text TEXT DEFAULT 'Découvrir Notre Histoire',
  cta_target_section TEXT DEFAULT 'anniversary-navigation',
  enable_intro_animation BOOLEAN DEFAULT true,
  skip_button_text TEXT DEFAULT 'Passer l''animation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one row allowed (singleton pattern)
CREATE UNIQUE INDEX IF NOT EXISTS idx_anniversary_hero_singleton ON anniversary_hero ((TRUE));

-- Enable RLS
ALTER TABLE anniversary_hero ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read on anniversary_hero"
  ON anniversary_hero FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow admin write on anniversary_hero"
  ON anniversary_hero FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- ============================================================================
-- TABLE 2: anniversary_navigation_cards (Navigation Cards)
-- ============================================================================
CREATE TABLE IF NOT EXISTS anniversary_navigation_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  target_section_id TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anniversary_nav_cards_order ON anniversary_navigation_cards(display_order);

-- Enable RLS
ALTER TABLE anniversary_navigation_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read on anniversary_navigation_cards"
  ON anniversary_navigation_cards FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);

CREATE POLICY "Allow admin write on anniversary_navigation_cards"
  ON anniversary_navigation_cards FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- ============================================================================
-- TABLE 3: anniversary_timeline_events (Timeline Events)
-- ============================================================================
CREATE TABLE IF NOT EXISTS anniversary_timeline_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anniversary_timeline_order ON anniversary_timeline_events(display_order);
CREATE INDEX IF NOT EXISTS idx_anniversary_timeline_year ON anniversary_timeline_events(year);

-- Enable RLS
ALTER TABLE anniversary_timeline_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read on anniversary_timeline_events"
  ON anniversary_timeline_events FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);

CREATE POLICY "Allow admin write on anniversary_timeline_events"
  ON anniversary_timeline_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- ============================================================================
-- TABLE 4: anniversary_videos (Video Gallery)
-- ============================================================================
CREATE TABLE IF NOT EXISTS anniversary_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  video_url TEXT,
  year INTEGER,
  category TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anniversary_videos_order ON anniversary_videos(display_order);
CREATE INDEX IF NOT EXISTS idx_anniversary_videos_category ON anniversary_videos(category);
CREATE INDEX IF NOT EXISTS idx_anniversary_videos_year ON anniversary_videos(year);

-- Enable RLS
ALTER TABLE anniversary_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read on anniversary_videos"
  ON anniversary_videos FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);

CREATE POLICY "Allow admin write on anniversary_videos"
  ON anniversary_videos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- ============================================================================
-- TABLE 5: anniversary_audio_memories (Audio Memories)
-- ============================================================================
CREATE TABLE IF NOT EXISTS anniversary_audio_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  speaker_name TEXT,
  year INTEGER,
  duration TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anniversary_audio_order ON anniversary_audio_memories(display_order);
CREATE INDEX IF NOT EXISTS idx_anniversary_audio_year ON anniversary_audio_memories(year);

-- Enable RLS
ALTER TABLE anniversary_audio_memories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read on anniversary_audio_memories"
  ON anniversary_audio_memories FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);

CREATE POLICY "Allow admin write on anniversary_audio_memories"
  ON anniversary_audio_memories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- ============================================================================
-- TABLE 6: anniversary_photos (Photo Collection)
-- ============================================================================
CREATE TABLE IF NOT EXISTS anniversary_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  year INTEGER,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anniversary_photos_order ON anniversary_photos(display_order);
CREATE INDEX IF NOT EXISTS idx_anniversary_photos_category ON anniversary_photos(category);
CREATE INDEX IF NOT EXISTS idx_anniversary_photos_year ON anniversary_photos(year);

-- Enable RLS
ALTER TABLE anniversary_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read on anniversary_photos"
  ON anniversary_photos FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);

CREATE POLICY "Allow admin write on anniversary_photos"
  ON anniversary_photos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- ============================================================================
-- TABLE 7: anniversary_form_config (Memory Form Configuration - Single Row)
-- ============================================================================
CREATE TABLE IF NOT EXISTS anniversary_form_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_title TEXT NOT NULL DEFAULT 'Partagez Vos Souvenirs',
  section_description TEXT NOT NULL DEFAULT 'Vous avez des souvenirs avec Le Bon Tempérament ? Partagez-les avec nous !',
  name_label TEXT DEFAULT 'Votre nom',
  email_label TEXT DEFAULT 'Votre email',
  message_label TEXT DEFAULT 'Votre souvenir',
  year_label TEXT DEFAULT 'Année (optionnel)',
  submit_button_text TEXT DEFAULT 'Partager mon souvenir',
  success_message TEXT DEFAULT 'Merci pour votre partage ! Il sera publié après modération.',
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one row allowed (singleton pattern)
CREATE UNIQUE INDEX IF NOT EXISTS idx_anniversary_form_singleton ON anniversary_form_config ((TRUE));

-- Enable RLS
ALTER TABLE anniversary_form_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read on anniversary_form_config"
  ON anniversary_form_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow admin write on anniversary_form_config"
  ON anniversary_form_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- ============================================================================
-- TABLE 8: anniversary_memories (User Submissions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS anniversary_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  year INTEGER,
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anniversary_memories_approved ON anniversary_memories(is_approved);
CREATE INDEX IF NOT EXISTS idx_anniversary_memories_created ON anniversary_memories(created_at DESC);

-- Enable RLS
ALTER TABLE anniversary_memories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow anon insert on anniversary_memories"
  ON anniversary_memories FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow admin read on anniversary_memories"
  ON anniversary_memories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Allow admin update on anniversary_memories"
  ON anniversary_memories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- ============================================================================
-- TRIGGERS: Auto-update updated_at timestamp
-- ============================================================================

-- Reuse the existing update_updated_at_column function from feature_flags migration

CREATE TRIGGER update_anniversary_hero_updated_at
  BEFORE UPDATE ON anniversary_hero
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anniversary_nav_cards_updated_at
  BEFORE UPDATE ON anniversary_navigation_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anniversary_timeline_updated_at
  BEFORE UPDATE ON anniversary_timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anniversary_videos_updated_at
  BEFORE UPDATE ON anniversary_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anniversary_audio_updated_at
  BEFORE UPDATE ON anniversary_audio_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anniversary_photos_updated_at
  BEFORE UPDATE ON anniversary_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anniversary_form_config_updated_at
  BEFORE UPDATE ON anniversary_form_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anniversary_memories_updated_at
  BEFORE UPDATE ON anniversary_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: Insert existing hardcoded content
-- ============================================================================

-- Seed Hero Section
INSERT INTO anniversary_hero (hero_number, hero_subtitle, description)
VALUES (
  '40',
  'Années de Passion Musicale',
  'Célébrons quatre décennies d''excellence musicale, de moments partagés et de passion pour la musique baroque.'
)
ON CONFLICT DO NOTHING;

-- Seed Navigation Cards
INSERT INTO anniversary_navigation_cards (title, description, icon_name, target_section_id, display_order)
VALUES
  ('Notre Histoire', 'Parcourez 40 ans de moments marquants du Bon Tempérament', 'FaHistory', 'timeline', 1),
  ('Vidéos', 'Revivez nos concerts et témoignages', 'FaVideo', 'videos', 2),
  ('Mémoires Audio', 'Écoutez nos souvenirs sonores', 'FaHeadphones', 'audio', 3),
  ('Galerie Photo', 'Explorez nos archives visuelles', 'FaImages', 'photos', 4),
  ('Témoignages', 'Partagez vos souvenirs avec nous', 'FaHeart', 'memories', 5)
ON CONFLICT DO NOTHING;

-- Seed Timeline Events
INSERT INTO anniversary_timeline_events (year, title, description, icon_name, display_order)
VALUES
  (1984, 'La Création', 'Un dimanche de novembre 1984, Simone Duclos réunit une poignée de passionnés dans la salle paroissiale de Saverne. Le premier concert, donné dans l''église Saint-Georges, rassemble 80 personnes. Personne n''imaginait alors que cette aventure durerait 40 ans.', 'FaMusic', 1),
  (1990, 'Premier Enregistrement', 'Sortie du premier CD « Vivaldi : Les Quatre Saisons » enregistré dans l''église de Marmoutier. L''ingénieur du son se souvient encore de la difficulté à capturer l''acoustique particulière du lieu. Ce disque marque notre entrée dans l''ère de la diffusion musicale.', 'FaTrophy', 2),
  (1995, 'Première Tournée', 'Notre première tournée en Allemagne, à Fribourg-en-Brisgau. Le trajet en minibus, les répétitions dans des salles inconnues, l''accueil chaleureux du public allemand... Une expérience qui a forgé notre identité d''ensemble itinérant.', 'FaUsers', 3),
  (2000, 'Le Nouveau Millénaire', 'Concert du millénaire à la cathédrale de Strasbourg. Plus de 500 personnes, un répertoire allant de Monteverdi à Bach. Ce soir-là, nous avons compris que notre mission dépassait le simple plaisir de jouer ensemble.', 'FaCalendarAlt', 4),
  (2010, 'Les 25 Ans', 'Célébration des 25 ans avec un concert réunissant tous les anciens membres. Certains n''avaient pas joué depuis 15 ans, mais la complicité était intacte. Un moment d''émotion pure, avec des larmes dans les yeux et des rires dans les coulisses.', 'FaTrophy', 5),
  (2020, 'L''Adaptation', 'Le confinement nous pousse à innover : répétitions en visio, concerts diffusés en ligne depuis l''église vide. Une période difficile mais qui a renforcé notre détermination. Le premier concert post-confinement, en juin 2021, restera gravé dans nos mémoires.', 'FaMusic', 6),
  (2024, '40 Ans de Passion', 'Aujourd''hui, nous célébrons 40 ans d''une aventure humaine exceptionnelle. Des milliers d''heures de répétition, des centaines de concerts, des amitiés indéfectibles. Le Bon Tempérament, c''est bien plus qu''un ensemble : c''est une famille musicale qui continue de grandir.', 'FaTrophy', 7)
ON CONFLICT DO NOTHING;

-- Seed Form Configuration
INSERT INTO anniversary_form_config (section_title, section_description)
VALUES (
  'Partagez Vos Souvenirs',
  'Vous avez des souvenirs avec Le Bon Tempérament ? Un concert qui vous a marqué, une rencontre, une émotion ? Partagez votre témoignage avec nous !'
)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT ON anniversary_hero TO anon, authenticated;
GRANT SELECT ON anniversary_navigation_cards TO anon, authenticated;
GRANT SELECT ON anniversary_timeline_events TO anon, authenticated;
GRANT SELECT ON anniversary_videos TO anon, authenticated;
GRANT SELECT ON anniversary_audio_memories TO anon, authenticated;
GRANT SELECT ON anniversary_photos TO anon, authenticated;
GRANT SELECT ON anniversary_form_config TO anon, authenticated;
GRANT INSERT ON anniversary_memories TO anon;
