-- Migration: Recipient address and coordinates for route display
-- Description: Add address, latitude, longitude to delivery_recipients.

ALTER TABLE delivery_recipients
  ADD COLUMN IF NOT EXISTS address TEXT NULL,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION NULL,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION NULL;
