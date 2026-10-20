import { addOrdersToRound, parseOrderIds } from "@/utils/orders/addToRound";
import {
  dbErrorResponse,
  readJson,
  requireSuperadmin,
} from "@/utils/orders/server";
import type { DeliveryResult } from "@/utils/orders/types";
import { createClient } from "@/utils/supabase/server";
import { isUuid } from "@repo/domain/utils/orders";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ saleId: string }> };

/**
 * POST `{ driver_id?, new_round?, order_ids? }`: « Ajouter à la tournée ».
 * Every buyer to be delivered who has an address and no stop yet joins the
 * driver's current round (the caller's by default) through
 * `add_sale_orders_to_delivery`; with `order_ids`, only those buyers do
 * (`addOrdersToRound`, the same rules), so a round can take one day's buyers. With
 * `new_round: true` an empty round is opened for the driver first, unless
 * their latest round is empty already: being their latest, it is the one the
 * buyers join, and the previous round stays in the app as it was. Answers
 * `{ delivery_id, added, without_address }`.
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;
  const { saleId } = await params;
  if (!isUuid(saleId)) {
    return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
  }

  const body = await readJson(request);
  const driverId =
    typeof body === "object" && body !== null && "driver_id" in body
      ? (body as { driver_id: unknown }).driver_id
      : undefined;
  if (driverId !== undefined && driverId !== null && !isUuid(driverId)) {
    return NextResponse.json(
      { error: "Livreur inconnu", field: "driver_id" },
      { status: 400 },
    );
  }
  const newRound =
    typeof body === "object" && body !== null && "new_round" in body
      ? (body as { new_round: unknown }).new_round
      : undefined;
  if (
    newRound !== undefined &&
    newRound !== null &&
    typeof newRound !== "boolean"
  ) {
    return NextResponse.json(
      { error: "Nouvelle tournée invalide", field: "new_round" },
      { status: 400 },
    );
  }

  const orderIds = parseOrderIds(body);
  if (typeof orderIds === "string") {
    return NextResponse.json(
      { error: orderIds, field: "order_ids" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const driver = isUuid(driverId) ? driverId : auth.user.id;
  if (newRound === true || orderIds) {
    // Checked before the round is opened: the function would refuse a driver
    // who isn't a superadmin, but only after leaving an empty round behind
    // (and the add of chosen buyers has no function to check it).
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", driver)
      .eq("role", "superadmin")
      .maybeSingle();
    if (profileError) {
      return dbErrorResponse(
        profileError,
        "Le livreur n'a pas pu être vérifié",
      );
    }
    if (!profile) {
      return NextResponse.json(
        { error: "Le livreur doit être superadmin", field: "driver_id" },
        { status: 400 },
      );
    }
  }

  if (newRound === true) {
    // A latest round without stops is new already (one the app just opened,
    // or the one a retry of this request opened before the add failed): the
    // buyers join it rather than a second empty round.
    const { data: latest, error: latestError } = await supabase
      .from("deliveries")
      .select("id")
      .eq("driver_id", driver)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { count: stops, error: stopsError } = latest
      ? await supabase
          .from("delivery_recipients")
          .select("id", { count: "exact", head: true })
          .eq("delivery_id", latest.id)
      : { count: null, error: null };
    const readError = latestError ?? stopsError;
    if (readError) {
      return dbErrorResponse(
        readError,
        "La tournée en cours n'a pas pu être lue",
      );
    }

    if (!latest || stops !== 0) {
      // The columns `add_sale_orders_to_delivery` gives a round it opens.
      const { error: roundError } = await supabase.from("deliveries").insert({
        driver_id: driver,
        public_token: crypto.randomUUID(),
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        is_tracking_active: false,
      });
      if (roundError) {
        return dbErrorResponse(
          roundError,
          "La nouvelle tournée n'a pas pu être créée",
        );
      }
    }
  }

  if (orderIds) {
    const added = await addOrdersToRound(supabase, saleId, driver, orderIds);
    if (!added.ok) return dbErrorResponse(added.error, added.fallback);
    return NextResponse.json(added.result);
  }

  const { data, error } = await supabase.rpc("add_sale_orders_to_delivery", {
    p_sale_id: saleId,
    ...(isUuid(driverId) ? { p_driver_id: driverId } : {}),
  });
  if (error || !data) {
    return dbErrorResponse(
      error,
      "Les acheteurs n'ont pas pu être ajoutés à la tournée",
    );
  }
  return NextResponse.json(data as DeliveryResult);
}
