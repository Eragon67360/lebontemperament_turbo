-- Migration: eta_arrival_sms_sent_at
-- Description: Add column to track when the "5 min away" SMS was sent to a recipient.
-- Used by check-eta-and-send-arrival-sms Edge Function to avoid duplicate SMS.

ALTER TABLE delivery_recipients
  ADD COLUMN IF NOT EXISTS eta_arrival_sms_sent_at TIMESTAMPTZ NULL;
