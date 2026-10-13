-- Orders for the association's sales (« Commandes »): the cheese and
-- saucisson sale of November 2026 first. Superadmins only, in the admin and in
-- the app. A sale (`order_sales`) has its own catalogue (`order_products`,
-- prices in cents) so the next sale starts from a copy and can change its
-- prices. Each order (`orders`) is one buyer with the quantities they want
-- (`order_items`) and what they paid so far (`order_payments`, several per
-- order: virement, espèces, chèque). Totals are computed by the clients
-- (@repo/domain/utils/orders and the app's twin), never stored.
--
-- Delivery rounds: `add_sale_orders_to_delivery` copies the buyers to be
-- delivered into a driver's round (`delivery_recipients`), so nobody retypes
-- addresses; later edits of a buyer follow into the round until delivered.
--
-- Personal data: 30 days after the sale's delivery day, buyers' names, phones,
-- addresses and notes are erased (pg_cron, like delivery rounds); quantities
-- and payments stay as anonymous totals.
--
-- Seeds the November 2026 sale with the prices of the paper order form.
--
-- Rollback (removes every order, payment and catalogue):
--   SELECT cron.unschedule('purge-order-personal-data');
--   DROP FUNCTION IF EXISTS public.purge_expired_order_personal_data();
--   DROP FUNCTION IF EXISTS public.add_sale_orders_to_delivery(uuid, uuid);
--   DROP FUNCTION IF EXISTS public.save_order(uuid, uuid, jsonb, jsonb);
--   DROP FUNCTION IF EXISTS public.copy_order_sale(uuid, text);
--   DROP TABLE IF EXISTS public.order_payments, public.order_items,
--     public.orders, public.order_products, public.order_sales;
--   DROP FUNCTION IF EXISTS public.orders_follow_into_round();
--   DROP FUNCTION IF EXISTS public.order_items_same_sale();
--   DROP FUNCTION IF EXISTS public.normalize_order_phone(text);
--   DROP FUNCTION IF EXISTS public.is_superadmin();

-- 1. Helpers --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
     WHERE id = (SELECT auth.uid()) AND role = 'superadmin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_superadmin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated, service_role;

-- French numbers as typed on paper (« 06 12 34 56 78 ») to the international
-- form Twilio needs (« +33612345678 »). Anything else is kept without spaces.
CREATE OR REPLACE FUNCTION public.normalize_order_phone(p_phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN d IS NULL OR d = '' THEN NULL
    WHEN d ~ '^0[1-9][0-9]{8}$' THEN '+33' || substr(d, 2)
    WHEN d ~ '^0033[1-9][0-9]{8}$' THEN '+' || substr(d, 3)
    WHEN d ~ '^00[1-9][0-9]{6,14}$' THEN '+' || substr(d, 3)
    ELSE d
  END
  FROM (SELECT regexp_replace(coalesce(p_phone, ''), '[\s.\-()/]', '', 'g') AS d) s;
$$;

GRANT EXECUTE ON FUNCTION public.normalize_order_phone(text)
  TO authenticated, service_role;

-- 2. Tables ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.order_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  order_deadline date,
  delivery_date date,
  archived_at timestamptz,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.order_sales IS
  'A sale (« vente »), e.g. the November cheese sale: its catalogue, orders and payments. Superadmins only.';

CREATE TABLE IF NOT EXISTS public.order_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.order_sales (id) ON DELETE CASCADE,
  category text NOT NULL CHECK (char_length(btrim(category)) BETWEEN 1 AND 60),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  variant text CHECK (variant IS NULL OR char_length(variant) <= 60),
  supplier text CHECK (supplier IS NULL OR char_length(supplier) <= 120),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents BETWEEN 0 AND 100000),
  display_order integer NOT NULL DEFAULT 0,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.order_products.variant IS
  'Weight, flavour or size shown after the name: « 500 g », « Ail · 250 g », « 3/4 pers. ».';
COMMENT ON COLUMN public.order_products.is_available IS
  'False hides the product from new orders without touching the orders that have it.';

CREATE INDEX IF NOT EXISTS order_products_sale_idx
  ON public.order_products (sale_id, display_order);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.order_sales (id) ON DELETE CASCADE,
  buyer_name text NOT NULL CHECK (char_length(btrim(buyer_name)) BETWEEN 1 AND 120),
  buyer_phone text CHECK (buyer_phone IS NULL OR char_length(buyer_phone) <= 40),
  buyer_address text CHECK (buyer_address IS NULL OR char_length(buyer_address) <= 300),
  sold_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  fulfilment text NOT NULL DEFAULT 'delivery'
    CHECK (fulfilment IN ('delivery', 'pickup')),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 1000),
  delivery_recipient_id uuid
    REFERENCES public.delivery_recipients (id) ON DELETE SET NULL,
  handed_over_at timestamptz,
  personal_data_erased_at timestamptz,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.orders.sold_by IS
  'The member who took the order (« vendu par »), if any.';
