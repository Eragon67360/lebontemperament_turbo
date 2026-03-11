-- Migration: Donations and Donors tables for French non-profit tax receipts
-- Le Bon Tempérament - Reçu fiscal (Article 200 CGI)

-- ============================================================================
-- TABLE: donors
-- ============================================================================
CREATE TABLE IF NOT EXISTS donors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'FR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donors_email ON donors(email);

-- ============================================================================
-- TABLE: donation_receipt_seq (sequential receipt numbers, concurrent-safe)
-- ============================================================================
CREATE TABLE IF NOT EXISTS donation_receipt_seq (
  year INT PRIMARY KEY,
  next_val INT NOT NULL DEFAULT 1
);

-- ============================================================================
-- FUNCTION: get_next_receipt_number
-- Returns format "2024-001", "2024-002", etc.
-- Called only after successful payment (webhook)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_next_receipt_number(p_year INT)
RETURNS TEXT AS $$
  DECLARE
    v_num INT;
  BEGIN
    INSERT INTO donation_receipt_seq (year, next_val)
    VALUES (p_year, 1)
    ON CONFLICT (year) DO UPDATE SET next_val = donation_receipt_seq.next_val + 1
    RETURNING next_val INTO v_num;
    RETURN p_year::TEXT || '-' || LPAD(v_num::TEXT, 3, '0');
  END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: donations
-- ============================================================================
CREATE TABLE IF NOT EXISTS donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE RESTRICT,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT UNIQUE NOT NULL,
  amount_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  receipt_number TEXT NOT NULL UNIQUE,
  pdf_storage_path TEXT,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_stripe_checkout_session ON donations(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_donations_receipt_number ON donations(receipt_number);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_receipt_seq ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Donors: service role only (webhook uses admin client)
CREATE POLICY "Service role can manage donors"
  ON donors
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- donation_receipt_seq: service role only (RPC called by webhook)
CREATE POLICY "Service role can manage receipt seq"
  ON donation_receipt_seq
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Donations: service role only (webhook uses admin client)
CREATE POLICY "Service role can manage donations"
  ON donations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STORAGE BUCKET: donation-receipts
-- Note: Bucket creation may need to be done via Supabase Dashboard if
-- storage.buckets insert requires special permissions.
-- RLS policies for service_role upload are below.
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('donation-receipts', 'donation-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Service role can upload PDFs to donation-receipts
CREATE POLICY "Service role can upload donation receipts"
  ON storage.objects
  FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'donation-receipts');

-- Policy: Service role can read donation receipts
CREATE POLICY "Service role can read donation receipts"
  ON storage.objects
  FOR SELECT
  TO service_role
  USING (bucket_id = 'donation-receipts');
