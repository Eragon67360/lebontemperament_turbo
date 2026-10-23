-- Members see their own orders (Thomas, 2026-10-22): an order can name the
-- member who bought it and carry the order form they handed in (« bon de
-- commande »: a scan, a photo, a PDF, a Word or Excel file). The member then
-- finds it in the members area (« Mes commandes »): what they ordered, what
-- they paid, how it reaches them, and the document to download.
--
-- 1. orders.buyer_member_id: the member's account, chosen in the admin's
--    order form (« ou choisir parmi les membres »). orders.document_*: the
--    order form, one per order, in the private bucket below under
--    <order id>/<random id>-<clean name>.
-- 2. save_order takes `buyer_member_id` in p_order. Only when the key is
--    present: the shipped app (3.0.0) never sends it, so its saves keep the
--    link the admin set.
-- 3. Private bucket order-documents (10 MB; PDF, JPEG, PNG, WebP, Word,
--    Excel). Superadmins upload and delete; a file is readable by
--    superadmins and by the member the order names, nobody else
--    (can_read_order_document).
-- 4. member_orders(): the signed-in member's own orders as one JSON list.
--    SECURITY DEFINER, filtered on auth.uid(): a member never reads another
--    buyer's order, and the order tables stay superadmin-only.
-- 5. Personal data: the nightly purge (30 days after delivery day) now also
--    drops the member link and the document's reference; the edge function
--    purge-order-documents (pg_cron, 03:50 UTC) then removes the files no
--    order points at any more (Storage objects can't be deleted from SQL):
--    purged orders, deleted orders and sales, replaced documents, uploads
--    never attached (after a day).
--
-- Backward compatible: new nullable columns, same function signatures.
-- Installed apps select orders(*) and ignore the new columns.
--
-- Rollback:
--   SELECT cron.unschedule('purge-order-documents');
--   DROP FUNCTION IF EXISTS public.order_documents_to_purge(integer);
--   DROP FUNCTION IF EXISTS public.member_orders();
--   DROP POLICY "Order documents: superadmins upload" ON storage.objects;
--   DROP POLICY "Order documents: superadmins delete" ON storage.objects;
--   DROP POLICY "Order documents: superadmins and the buyer read" ON storage.objects;
--   DROP FUNCTION IF EXISTS public.can_read_order_document(text);
--   (empty the bucket order-documents through the Storage API, then delete it)
--   re-create save_order and purge_expired_order_personal_data from
--   20261013222527_orders.sql;
--   ALTER TABLE public.orders DROP CONSTRAINT orders_document_check,
--     DROP COLUMN buyer_member_id, DROP COLUMN document_key,
--     DROP COLUMN document_name, DROP COLUMN document_mime_type,
--     DROP COLUMN document_size_bytes, DROP COLUMN document_added_at;

-- 1. Columns ----------------------------------------------------------------------

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS buyer_member_id uuid
    REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS document_key text,
  ADD COLUMN IF NOT EXISTS document_name text,
  ADD COLUMN IF NOT EXISTS document_mime_type text,
  ADD COLUMN IF NOT EXISTS document_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS document_added_at timestamptz;

COMMENT ON COLUMN public.orders.buyer_member_id IS
  'The member who bought it, if the buyer is one: the order shows in their members area (member_orders()). Erased with the buyer''s data.';
COMMENT ON COLUMN public.orders.document_key IS
  'The order form handed in by the buyer: object <order id>/<random id>-<name> in the private bucket order-documents. Readable by superadmins and the linked member.';

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_document_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_document_check CHECK (
  (document_key IS NULL AND document_name IS NULL AND document_mime_type IS NULL
   AND document_size_bytes IS NULL AND document_added_at IS NULL)
  OR (
    document_key IS NOT NULL AND document_name IS NOT NULL
    AND document_mime_type IS NOT NULL AND document_added_at IS NOT NULL
    AND char_length(document_key) <= 400
    AND starts_with(document_key, id::text || '/')
    AND position('/' IN substr(document_key, char_length(id::text) + 2)) = 0
    AND position('..' IN document_key) = 0
    AND char_length(document_name) <= 150
    AND document_name ~ '^[A-Za-z0-9][A-Za-z0-9._-]*\.(pdf|jpg|png|webp|doc|docx|xls|xlsx)$'
    AND document_mime_type IN (
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    AND (document_size_bytes IS NULL OR document_size_bytes >= 0)
  )
);

CREATE INDEX IF NOT EXISTS orders_buyer_member_idx
  ON public.orders (buyer_member_id) WHERE buyer_member_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_document_key_idx
  ON public.orders (document_key) WHERE document_key IS NOT NULL;

-- 2. save_order with the member ---------------------------------------------------
-- Same as 20261013222527, plus p_order.buyer_member_id (a profile id or
-- null), written only when the key is sent.

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
  _member uuid := nullif(p_order->>'buyer_member_id', '')::uuid;
BEGIN
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Réservé aux superadmins' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(_items) <> 'array' THEN
    RAISE EXCEPTION 'p_items doit être une liste' USING ERRCODE = '22023';
  END IF;

  IF _id IS NULL THEN
    INSERT INTO orders (sale_id, buyer_name, buyer_phone, buyer_address,
                        sold_by, fulfilment, notes, buyer_member_id, created_by)
    VALUES (
      p_sale_id,
      btrim(p_order->>'buyer_name'),
      nullif(btrim(p_order->>'buyer_phone'), ''),
      nullif(btrim(p_order->>'buyer_address'), ''),
      nullif(p_order->>'sold_by', '')::uuid,
      coalesce(nullif(p_order->>'fulfilment', ''), 'delivery'),
      nullif(btrim(p_order->>'notes'), ''),
      _member,
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
           notes = nullif(btrim(p_order->>'notes'), ''),
           buyer_member_id = CASE
             WHEN personal_data_erased_at IS NOT NULL THEN NULL
             WHEN p_order ? 'buyer_member_id' THEN _member
             ELSE buyer_member_id
           END
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

REVOKE ALL ON FUNCTION public.save_order(uuid, uuid, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_order(uuid, uuid, jsonb, jsonb) TO authenticated;

-- 3. The order forms' bucket ------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-documents',
  'order-documents',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Who may read one file: superadmins, and the member named by the live order
-- that points at it. SECURITY DEFINER because the orders table is
-- superadmin-only.
CREATE OR REPLACE FUNCTION public.can_read_order_document(p_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL AND (
    public.is_superadmin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
       WHERE o.document_key = p_name
         AND o.buyer_member_id = (SELECT auth.uid())
         AND o.personal_data_erased_at IS NULL
    )
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_order_document(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_order_document(text)
  TO authenticated, service_role;

DROP POLICY IF EXISTS "Order documents: superadmins upload" ON storage.objects;
CREATE POLICY "Order documents: superadmins upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'order-documents'
    AND public.is_superadmin()
    AND lower(storage.extension(name)) IN
      ('pdf', 'jpg', 'png', 'webp', 'doc', 'docx', 'xls', 'xlsx')
    AND EXISTS (
      SELECT 1 FROM public.orders o
       WHERE o.id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Order documents: superadmins delete" ON storage.objects;
CREATE POLICY "Order documents: superadmins delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'order-documents' AND public.is_superadmin());

DROP POLICY IF EXISTS "Order documents: superadmins and the buyer read" ON storage.objects;
CREATE POLICY "Order documents: superadmins and the buyer read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'order-documents' AND public.can_read_order_document(name));

-- 4. A member's own orders --------------------------------------------------------
-- What « Mes commandes » shows, newest delivery first. Leaves out the
-- admin's remarks (orders.notes, payment notes) and who took the order.

CREATE OR REPLACE FUNCTION public.member_orders()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    jsonb_agg(x.entry ORDER BY x.delivery_date DESC NULLS LAST, x.created_at DESC),
    '[]'::jsonb
  )
  FROM (
    SELECT
      s.delivery_date,
      o.created_at,
      jsonb_build_object(
        'id', o.id,
        'sale_title', s.title,
        'order_deadline', s.order_deadline,
        'delivery_date', s.delivery_date,
        'buyer_name', o.buyer_name,
        'buyer_address', o.buyer_address,
        'fulfilment', o.fulfilment,
        'handed_over_at', o.handed_over_at,
        'in_round', o.delivery_recipient_id IS NOT NULL,
        'delivered_at', r.delivered_at,
        'tracking_token', CASE
          WHEN r.delivered_at IS NULL AND d.expires_at > now() THEN r.public_token
        END,
        'created_at', o.created_at,
        'items', (
          SELECT coalesce(jsonb_agg(jsonb_build_object(
                   'product_id', p.id,
                   'category', p.category,
                   'name', p.name,
                   'variant', p.variant,
                   'unit_price_cents', p.unit_price_cents,
                   'display_order', p.display_order,
                   'quantity', i.quantity
                 ) ORDER BY p.display_order, p.name), '[]'::jsonb)
            FROM public.order_items i
            JOIN public.order_products p ON p.id = i.product_id
           WHERE i.order_id = o.id
        ),
        'payments', (
          SELECT coalesce(jsonb_agg(jsonb_build_object(
                   'amount_cents', pm.amount_cents,
                   'method', pm.method,
                   'paid_on', pm.paid_on
                 ) ORDER BY pm.paid_on, pm.created_at), '[]'::jsonb)
            FROM public.order_payments pm
           WHERE pm.order_id = o.id
        ),
        'document', CASE WHEN o.document_key IS NOT NULL THEN jsonb_build_object(
          'key', o.document_key,
          'name', o.document_name,
          'mime_type', o.document_mime_type,
          'size_bytes', o.document_size_bytes
        ) END
      ) AS entry
    FROM public.orders o
    JOIN public.order_sales s ON s.id = o.sale_id
    LEFT JOIN public.delivery_recipients r ON r.id = o.delivery_recipient_id
    LEFT JOIN public.deliveries d ON d.id = r.delivery_id
    WHERE (SELECT auth.uid()) IS NOT NULL
      AND o.buyer_member_id = (SELECT auth.uid())
      AND o.personal_data_erased_at IS NULL
  ) x;
$$;

REVOKE ALL ON FUNCTION public.member_orders() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.member_orders() TO authenticated;

-- 5. Personal data ----------------------------------------------------------------

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
         buyer_member_id = NULL,
         document_key = NULL,
         document_name = NULL,
         document_mime_type = NULL,
         document_size_bytes = NULL,
         document_added_at = NULL,
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

-- The files of order-documents that no live order points at, older than a
-- day (an upload in progress is never caught). For purge-order-documents.
CREATE OR REPLACE FUNCTION public.order_documents_to_purge(p_limit integer DEFAULT 500)
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT so.name
    FROM storage.objects so
   WHERE so.bucket_id = 'order-documents'
     AND so.created_at < now() - interval '1 day'
     AND NOT EXISTS (
       SELECT 1 FROM public.orders o
        WHERE o.document_key = so.name
          AND o.personal_data_erased_at IS NULL
     )
   ORDER BY so.created_at
   LIMIT greatest(1, least(coalesce(p_limit, 500), 1000));
$$;

REVOKE ALL ON FUNCTION public.order_documents_to_purge(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.order_documents_to_purge(integer) TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-order-documents') THEN
    PERFORM cron.unschedule('purge-order-documents');
  END IF;
END;
$$;

-- Without the Vault secrets, as on staging, the job calls nothing.
SELECT cron.schedule(
  'purge-order-documents',
  '50 3 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/purge-order-documents',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key'),
      'x-internal-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'internal_function_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) AS request_id
  WHERE EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'project_url');
  $$
);
