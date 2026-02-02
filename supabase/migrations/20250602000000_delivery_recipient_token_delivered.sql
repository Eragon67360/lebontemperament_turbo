-- Migration: Per-recipient token and delivered state
-- Description: Add public_token (unique shareable link) and delivered_at to delivery_recipients.

-- ============================================================================
-- ALTER TABLE: delivery_recipients
-- ============================================================================
-- Add public_token (nullable first for backfill, then set NOT NULL)
ALTER TABLE delivery_recipients ADD COLUMN IF NOT EXISTS public_token TEXT NULL;
ALTER TABLE delivery_recipients ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ NULL;

-- Backfill existing rows with unique tokens
UPDATE delivery_recipients
SET public_token = gen_random_uuid()::text
WHERE public_token IS NULL;

-- Enforce NOT NULL and UNIQUE
ALTER TABLE delivery_recipients ALTER COLUMN public_token SET NOT NULL;
ALTER TABLE delivery_recipients ADD CONSTRAINT delivery_recipients_public_token_key UNIQUE (public_token);

-- Unique constraint provides index for fast lookup by token (anon clients resolve by token)
