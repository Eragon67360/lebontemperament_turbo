import { dbErrorResponse, requireSuperadmin } from "@/utils/orders/server";
import { createClient } from "@/utils/supabase/server";
import { isUuid } from "@repo/domain/utils/orders";
import { NextResponse } from "next/server";

type Params = {
  params: Promise<{ saleId: string; orderId: string; paymentId: string }>;
};

// A function: a Response body can only be read once, so each request
// needs its own.
const unknown = () =>
  NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });

/** DELETE: a payment recorded by mistake. */
export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;
  const { saleId, orderId, paymentId } = await params;
  if (!isUuid(saleId) || !isUuid(orderId) || !isUuid(paymentId)) {
    return unknown();
  }

  const supabase = await createClient();
  // The order must belong to the sale named in the URL.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("sale_id", saleId)
    .maybeSingle();
  if (orderError) {
    return dbErrorResponse(orderError, "La commande n'a pas pu être lue");
  }
  if (!order) return unknown();

  const { data, error } = await supabase
    .from("order_payments")
    .delete()
    .eq("id", paymentId)
    .eq("order_id", orderId)
    .select("id");
  if (error) {
    return dbErrorResponse(error, "Le paiement n'a pas pu être supprimé");
  }
  if (data.length === 0) return unknown();
  return NextResponse.json({ ok: true });
}