COMMENT ON COLUMN public.orders.fulfilment IS
  '« delivery »: delivered in a round; « pickup »: the buyer collects it (« retrait »).';
COMMENT ON COLUMN public.orders.delivery_recipient_id IS
  'The stop created for this order by add_sale_orders_to_delivery.';
COMMENT ON COLUMN public.orders.handed_over_at IS
  'When the order was handed over (« remise »), whatever the way.';

CREATE INDEX IF NOT EXISTS orders_sale_idx ON public.orders (sale_id);
CREATE INDEX IF NOT EXISTS orders_recipient_idx
  ON public.orders (delivery_recipient_id) WHERE delivery_recipient_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.order_products (id),
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 999),
  UNIQUE (order_id, product_id)
);

CREATE INDEX IF NOT EXISTS order_items_product_idx ON public.order_items (product_id);

CREATE TABLE IF NOT EXISTS public.order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  amount_cents integer NOT NULL
    CHECK (amount_cents <> 0 AND amount_cents BETWEEN -100000 AND 100000),
  method text NOT NULL CHECK (method IN ('transfer', 'cash', 'cheque')),
  paid_on date NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Paris')::date,
  note text CHECK (note IS NULL OR char_length(note) <= 300),
  recorded_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.order_payments.amount_cents IS
  'Received amount in cents; negative for a refund.';

CREATE INDEX IF NOT EXISTS order_payments_order_idx ON public.order_payments (order_id);

-- 3. Rules ----------------------------------------------------------------------

-- An order only holds products of its own sale.
CREATE OR REPLACE FUNCTION public.order_items_same_sale()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM orders o JOIN order_products p ON p.sale_id = o.sale_id
     WHERE o.id = NEW.order_id AND p.id = NEW.product_id
  ) THEN
    RAISE EXCEPTION 'Ce produit n''appartient pas à cette vente'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_items_same_sale ON public.order_items;
CREATE TRIGGER order_items_same_sale
  BEFORE INSERT OR UPDATE OF order_id, product_id ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.order_items_same_sale();

-- A buyer's new name, phone or address follows into their stop while it is
-- not delivered yet (a new address loses its map position, which the app
-- finds again).
CREATE OR REPLACE FUNCTION public.orders_follow_into_round()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.delivery_recipient_id IS NOT NULL
     AND NEW.personal_data_erased_at IS NULL
     AND (NEW.buyer_name, NEW.buyer_phone, NEW.buyer_address)
         IS DISTINCT FROM (OLD.buyer_name, OLD.buyer_phone, OLD.buyer_address) THEN
    UPDATE delivery_recipients r
       SET label = NEW.buyer_name,
           phone_number = public.normalize_order_phone(NEW.buyer_phone),
           address = NEW.buyer_address,
           latitude = CASE WHEN NEW.buyer_address IS DISTINCT FROM OLD.buyer_address
                           THEN NULL ELSE r.latitude END,
           longitude = CASE WHEN NEW.buyer_address IS DISTINCT FROM OLD.buyer_address
                            THEN NULL ELSE r.longitude END
     WHERE r.id = NEW.delivery_recipient_id
       AND r.delivered_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_follow_into_round ON public.orders;
