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

type Params = { params: Promise<{ saleId: string }> };

/**
 * POST: a new buyer for the seller (one order with its quantities) through
 * `seller_save_order`, which makes it « vendu par » the seller. Only the
 * sale's own products are accepted; quantities of 0 are dropped.
 */
export async function POST(request: Request, { params }: Params) {
  const supabase = await createClient();
  const auth = await requireSignedIn(supabase);
  if (!auth.ok) return auth.response;
  const { saleId } = await params;
  if (!isUuid(saleId)) {
    return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
  }

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
    // NULL creates the order (see the superadmins' route).
    p_order_id: null as unknown as string,
    p_order: sellerOrderBody(parsed.value.order),
    p_items: parsed.value.items,
  });
  if (error || !data) {
    return sellerDbErrorResponse(
      error,
      "La commande n'a pas pu être enregistrée",
    );
  }
  return NextResponse.json({ id: data }, { status: 201 });
}
