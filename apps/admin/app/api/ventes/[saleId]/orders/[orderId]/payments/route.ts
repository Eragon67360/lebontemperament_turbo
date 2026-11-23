import { requireSignedIn, sellerDbErrorResponse } from "@/utils/orders/seller";
import { readJson } from "@/utils/orders/server";
import { createClient } from "@/utils/supabase/server";
import { isUuid, parsePaymentInput } from "@repo/domain/utils/orders";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ saleId: string; orderId: string }> };

/**
 * POST `{ amount_cents, method, paid_on?, note? }`: a payment the seller
 * received for one of their orders (negative for a refund).
 */
export async function POST(request: Request, { params }: Params) {
  const supabase = await createClient();
  const auth = await requireSignedIn(supabase);
  if (!auth.ok) return auth.response;
  const { saleId, orderId } = await params;
  if (!isUuid(saleId) || !isUuid(orderId)) {
    return NextResponse.json(
      { error: "Commande introuvable" },
      { status: 404 },
    );
  }

  const parsed = parsePaymentInput(await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, field: parsed.field },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.rpc("seller_add_payment", {
    p_order_id: orderId,
    p_amount_cents: parsed.value.amount_cents,
    p_method: parsed.value.method,
    // NULL means today (Paris), like the table's default.
    p_paid_on: (parsed.value.paid_on ?? null) as unknown as string,
    p_note: (parsed.value.note ?? null) as unknown as string,
  });
  if (error || !data) {
    return sellerDbErrorResponse(
      error,
      "Le paiement n'a pas pu être enregistré",
    );
  }
  return NextResponse.json(data, { status: 201 });
}
