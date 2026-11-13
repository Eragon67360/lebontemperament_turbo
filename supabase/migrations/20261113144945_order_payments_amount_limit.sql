-- Raise the per-payment limit on cheese orders from 1 000 € to 100 000 €.
--
-- 20261013222527_orders.sql capped public.order_payments.amount_cents at
-- ±100 000 cents (1 000 €) with an unnamed column check, which Postgres names
-- order_payments_amount_cents_check. Some buyers pay more than that in one go,
-- so the admin refused their payment. The new limit is ±10 000 000 cents
-- (100 000 €): high enough for any real sale, still a guard against a typo
-- with too many zeros. Zero stays refused (a payment is money in or out).
--
-- Backward compatible: the check only gets wider, every existing row already
-- passes it, and older admin and app builds keep their own 1 000 € form check.
-- Product prices (order_products.unit_price_cents, 0 to 1 000 €) do not change.
--
-- Rollback (only if no payment above 1 000 € was recorded since):
--   ALTER TABLE public.order_payments
--     DROP CONSTRAINT IF EXISTS order_payments_amount_cents_check;
--   ALTER TABLE public.order_payments
--     ADD CONSTRAINT order_payments_amount_cents_check
--     CHECK (amount_cents <> 0 AND amount_cents BETWEEN -100000 AND 100000);

ALTER TABLE public.order_payments
  DROP CONSTRAINT IF EXISTS order_payments_amount_cents_check;

ALTER TABLE public.order_payments
  ADD CONSTRAINT order_payments_amount_cents_check
  CHECK (amount_cents <> 0 AND amount_cents BETWEEN -10000000 AND 10000000);
