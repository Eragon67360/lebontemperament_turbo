-- Sellers for a sale (Thomas, 2026-11-23): members who sell cheese note the
-- people they sell to and the payments they receive themselves, in the
-- admin's « Mes ventes ». A superadmin picks the sellers of each sale; a
-- seller does not need the admin role and sees nothing else of the admin.
--
-- 1. order_sale_sellers: who sells for which sale. Superadmins only (RLS).
-- 2. seller_sales(): the signed-in member's sales (not archived) as one JSON
--    list. The admin lets a member in when it is not empty.
-- 3. seller_sale(id): that sale's catalogue and the member's own orders
--    (orders.sold_by = the member), with quantities and payments.
-- 4. seller_save_order, seller_delete_order, seller_add_payment and
--    seller_delete_payment: the writes a seller may make, on their own
--    orders only. Each order they create is « vendu par » them.
--
-- The functions are SECURITY DEFINER and check auth.uid() themselves: the
-- order tables keep their superadmin-only policies, so a seller never reads
-- another seller's buyers, and the shipped app (3.0.0, superadmins only)
-- works as before.
--
-- Backward compatible: a new table and new functions; nothing existing
-- changes.
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public.seller_delete_payment(uuid);
--   DROP FUNCTION IF EXISTS public.seller_add_payment(uuid, integer, text, date, text);
--   DROP FUNCTION IF EXISTS public.seller_delete_order(uuid);
--   DROP FUNCTION IF EXISTS public.seller_save_order(uuid, uuid, jsonb, jsonb);
--   DROP FUNCTION IF EXISTS public.seller_sale(uuid);
--   DROP FUNCTION IF EXISTS public.seller_sales();
--   DROP FUNCTION IF EXISTS public.sells_for_sale(uuid);
--   DROP TABLE IF EXISTS public.order_sale_sellers;

-- 1. Sellers of a sale --------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.order_sale_sellers (
  sale_id uuid NOT NULL REFERENCES public.order_sales (id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  added_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (sale_id, member_id)
);

COMMENT ON TABLE public.order_sale_sellers IS
  'The members who sell for a sale (« Vendeurs »): they note their own buyers and payments in the admin''s « Mes ventes ». Superadmins only.';

CREATE INDEX IF NOT EXISTS order_sale_sellers_member_idx
  ON public.order_sale_sellers (member_id);

ALTER TABLE public.order_sale_sellers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order sale sellers: superadmins" ON public.order_sale_sellers;
CREATE POLICY "Order sale sellers: superadmins" ON public.order_sale_sellers
  FOR ALL TO authenticated
  USING ((SELECT public.is_superadmin()))
  WITH CHECK ((SELECT public.is_superadmin()));

REVOKE ALL ON TABLE public.order_sale_sellers FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.order_sale_sellers TO authenticated;
GRANT ALL ON TABLE public.order_sale_sellers TO service_role;

-- 2. Helper -------------------------------------------------------------------------
-- True when the signed-in member sells for this sale and the sale is not
-- archived. Internal: only the functions below call it.

CREATE OR REPLACE FUNCTION public.sells_for_sale(p_sale_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
    SELECT 1
      FROM public.order_sale_sellers ss
      JOIN public.order_sales s ON s.id = ss.sale_id
     WHERE ss.sale_id = p_sale_id
       AND ss.member_id = (SELECT auth.uid())
       AND s.archived_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.sells_for_sale(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sells_for_sale(uuid) TO service_role;

-- 3. Reads --------------------------------------------------------------------------

-- The sales the signed-in member sells for, soonest delivery first.
CREATE OR REPLACE FUNCTION public.seller_sales()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'id', s.id,
           'title', s.title,
           'order_deadline', s.order_deadline,
           'delivery_date', s.delivery_date
         ) ORDER BY s.delivery_date NULLS LAST, s.created_at), '[]'::jsonb)
    FROM public.order_sale_sellers ss
    JOIN public.order_sales s ON s.id = ss.sale_id
   WHERE (SELECT auth.uid()) IS NOT NULL
     AND ss.member_id = (SELECT auth.uid())
     AND s.archived_at IS NULL;
$$;

-- One sale for its seller: { sale, products, orders }, the orders being the
-- member's own (sold_by), each with `items` and `payments` like the admin's
-- sale page reads them.
CREATE OR REPLACE FUNCTION public.seller_sale(p_sale_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.sells_for_sale(p_sale_id) THEN
    RAISE EXCEPTION 'Vous ne vendez pas pour cette vente' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'sale', (SELECT to_jsonb(s) FROM public.order_sales s WHERE s.id = p_sale_id),
    'products', (
      SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.display_order, p.name),
                      '[]'::jsonb)
        FROM public.order_products p
       WHERE p.sale_id = p_sale_id
    ),
    'orders', (
      SELECT coalesce(jsonb_agg(
               to_jsonb(o) - 'document_key' - 'document_name'
                 - 'document_mime_type' - 'document_size_bytes'
                 - 'document_added_at' - 'buyer_member_id'
               || jsonb_build_object(
                 'items', (
                   SELECT coalesce(jsonb_agg(jsonb_build_object(
                            'product_id', i.product_id,
                            'quantity', i.quantity)), '[]'::jsonb)
                     FROM public.order_items i
                    WHERE i.order_id = o.id
                 ),
                 'payments', (
                   SELECT coalesce(jsonb_agg(to_jsonb(pm)
                            ORDER BY pm.paid_on, pm.created_at), '[]'::jsonb)
                     FROM public.order_payments pm
                    WHERE pm.order_id = o.id
                 )
               ) ORDER BY o.created_at), '[]'::jsonb)
        FROM public.orders o
       WHERE o.sale_id = p_sale_id
         AND o.sold_by = (SELECT auth.uid())
    )
  );