CREATE TRIGGER orders_follow_into_round
  AFTER UPDATE OF buyer_name, buyer_phone, buyer_address ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_follow_into_round();

DROP TRIGGER IF EXISTS order_sales_updated_at ON public.order_sales;
CREATE TRIGGER order_sales_updated_at
  BEFORE UPDATE ON public.order_sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS order_products_updated_at ON public.order_products;
CREATE TRIGGER order_products_updated_at
  BEFORE UPDATE ON public.order_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Access: superadmins only ---------------------------------------------------

ALTER TABLE public.order_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order sales: superadmins" ON public.order_sales;
CREATE POLICY "Order sales: superadmins" ON public.order_sales
  FOR ALL TO authenticated
  USING ((SELECT public.is_superadmin()))
  WITH CHECK ((SELECT public.is_superadmin()));

DROP POLICY IF EXISTS "Order products: superadmins" ON public.order_products;
CREATE POLICY "Order products: superadmins" ON public.order_products
  FOR ALL TO authenticated
  USING ((SELECT public.is_superadmin()))
  WITH CHECK ((SELECT public.is_superadmin()));

DROP POLICY IF EXISTS "Orders: superadmins" ON public.orders;
CREATE POLICY "Orders: superadmins" ON public.orders
  FOR ALL TO authenticated
  USING ((SELECT public.is_superadmin()))
  WITH CHECK ((SELECT public.is_superadmin()));

DROP POLICY IF EXISTS "Order items: superadmins" ON public.order_items;
CREATE POLICY "Order items: superadmins" ON public.order_items
  FOR ALL TO authenticated
  USING ((SELECT public.is_superadmin()))
  WITH CHECK ((SELECT public.is_superadmin()));

DROP POLICY IF EXISTS "Order payments: superadmins" ON public.order_payments;
CREATE POLICY "Order payments: superadmins" ON public.order_payments
  FOR ALL TO authenticated
  USING ((SELECT public.is_superadmin()))
  WITH CHECK ((SELECT public.is_superadmin()));

REVOKE ALL ON TABLE public.order_sales, public.order_products, public.orders,
  public.order_items, public.order_payments FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.order_sales,
  public.order_products, public.orders, public.order_items,
  public.order_payments TO authenticated;
GRANT ALL ON TABLE public.order_sales, public.order_products, public.orders,
  public.order_items, public.order_payments TO service_role;

-- 5. Functions for both clients -------------------------------------------------
-- SECURITY INVOKER: the policies above decide; the explicit check only gives a
-- clear message.

-- A new sale with a copy of another sale's catalogue (no orders).
CREATE OR REPLACE FUNCTION public.copy_order_sale(p_sale_id uuid, p_title text)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _new_id uuid;
BEGIN
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Réservé aux superadmins' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM order_sales WHERE id = p_sale_id) THEN
    RAISE EXCEPTION 'Vente introuvable' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO order_sales (title, created_by)
  VALUES (btrim(p_title), auth.uid())
  RETURNING id INTO _new_id;

  INSERT INTO order_products (sale_id, category, name, variant, supplier,
                              unit_price_cents, display_order, is_available)
  SELECT _new_id, category, name, variant, supplier, unit_price_cents,
         display_order, is_available
    FROM order_products
   WHERE sale_id = p_sale_id;

  RETURN _new_id;
END;
$$;

