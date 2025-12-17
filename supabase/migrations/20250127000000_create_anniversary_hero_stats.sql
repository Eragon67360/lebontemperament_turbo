-- Create anniversary hero stats table
CREATE TABLE IF NOT EXISTS public.anniversary_hero_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon_name VARCHAR(50) NOT NULL,
  number VARCHAR(20) NOT NULL,
  label VARCHAR(100) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.anniversary_hero_stats ENABLE ROW LEVEL SECURITY;

-- Allow public to read visible stats
CREATE POLICY "Allow public read access to visible hero stats"
  ON public.anniversary_hero_stats
  FOR SELECT
  USING (is_visible = true);

-- Allow authenticated users with admin/superadmin role to manage
CREATE POLICY "Allow admin/superadmin to insert hero stats"
  ON public.anniversary_hero_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Allow admin/superadmin to update hero stats"
  ON public.anniversary_hero_stats
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Allow admin/superadmin to delete hero stats"
  ON public.anniversary_hero_stats
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'superadmin')
    )
  );

-- Create indexes
CREATE INDEX idx_anniversary_hero_stats_visible ON public.anniversary_hero_stats(is_visible);
CREATE INDEX idx_anniversary_hero_stats_order ON public.anniversary_hero_stats(display_order);

-- Add updated_at trigger
CREATE TRIGGER update_anniversary_hero_stats_updated_at
  BEFORE UPDATE ON public.anniversary_hero_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime (optional, for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.anniversary_hero_stats;

-- Set replica identity for Realtime
ALTER TABLE public.anniversary_hero_stats REPLICA IDENTITY FULL;

-- Seed initial data
INSERT INTO public.anniversary_hero_stats (icon_name, number, label, display_order, is_visible) VALUES
  ('FaCalendarAlt', '40', 'Années', 1, true),
  ('FaMusic', '200+', 'Concerts', 2, true),
  ('FaUsers', '500+', 'Membres', 3, true),
  ('FaTrophy', '15+', 'CDs', 4, true);

-- Add comment
COMMENT ON TABLE public.anniversary_hero_stats IS 'Statistics cards displayed in the anniversary page hero section';
