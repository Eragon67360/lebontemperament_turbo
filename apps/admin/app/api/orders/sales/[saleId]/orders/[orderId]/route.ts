import { removeOrderDocuments } from "@/utils/orders/documents";
import {
  dbErrorResponse,
  readJson,
  requireSuperadmin,
  saleProductIds,
} from "@/utils/orders/server";
import { createClient } from "@/utils/supabase/server";
import { isUuid, parseOrderInput } from "@repo/domain/utils/orders";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ saleId: string; orderId: string }> };

// A function: a Response body can only be read once, so each request
// needs its own.
const unknown = () =>
  NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

/** PUT: the whole order again (buyer and quantities) through `save_order`. */
export async function PUT(request: Request, { params }: Params) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;
  const { saleId, orderId } = await params;
  if (!isUuid(saleId) || !isUuid(orderId)) return unknown();

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
    p_order_id: orderId,
    p_order: parsed.value.order,
    p_items: parsed.value.items,
  });
  if (error || !data) {
    return dbErrorResponse(error, "La commande n'a pas pu être enregistrée");
  }
  return NextResponse.json({ id: data });
}

/** PATCH `{ handed_over: boolean }`: « Remis » (or undone). */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;
  const { saleId, orderId } = await params;
  if (!isUuid(saleId) || !isUuid(orderId)) return unknown();

  const body = await readJson(request);
  const handedOver =
    typeof body === "object" && body !== null && "handed_over" in body
      ? (body as { handed_over: unknown }).handed_over
      : undefined;
  if (typeof handedOver !== "boolean") {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ handed_over_at: handedOver ? new Date().toISOString() : null })
    .eq("id", orderId)
    .eq("sale_id", saleId)
    .select("id, handed_over_at")
    .maybeSingle();
  if (error) {
    return dbErrorResponse(error, "La commande n'a pas pu être enregistrée");
  }
  if (!data) return unknown();
  return NextResponse.json(data);
}

/** DELETE: the order with its quantities, payments (cascade) and order form. */
export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;
  const { saleId, orderId } = await params;
  if (!isUuid(saleId) || !isUuid(orderId)) return unknown();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId)
    .eq("sale_id", saleId)
    .select("id, document_key");
  if (error) {
    return dbErrorResponse(error, "La commande n'a pas pu être supprimée");
  }
  if (data.length === 0) return unknown();
  await removeOrderDocuments(
    supabase,
    data.map((o) => o.document_key),
  );
  return NextResponse.json({ ok: true });
}
