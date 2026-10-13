import {
  dbErrorResponse,
  readJson,
  requireSuperadmin,
} from "@/utils/orders/server";
import { createClient } from "@/utils/supabase/server";
import { isUuid, parseProductInput } from "@repo/domain/utils/orders";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ saleId: string; productId: string }> };

// A function: a Response body can only be read once, so each request
// needs its own.
const unknown = () =>
  NextResponse.json({ error: "Produit introuvable" }, { status: 404 });

/**
 * PATCH: any of a product's fields (`{ is_available: false }` alone hides it
 * from new orders). The row is read, merged and checked whole, so a partial
 * change obeys the same rules as a creation.
 */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;
  const { saleId, productId } = await params;
  if (!isUuid(saleId) || !isUuid(productId)) return unknown();

  const body = await readJson(request);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: current, error: readError } = await supabase
    .from("order_products")
    .select("*")
    .eq("id", productId)
    .eq("sale_id", saleId)
    .maybeSingle();
  if (readError) {
    return dbErrorResponse(readError, "Le produit n'a pas pu être lu");
  }
  if (!current) return unknown();

  const parsed = parseProductInput({
    category: current.category,
    name: current.name,
    variant: current.variant,
    supplier: current.supplier,
    unit_price_cents: current.unit_price_cents,
    is_available: current.is_available,
    ...body,
  });
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, field: parsed.field },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("order_products")
    .update(parsed.value)
    .eq("id", productId)
    .eq("sale_id", saleId)
    .select("*")
    .single();
  if (error) {
    return dbErrorResponse(error, "Le produit n'a pas pu être enregistré");
  }
  return NextResponse.json(data);
}

/**
 * DELETE: a product nobody ordered. One that is in an order answers 409
 * (the database keeps it); the page then offers to make it unavailable.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;
  const { saleId, productId } = await params;
  if (!isUuid(saleId) || !isUuid(productId)) return unknown();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_products")
    .delete()
    .eq("id", productId)
    .eq("sale_id", saleId)
    .select("id");
  if (error) {
    return dbErrorResponse(error, "Le produit n'a pas pu être supprimé");
  }
  if (data.length === 0) return unknown();
  return NextResponse.json({ ok: true });
}
