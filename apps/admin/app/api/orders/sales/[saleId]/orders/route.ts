import {
  dbErrorResponse,
  readJson,
  requireSuperadmin,
  saleProductIds,
} from "@/utils/orders/server";
import { createClient } from "@/utils/supabase/server";
import { isUuid, parseOrderInput } from "@repo/domain/utils/orders";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ saleId: string }> };

/**
 * POST: a new order (one buyer with their quantities) through `save_order`.
 * Only the sale's own products are accepted; quantities of 0 are dropped.
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;
  const { saleId } = await params;
  if (!isUuid(saleId)) {
    return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
  }

  const body = await readJson(request);
  const supabase = await createClient();
  const known = await saleProductIds(supabase, saleId);
  if (!known.ok) return known.response;

  const parsed = parseOrderInput(body, known.ids);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, field: parsed.field },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.rpc("save_order", {
    p_sale_id: saleId,
    // NULL creates the order. The argument has no default, so the generated
    // type (database.types.ts, never edited by hand) says `string`.
    p_order_id: null as unknown as string,
    p_order: parsed.value.order,
    p_items: parsed.value.items,
  });
  if (error || !data) {
    return dbErrorResponse(error, "La commande n'a pas pu être enregistrée");
  }
  return NextResponse.json({ id: data }, { status: 201 });
}
