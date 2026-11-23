import {
  loadSellerSale,
  requireSignedIn,
  sellerDbErrorResponse,
  sellerOrderBody,
} from "@/utils/orders/seller";
import { readJson } from "@/utils/orders/server";
import { createClient } from "@/utils/supabase/server";
import { isUuid, parseOrderInput } from "@repo/domain/utils/orders";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ saleId: string; orderId: string }> };

// A function: a Response body can only be read once, so each request
// needs its own.
const unknown = () =>
  NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

/** PUT: one of the seller's orders again (buyer and quantities). */
export async function PUT(request: Request, { params }: Params) {
  const supabase = await createClient();
  const auth = await requireSignedIn(supabase);
  if (!auth.ok) return auth.response;
  const { saleId, orderId } = await params;
  if (!isUuid(saleId) || !isUuid(orderId)) return unknown();

  const body = await readJson(request);
  const loaded = await loadSellerSale(supabase, saleId, {
    id: auth.user.id,
    name: "",
  });
  if (!loaded.ok) return loaded.response;
  const parsed = parseOrderInput(
    body,
    new Set(loaded.detail.products.map((p) => p.id)),
  );
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, field: parsed.field },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.rpc("seller_save_order", {
    p_sale_id: saleId,
    p_order_id: orderId,
    p_order: sellerOrderBody(parsed.value.order),
    p_items: parsed.value.items,
  });
  if (error || !data) {
    return sellerDbErrorResponse(
      error,
      "La commande n'a pas pu être enregistrée",
    );
  }
  return NextResponse.json({ id: data });
}

/**
 * DELETE: one of the seller's orders with its payments, while it is not in
 * a round nor handed over (the function refuses otherwise).
 */
export async function DELETE(_request: Request, { params }: Params) {
  const supabase = await createClient();
  const auth = await requireSignedIn(supabase);
  if (!auth.ok) return auth.response;
  const { saleId, orderId } = await params;
  if (!isUuid(saleId) || !isUuid(orderId)) return unknown();

  const { error } = await supabase.rpc("seller_delete_order", {
    p_order_id: orderId,
  });
  if (error) {
    return sellerDbErrorResponse(
      error,
      "La commande n'a pas pu être supprimée",
    );
  }
  return NextResponse.json({ ok: true });
}
