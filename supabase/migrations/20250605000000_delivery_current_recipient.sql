-- Migration: Current recipient (in progress) and optional scheduled time per recipient
-- Description: Add current_recipient_id to deliveries; make delivery_recipients.scheduled_at nullable.

-- ============================================================================
-- ALTER TABLE: delivery_recipients (scheduled_at optional)
-- ============================================================================
ALTER TABLE delivery_recipients ALTER COLUMN scheduled_at DROP NOT NULL;

-- ============================================================================
-- ALTER TABLE: deliveries (who is "in progress")
-- ============================================================================
ALTER TABLE deliveries
  ADD COLUMN IF NOT EXISTS current_recipient_id UUID NULL
  REFERENCES delivery_recipients(id) ON DELETE SET NULL;