END;
$$;

-- 4. Writes -------------------------------------------------------------------------

-- Creates (p_order_id null) or replaces one of the seller's orders and its
-- quantities, like save_order. p_order: { buyer_name, buyer_phone,
-- buyer_address, fulfilment, notes }; any other key is ignored: the order is
-- « vendu par » the seller and keeps its member link.
CREATE OR REPLACE FUNCTION public.seller_save_order(
  p_sale_id uuid,
  p_order_id uuid,
  p_order jsonb,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := (SELECT auth.uid());
  _id uuid := p_order_id;
  _items jsonb := coalesce(p_items, '[]'::jsonb);
BEGIN
  IF NOT public.sells_for_sale(p_sale_id) THEN
    RAISE EXCEPTION 'Vous ne vendez pas pour cette vente' USING ERRCODE = '42501';
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
      _me,
      coalesce(nullif(p_order->>'fulfilment', ''), 'delivery'),
      nullif(btrim(p_order->>'notes'), ''),
      _me
    )
    RETURNING id INTO _id;
  ELSE
    UPDATE orders
       SET buyer_name = btrim(p_order->>'buyer_name'),
           buyer_phone = nullif(btrim(p_order->>'buyer_phone'), ''),
           buyer_address = nullif(btrim(p_order->>'buyer_address'), ''),
           fulfilment = coalesce(nullif(p_order->>'fulfilment', ''), 'delivery'),
           notes = nullif(btrim(p_order->>'notes'), '')
     WHERE id = _id
       AND sale_id = p_sale_id
       AND sold_by = _me
       AND personal_data_erased_at IS NULL;
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

  -- order_items_same_sale refuses a product of another sale.
  INSERT INTO order_items (order_id, product_id, quantity)
  SELECT _id, (e->>'product_id')::uuid, (e->>'quantity')::int
    FROM jsonb_array_elements(_items) e
   WHERE (e->>'quantity')::int > 0
  ON CONFLICT (order_id, product_id)
  DO UPDATE SET quantity = EXCLUDED.quantity;

  RETURN _id;
END;
$$;

-- Deletes one of the seller's orders (and its payments) while it is not in a
-- delivery round nor handed over.
CREATE OR REPLACE FUNCTION public.seller_delete_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order record;
BEGIN
  SELECT o.id, o.sale_id, o.delivery_recipient_id, o.handed_over_at
    INTO _order
    FROM orders o
   WHERE o.id = p_order_id AND o.sold_by = (SELECT auth.uid());
  IF _order.id IS NULL OR NOT public.sells_for_sale(_order.sale_id) THEN
    RAISE EXCEPTION 'Commande introuvable' USING ERRCODE = 'P0002';
  END IF;
  IF _order.delivery_recipient_id IS NOT NULL OR _order.handed_over_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cette commande est déjà dans la tournée ou remise : demandez à un superadmin de la supprimer'
      USING ERRCODE = '22023';
  END IF;
  DELETE FROM orders WHERE id = p_order_id;
END;
$$;

-- A payment received for one of the seller's orders (negative for a
-- refund); the table's checks hold the amount and the method.
CREATE OR REPLACE FUNCTION public.seller_add_payment(
  p_order_id uuid,
  p_amount_cents integer,
  p_method text,
  p_paid_on date,
  p_note text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sale uuid;
  _row order_payments;
BEGIN
  SELECT o.sale_id INTO _sale
    FROM orders o
   WHERE o.id = p_order_id AND o.sold_by = (SELECT auth.uid());
  IF _sale IS NULL OR NOT public.sells_for_sale(_sale) THEN
    RAISE EXCEPTION 'Commande introuvable' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO order_payments (order_id, amount_cents, method, paid_on, note,
                              recorded_by)
  VALUES (
    p_order_id,
    p_amount_cents,
    p_method,
    coalesce(p_paid_on, (now() AT TIME ZONE 'Europe/Paris')::date),
    nullif(btrim(p_note), ''),
    (SELECT auth.uid())
  )
  RETURNING * INTO _row;
  RETURN to_jsonb(_row);
END;
$$;

-- Removes a payment the seller recorded by mistake on one of their orders
-- (never one a superadmin recorded).
CREATE OR REPLACE FUNCTION public.seller_delete_payment(p_payment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sale uuid;
BEGIN
  SELECT o.sale_id INTO _sale
    FROM order_payments pm
    JOIN orders o ON o.id = pm.order_id
   WHERE pm.id = p_payment_id
     AND o.sold_by = (SELECT auth.uid())
     AND pm.recorded_by = (SELECT auth.uid());
  IF _sale IS NULL OR NOT public.sells_for_sale(_sale) THEN
    RAISE EXCEPTION 'Paiement introuvable' USING ERRCODE = 'P0002';
  END IF;
  DELETE FROM order_payments WHERE id = p_payment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.seller_sales() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.seller_sale(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.seller_save_order(uuid, uuid, jsonb, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.seller_delete_order(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.seller_add_payment(uuid, integer, text, date, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.seller_delete_payment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seller_sales() TO authenticated;
GRANT EXECUTE ON FUNCTION public.seller_sale(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seller_save_order(uuid, uuid, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seller_delete_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seller_add_payment(uuid, integer, text, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seller_delete_payment(uuid) TO authenticated;
