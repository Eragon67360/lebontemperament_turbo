import {
  dbErrorResponse,
  readJson,
  requireSuperadmin,
} from "@/utils/orders/server";
import type { SaleListItem } from "@/utils/orders/types";
import { createClient } from "@/utils/supabase/server";
import { isUuid, parseSaleInput, saleSummary } from "@repo/domain/utils/orders";
import { NextResponse } from "next/server";

/**
 * « Commandes »: GET lists every sale, newest first, with how many orders it
 * has, their total and what buyers still owe (archived ones included: the
 * page folds them).
 */
export async function GET() {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;

  const supabase = await createClient();
  const [sales, products, orders] = await Promise.all([
    supabase
      .from("order_sales")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("order_products")
      .select(
        "id, sale_id, category, name, variant, supplier, unit_price_cents, display_order",
      ),
    supabase
      .from("orders")
      .select(
        "id, sale_id, buyer_name, fulfilment, order_items(product_id, quantity), order_payments(amount_cents, method)",
      ),
  ]);
  const failed = sales.error ?? products.error ?? orders.error;
  if (failed) {
    return dbErrorResponse(failed, "Les ventes n'ont pas pu être chargées");
  }

  const allProducts = products.data ?? [];
  const allOrders = orders.data ?? [];
  const items: SaleListItem[] = (sales.data ?? []).map((sale) => {
    const summary = saleSummary(
      allProducts.filter((p) => p.sale_id === sale.id),
      allOrders
        .filter((o) => o.sale_id === sale.id)
        .map((o) => ({
          id: o.id,
          buyer_name: o.buyer_name,
          fulfilment: o.fulfilment,
          items: o.order_items,
          payments: o.order_payments,
        })),
    );
    return {
      ...sale,
      orderCount: summary.orderCount,
      totalCents: summary.totalCents,
      dueCents: summary.dueCents,
    };
  });
  return NextResponse.json({ sales: items });
}

/**
 * POST `{ title, order_deadline, delivery_date, copy_from? }`: a new sale.
 * With `copy_from` (the id of a sale) the catalogue is copied through
 * `copy_order_sale`, then the dates are set; without it the sale starts with
 * an empty catalogue.
 */
export async function POST(request: Request) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;

  const body = await readJson(request);
  const parsed = parseSaleInput(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, field: parsed.field },
      { status: 400 },
    );
  }
  const copyFrom =
    typeof body === "object" && body !== null && "copy_from" in body
      ? (body as { copy_from: unknown }).copy_from
      : null;
  if (copyFrom !== null && copyFrom !== "" && !isUuid(copyFrom)) {
    return NextResponse.json(
      { error: "Vente à copier inconnue", field: "copy_from" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  let id: string;
  if (isUuid(copyFrom)) {
    const { data, error } = await supabase.rpc("copy_order_sale", {
      p_sale_id: copyFrom,
      p_title: parsed.value.title,
    });
    if (error || !data) {
      return dbErrorResponse(error, "La vente n'a pas pu être créée");
    }
    id = data;
    const { error: datesError } = await supabase
      .from("order_sales")
      .update({
        order_deadline: parsed.value.order_deadline,
        delivery_date: parsed.value.delivery_date,
      })
      .eq("id", id);
    if (datesError) {
      return dbErrorResponse(
        datesError,
        "La vente a été créée mais ses dates n'ont pas pu être enregistrées",
      );
    }
  } else {
    const { data, error } = await supabase
      .from("order_sales")
      .insert({ ...parsed.value, created_by: auth.user.id })
      .select("id")
      .single();
    if (error || !data) {
      return dbErrorResponse(error, "La vente n'a pas pu être créée");
    }
    id = data.id;
  }
  return NextResponse.json({ id }, { status: 201 });
}
