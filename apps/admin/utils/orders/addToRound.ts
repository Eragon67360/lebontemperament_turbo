// « Ajouter à la tournée » for chosen buyers: the steps of
// add_sale_orders_to_delivery (supabase/migrations/20261013222527_orders.sql)
// limited to the given orders, through the superadmin's own client (RLS lets
// superadmins write rounds, stops and orders), so no database change is
// needed. The whole sale still goes through the function itself.
import type { DeliveryResult } from "@/utils/orders/types";
import type { createClient } from "@/utils/supabase/server";
import { isUuid, normalizePhone } from "@repo/domain/utils/orders";

type Client = Awaited<ReturnType<typeof createClient>>;

/** More than a sale ever has: the add is one write per buyer. */
export const MAX_ORDER_IDS = 300;

/**
 * `order_ids` of the request body: absent (the whole sale), or 1 to
 * `MAX_ORDER_IDS` order ids, repeats dropped. A string is the error to send.
 */
export function parseOrderIds(body: unknown): string[] | null | string {
  if (typeof body !== "object" || body === null || !("order_ids" in body)) {
    return null;
  }
  const value = (body as { order_ids: unknown }).order_ids;
  if (value === undefined || value === null) return null;
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > MAX_ORDER_IDS ||
    !value.every(isUuid)
  ) {
    return "Acheteurs invalides";
  }
  return [...new Set(value.map((id) => id.toLowerCase()))];
}

/**
 * A round is over when it has stops and every one is delivered: the next add
 * opens a new round. An empty round is the one to fill (the function's rule,
 * and the app's).
 */
export function isFinishedRound(
  stops: readonly { delivered_at: string | null }[],
): boolean {
  return stops.length > 0 && stops.every((s) => s.delivered_at !== null);
}

export type AddFailure = {
  error: { code?: string | null; message?: string | null } | null;
  fallback: string;
};

/**
 * Adds the given orders of the sale to the driver's current round (their
 * latest, unless it is over: then a new one), each as a stop after the
 * round's last, in name order. Only orders still waiting are added: to be
 * delivered, with an address, no stop yet, personal data not erased; the
 * others are skipped. The stop is linked to its order only while the order
 * has none, so an add running at the same time can't give it two (the
 * spare stop is removed). The driver must be a superadmin (checked by the
 * caller). Reports like the function: the round, how many were added, and
 * how many buyers of the sale still wait for an address.
 */
export async function addOrdersToRound(
  supabase: Client,
  saleId: string,
  driverId: string,
  orderIds: readonly string[],
): Promise<
  { ok: true; result: DeliveryResult } | ({ ok: false } & AddFailure)
> {
  const fail = (error: AddFailure["error"], fallback: string) => ({
    ok: false as const,
    error,
    fallback,
  });

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, buyer_name, buyer_phone, buyer_address, created_at")
    .eq("sale_id", saleId)
    .in("id", orderIds)
    .eq("fulfilment", "delivery")
    .is("delivery_recipient_id", null)
    .is("personal_data_erased_at", null);
  if (ordersError) {
    return fail(ordersError, "Les acheteurs n'ont pas pu être lus");
  }
  const waiting = orders
    .filter((o) => !!o.buyer_address?.trim())
    .sort(
      (a, b) =>
        a.buyer_name.localeCompare(b.buyer_name, "fr") ||
        a.created_at.localeCompare(b.created_at),
    );

  // The driver's current round, as the function finds it.
  const { data: latest, error: latestError } = await supabase
    .from("deliveries")
    .select("id")
    .eq("driver_id", driverId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) {
    return fail(latestError, "La tournée en cours n'a pas pu être lue");
  }
  let deliveryId = latest?.id ?? null;
  let nextSort = 0;
  if (deliveryId) {
    const { data: stops, error: stopsError } = await supabase
      .from("delivery_recipients")
      .select("sort_order, delivered_at")
      .eq("delivery_id", deliveryId);
    if (stopsError) {
      return fail(stopsError, "La tournée en cours n'a pas pu être lue");
    }
    if (isFinishedRound(stops)) {
      deliveryId = null;
    } else {
      nextSort = stops.reduce((max, s) => Math.max(max, s.sort_order + 1), 0);
    }
  }
  if (!deliveryId && waiting.length > 0) {
    // The columns the function gives a round it opens.
    const { data: round, error: roundError } = await supabase
      .from("deliveries")
      .insert({
        driver_id: driverId,
        public_token: crypto.randomUUID(),
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        is_tracking_active: false,
      })
      .select("id")
      .single();
    if (roundError) {
      return fail(roundError, "La nouvelle tournée n'a pas pu être créée");
    }
    deliveryId = round.id;
  }

  let added = 0;
  for (const order of waiting) {
    const { data: stop, error: stopError } = await supabase
      .from("delivery_recipients")
      .insert({
        delivery_id: deliveryId!,
        label: order.buyer_name,
        sort_order: nextSort,
        public_token: crypto.randomUUID(),
        address: order.buyer_address,
        phone_number: normalizePhone(order.buyer_phone),
      })
      .select("id")
      .single();
    if (stopError) {
      return fail(stopError, "Les acheteurs n'ont pas pu être ajoutés");
    }
    const { data: linked, error: linkError } = await supabase
      .from("orders")
      .update({ delivery_recipient_id: stop.id })
      .eq("id", order.id)
      .is("delivery_recipient_id", null)
      .select("id");
    if (linkError || linked.length === 0) {
      // Not linked (or linked by another add meanwhile): no stray stop.
      await supabase.from("delivery_recipients").delete().eq("id", stop.id);
      if (linkError) {
        return fail(linkError, "Les acheteurs n'ont pas pu être ajoutés");
      }
      continue;
    }
    nextSort += 1;
    added += 1;
  }

  const { data: rest, error: restError } = await supabase
    .from("orders")
    .select("buyer_address")
    .eq("sale_id", saleId)
    .eq("fulfilment", "delivery")
    .is("delivery_recipient_id", null)
    .is("personal_data_erased_at", null);
  if (restError) {
    return fail(restError, "Les acheteurs n'ont pas pu être relus");
  }

  return {
    ok: true,
    result: {
      delivery_id: deliveryId,
      added,
      without_address: rest.filter((o) => !o.buyer_address?.trim()).length,
    },
  };
}