-- Creates (p_order_id null) or replaces one order and its quantities in one
-- go. p_order: { buyer_name, buyer_phone, buyer_address, sold_by, fulfilment,
-- notes }; p_items: [{ product_id, quantity }], quantities of 0 are dropped.
CREATE OR REPLACE FUNCTION public.save_order(
  p_sale_id uuid,
  p_order_id uuid,
  p_order jsonb,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _id uuid := p_order_id;
  _items jsonb := coalesce(p_items, '[]'::jsonb);
BEGIN
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Réservé aux superadmins' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(_items) <> 'array' THEN
    RAISE EXCEPTION 'p_items doit être une liste' USING ERRCODE = '22023';
  END IF;

  IF _id IS NULL THEN
    INSERT INTO orders (sale_id, buyer_name, buyer_phone, buyer_address,
                        sold_by, fulfilment, notes, created_by)
    VALUES (
      p_sale_id,
      btrim(p_order->>'buyer_name'),
      nullif(btrim(p_order->>'buyer_phone'), ''),
      nullif(btrim(p_order->>'buyer_address'), ''),
      nullif(p_order->>'sold_by', '')::uuid,
      coalesce(nullif(p_order->>'fulfilment', ''), 'delivery'),
      nullif(btrim(p_order->>'notes'), ''),
      auth.uid()
    )
    RETURNING id INTO _id;
  ELSE
    UPDATE orders
       SET buyer_name = btrim(p_order->>'buyer_name'),
           buyer_phone = nullif(btrim(p_order->>'buyer_phone'), ''),
           buyer_address = nullif(btrim(p_order->>'buyer_address'), ''),
           sold_by = nullif(p_order->>'sold_by', '')::uuid,
           fulfilment = coalesce(nullif(p_order->>'fulfilment', ''), 'delivery'),
           notes = nullif(btrim(p_order->>'notes'), '')
     WHERE id = _id AND sale_id = p_sale_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Commande introuvable' USING ERRCODE = 'P0002';
    END IF;
  END IF;

  DELETE FROM order_items oi
   WHERE oi.order_id = _id
     AND NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(_items) e
        WHERE (e->>'product_id')::uuid = oi.product_id
          AND (e->>'quantity')::int > 0
     );

  INSERT INTO order_items (order_id, product_id, quantity)
  SELECT _id, (e->>'product_id')::uuid, (e->>'quantity')::int
    FROM jsonb_array_elements(_items) e
   WHERE (e->>'quantity')::int > 0
  ON CONFLICT (order_id, product_id)
  DO UPDATE SET quantity = EXCLUDED.quantity;

  RETURN _id;
END;
$$;

