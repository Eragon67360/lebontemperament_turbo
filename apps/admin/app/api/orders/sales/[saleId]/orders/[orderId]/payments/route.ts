import {
  dbErrorResponse,
  readJson,
  requireSuperadmin,
} from "@/utils/orders/server";
import { createClient } from "@/utils/supabase/server";
import { isUuid, parsePaymentInput } from "@repo/domain/utils/orders";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ saleId: string; orderId: string }> };

const UNKNOWN = NextResponse.json(
  { error: "Commande introuvable" },
  { status: 404 },
);

/**
 * POST `{ amount_cents, method, paid_on?, note? }`: a payment received for
 * the order (negative for a refund). Several payments add up.
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;
  const { saleId, orderId } = await params;
  if (!isUuid(saleId) || !isUuid(orderId)) return UNKNOWN;

  const parsed = parsePaymentInput(await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, field: parsed.field },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("sale_id", saleId)
    .maybeSingle();
  if (orderError) {
    return dbErrorResponse(orderError, "La commande n'a pas pu être lue");
  }
  if (!order) return UNKNOWN;

  const { paid_on, ...rest } = parsed.value;
  const { data, error } = await supabase
    .from("order_payments")
    .insert({
      ...rest,
      ...(paid_on ? { paid_on } : {}),
      order_id: orderId,
      recorded_by: auth.user.id,
    })
    .select("*")
    .single();
  if (error) {
    return dbErrorResponse(error, "Le paiement n'a pas pu être enregistré");
  }
  return NextResponse.json(data, { status: 201 });
}
