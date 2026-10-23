import { removeOrderDocuments } from "@/utils/orders/documents";
import {
  dbErrorResponse,
  displayNames,
  readJson,
  requireSuperadmin,
} from "@/utils/orders/server";
import type { SaleDetail } from "@/utils/orders/types";
import { createClient } from "@/utils/supabase/server";
import { isUuid, parseSaleInput } from "@repo/domain/utils/orders";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ saleId: string }> };

// A function: a Response body can only be read once, so each request
// needs its own.
const unknown = () =>
  NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

/**
 * GET: one sale with its catalogue, every order (quantities and payments
 * included) and the names of the members who sold them.
 */
export async function GET(_request: Request, { params }: Params) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;
  const { saleId } = await params;
  if (!isUuid(saleId)) return unknown();

  const supabase = await createClient();
  const [sale, products, orders] = await Promise.all([
    supabase.from("order_sales").select("*").eq("id", saleId).maybeSingle(),
    supabase
      .from("order_products")
      .select("*")
      .eq("sale_id", saleId)
      .order("display_order", { ascending: true }),
    supabase
      .from("orders")
      .select("*, order_items(product_id, quantity), order_payments(*)")
      .eq("sale_id", saleId)
      .order("created_at", { ascending: true }),
  ]);
  const failed = sale.error ?? products.error ?? orders.error;
  if (failed) {
    return dbErrorResponse(failed, "La vente n'a pas pu être chargée");
  }
  if (!sale.data) return unknown();
  const orderRows = orders.data ?? [];

  const sellers = await displayNames(
    supabase,
    orderRows.map((o) => o.sold_by),
  );
  const detail: SaleDetail = {
    sale: sale.data,
    products: products.data ?? [],
    orders: orderRows.map(({ order_items, order_payments, ...order }) => ({
      ...order,
      items: order_items,
      payments: [...order_payments].sort(
        (a, b) =>
          a.paid_on.localeCompare(b.paid_on) ||
          a.created_at.localeCompare(b.created_at),
      ),
    })),
    sellers,
  };
  return NextResponse.json(detail);
}

/**
 * PATCH `{ archived: boolean }` folds or unfolds the sale; PATCH `{ title,
 * order_deadline, delivery_date }` changes its facts.
 */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;
  const { saleId } = await params;
  if (!isUuid(saleId)) return unknown();

  const body = await readJson(request);
  const supabase = await createClient();

  if (
    typeof body === "object" &&
    body !== null &&
    "archived" in body &&
    Object.keys(body).length === 1
  ) {
    const archived = (body as { archived: unknown }).archived;
    if (typeof archived !== "boolean") {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("order_sales")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", saleId)
      .select("*")
      .maybeSingle();
    if (error) {
      return dbErrorResponse(error, "La vente n'a pas pu être enregistrée");
    }
    if (!data) return unknown();
    return NextResponse.json(data);
  }

  const parsed = parseSaleInput(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, field: parsed.field },
      { status: 400 },
    );
  }
  const { data, error } = await supabase
    .from("order_sales")
    .update(parsed.value)
    .eq("id", saleId)
    .select("*")
    .maybeSingle();
  if (error) {
    return dbErrorResponse(error, "La vente n'a pas pu être enregistrée");
  }
  if (!data) return unknown();
  return NextResponse.json(data);
}

/**
 * DELETE: the sale with its catalogue, orders and payments (cascade), then
 * the orders' forms in storage.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;
  const { saleId } = await params;
  if (!isUuid(saleId)) return unknown();

  const supabase = await createClient();
  const { data: files } = await supabase
    .from("orders")
    .select("document_key")
    .eq("sale_id", saleId)
    .not("document_key", "is", null);
  const { data, error } = await supabase
    .from("order_sales")
    .delete()
    .eq("id", saleId)
    .select("id");
  if (error) {
    return dbErrorResponse(error, "La vente n'a pas pu être supprimée");
  }
  if (data.length === 0) return unknown();
  await removeOrderDocuments(
    supabase,
    (files ?? []).map((o) => o.document_key),
  );
  return NextResponse.json({ ok: true });
}