-- Adds the sale's buyers to be delivered (with an address, not yet in a
-- round) to the driver's current round: the same round the app opens (their
-- latest one while it still has stops to deliver or none at all), or a new
-- one. Returns { delivery_id, added, without_address }.
CREATE OR REPLACE FUNCTION public.add_sale_orders_to_delivery(
  p_sale_id uuid,
  p_driver_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _driver uuid := coalesce(p_driver_id, auth.uid());
  _delivery_id uuid;
  _next_sort integer;
  _added integer := 0;
  _without_address integer;
  _order record;
  _recipient_id uuid;
BEGIN
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Réservé aux superadmins' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = _driver AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Le livreur doit être superadmin' USING ERRCODE = '22023';
  END IF;

  SELECT d.id INTO _delivery_id
    FROM deliveries d
   WHERE d.driver_id = _driver
   ORDER BY d.created_at DESC
   LIMIT 1;

  IF _delivery_id IS NOT NULL AND EXISTS (
       SELECT 1 FROM delivery_recipients r
        WHERE r.delivery_id = _delivery_id AND r.delivered_at IS NOT NULL
     ) AND NOT EXISTS (
       SELECT 1 FROM delivery_recipients r
        WHERE r.delivery_id = _delivery_id AND r.delivered_at IS NULL
     ) THEN
    _delivery_id := NULL; -- that round is finished
  END IF;

  IF _delivery_id IS NULL THEN
    INSERT INTO deliveries (driver_id, public_token, expires_at, is_tracking_active)
    VALUES (_driver, gen_random_uuid()::text, now() + interval '1 day', false)
    RETURNING id INTO _delivery_id;
  END IF;

  SELECT coalesce(max(sort_order) + 1, 0) INTO _next_sort
    FROM delivery_recipients WHERE delivery_id = _delivery_id;

  FOR _order IN
    SELECT o.id, o.buyer_name, o.buyer_phone, o.buyer_address
      FROM orders o
     WHERE o.sale_id = p_sale_id
       AND o.fulfilment = 'delivery'
       AND o.delivery_recipient_id IS NULL
       AND o.personal_data_erased_at IS NULL
       AND nullif(btrim(o.buyer_address), '') IS NOT NULL
     ORDER BY o.buyer_name, o.created_at
  LOOP
    INSERT INTO delivery_recipients (delivery_id, label, sort_order, public_token,
                                     address, phone_number)
    VALUES (_delivery_id, _order.buyer_name, _next_sort, gen_random_uuid()::text,
            _order.buyer_address, public.normalize_order_phone(_order.buyer_phone))
    RETURNING id INTO _recipient_id;

    UPDATE orders SET delivery_recipient_id = _recipient_id WHERE id = _order.id;
    _next_sort := _next_sort + 1;
    _added := _added + 1;
  END LOOP;

  SELECT count(*) INTO _without_address
    FROM orders o
   WHERE o.sale_id = p_sale_id
     AND o.fulfilment = 'delivery'
     AND o.delivery_recipient_id IS NULL
     AND o.personal_data_erased_at IS NULL;

  RETURN jsonb_build_object(
    'delivery_id', _delivery_id,
    'added', _added,
    'without_address', _without_address
  );
END;
$$;

REVOKE ALL ON FUNCTION public.copy_order_sale(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_order(uuid, uuid, jsonb, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.add_sale_orders_to_delivery(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.copy_order_sale(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_order(uuid, uuid, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_sale_orders_to_delivery(uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.order_items_same_sale() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.orders_follow_into_round() FROM PUBLIC, anon, authenticated;

-- 6. Personal data: erased 30 days after delivery day ---------------------------

CREATE OR REPLACE FUNCTION public.purge_expired_order_personal_data()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _orders integer;
BEGIN
  UPDATE orders o
     SET buyer_name = 'Acheteur',
         buyer_phone = NULL,
         buyer_address = NULL,
         notes = NULL,
         personal_data_erased_at = now()
    FROM order_sales s
   WHERE o.sale_id = s.id
     AND o.personal_data_erased_at IS NULL
     AND coalesce(s.delivery_date, s.created_at::date) < current_date - 30;
  GET DIAGNOSTICS _orders = ROW_COUNT;

  UPDATE order_payments p
     SET note = NULL
    FROM orders o
   WHERE p.order_id = o.id
     AND o.personal_data_erased_at IS NOT NULL
     AND p.note IS NOT NULL;

  RETURN _orders;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_order_personal_data()
  FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-order-personal-data') THEN
    PERFORM cron.unschedule('purge-order-personal-data');
  END IF;
END;
$$;

SELECT cron.schedule(
  'purge-order-personal-data',
  '35 3 * * *',
  $$ SELECT public.purge_expired_order_personal_data(); $$
);

-- 7. The November 2026 sale, from the paper order form ---------------------------

DO $$
DECLARE
  _sale uuid;
  _cheese constant text := 'Fruitière de Noël-Cerneux';
  _sausage constant text := 'Salaison des Monts du Lyonnais';
BEGIN
  IF EXISTS (SELECT 1 FROM public.order_sales) THEN
    RETURN;
  END IF;

  INSERT INTO public.order_sales (title, order_deadline, delivery_date)
  VALUES ('Fromages et saucissons · novembre 2026', '2026-11-13', '2026-11-27')
  RETURNING id INTO _sale;

  INSERT INTO public.order_products
    (sale_id, category, name, variant, supplier, unit_price_cents, display_order)
  VALUES
    (_sale, 'Fromages et charcuterie', 'Comté fruité (9/10 mois)', '500 g', _cheese, 1100, 10),
    (_sale, 'Fromages et charcuterie', 'Comté fruité (9/10 mois)', '1 kg', _cheese, 1900, 20),
    (_sale, 'Fromages et charcuterie', 'Comté vieux (14/15 mois)', '500 g', _cheese, 1200, 30),
    (_sale, 'Fromages et charcuterie', 'Comté vieux (14/15 mois)', '1 kg', _cheese, 2100, 40),
    (_sale, 'Fromages et charcuterie', 'Raclette', '500 g', _cheese, 900, 50),
    (_sale, 'Fromages et charcuterie', 'Raclette', '1 kg', _cheese, 1700, 60),
    (_sale, 'Fromages et charcuterie', 'Morbier', '500 g', _cheese, 800, 70),
    (_sale, 'Fromages et charcuterie', 'Morbier', '1 kg', _cheese, 1600, 80),
    (_sale, 'Fromages et charcuterie', 'Bleu de Gex', '500 g', _cheese, 850, 90),
    (_sale, 'Fromages et charcuterie', 'Bleu de Gex', '1 kg', _cheese, 1600, 100),
    (_sale, 'Fromages et charcuterie', 'Cancoillotte', 'Ail · 250 g', _cheese, 400, 110),
    (_sale, 'Fromages et charcuterie', 'Cancoillotte', 'Nature · 250 g', _cheese, 400, 120),
    (_sale, 'Fromages et charcuterie', 'Cancoillotte', 'Vin jaune · 250 g', _cheese, 400, 130),
    (_sale, 'Fromages et charcuterie', 'Mont d’Or', '470 g', _cheese, 1200, 140),
    (_sale, 'Fromages et charcuterie', 'Mont d’Or', '670 g', _cheese, 1500, 150),
    (_sale, 'Fromages et charcuterie', 'Sachet de fondue suisse', '400 g', _cheese, 1200, 160),
    (_sale, 'Fromages et charcuterie', 'Saucisse de Morteau', '400 g', _cheese, 1100, 170),
    (_sale, 'Fromages et charcuterie', 'Assiette charcuterie spéciale raclette', '3/4 pers.', _cheese, 1200, 180),
    (_sale, 'Saucissons', 'Saucisson', 'Nature', _sausage, 400, 210),
    (_sale, 'Saucissons', 'Saucisson', 'Fumé', _sausage, 400, 220),
    (_sale, 'Saucissons', 'Saucisson', 'Noix', _sausage, 400, 230),
    (_sale, 'Saucissons', 'Saucisson', 'Noisettes', _sausage, 400, 240),
    (_sale, 'Saucissons', 'Saucisson', 'Sanglier', _sausage, 400, 250),
    (_sale, 'Saucissons', 'Saucisson', 'Châtaignes', _sausage, 400, 260),
    (_sale, 'Saucissons', 'Saucisson', 'Cèpes', _sausage, 400, 270),
    (_sale, 'Saucissons', 'Saucisson', 'Taureau', _sausage, 400, 280),
    (_sale, 'Saucissons', 'Saucisson', 'Chorizo', _sausage, 400, 290),
    (_sale, 'Saucissons', 'Saucisson', 'Herbes de Provence', _sausage, 400, 300),
    (_sale, 'Saucissons', 'Saucisson', 'Poivre enrobé', _sausage, 400, 310),
    (_sale, 'Saucissons', 'Saucisson', 'Ail', _sausage, 400, 320),
    (_sale, 'Saucissons', 'Saucisson', 'Provençal', _sausage, 400, 330),
    (_sale, 'Saucissons', 'Saucisson', 'Piment d’Espelette', _sausage, 400, 340),
    (_sale, 'Saucissons', 'Saucisson', 'Figues', _sausage, 400, 350),
    (_sale, 'Saucissons', 'Saucisson', 'Comté', _sausage, 400, 360),
    (_sale, 'Saucissons', 'Saucisson', 'Roquefort', _sausage, 400, 370),
    (_sale, 'Saucissons', 'Saucisson', 'Fromage de chèvre', _sausage, 400, 380);
END;
$$;
