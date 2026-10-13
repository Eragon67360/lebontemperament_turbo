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
 * POST `{ driver_id? }`: « Ajouter à la tournée ». Every buyer to be
 * delivered who has an address and no stop yet joins the driver's current
 * round (the caller's by default) through `add_sale_orders_to_delivery`.
 * Answers `{ delivery_id, added, without_address }`.
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

  const supabase = await createClient();
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
