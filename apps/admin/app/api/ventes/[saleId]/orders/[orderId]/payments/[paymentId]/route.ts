import { requireSignedIn, sellerDbErrorResponse } from "@/utils/orders/seller";
import { createClient } from "@/utils/supabase/server";
import { isUuid } from "@repo/domain/utils/orders";
import { NextResponse } from "next/server";

type Params = {
  params: Promise<{ saleId: string; orderId: string; paymentId: string }>;
};

/**
 * DELETE: a payment the seller recorded by mistake on one of their orders.
 * One a superadmin recorded can only be removed by a superadmin.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const supabase = await createClient();
  const auth = await requireSignedIn(supabase);
  if (!auth.ok) return auth.response;
  const { saleId, orderId, paymentId } = await params;
  if (!isUuid(saleId) || !isUuid(orderId) || !isUuid(paymentId)) {
    return NextResponse.json(
      { error: "Paiement introuvable" },
      { status: 404 },
    );
  }

  const { error } = await supabase.rpc("seller_delete_payment", {
    p_payment_id: paymentId,
  });
  if (error) {
    return sellerDbErrorResponse(error, "Le paiement n'a pas pu être supprimé");
  }
  return NextResponse.json({ ok: true });
}
