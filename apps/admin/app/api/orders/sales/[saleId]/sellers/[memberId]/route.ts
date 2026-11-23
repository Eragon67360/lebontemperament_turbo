import { dbErrorResponse, requireSuperadmin } from "@/utils/orders/server";
import { createClient } from "@/utils/supabase/server";
import { isUuid } from "@repo/domain/utils/orders";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ saleId: string; memberId: string }> };

/**
 * DELETE: the member no longer sells for this sale. Their orders stay, still
 * « vendu par » them; they only lose « Mes ventes » for this sale.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;
  const { saleId, memberId } = await params;
  if (!isUuid(saleId) || !isUuid(memberId)) {
    return NextResponse.json({ error: "Vendeur introuvable" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_sale_sellers")
    .delete()
    .eq("sale_id", saleId)
    .eq("member_id", memberId)
    .select("member_id");
  if (error) {
    return dbErrorResponse(error, "Le vendeur n'a pas pu être retiré");
  }
  if (data.length === 0) {
    return NextResponse.json({ error: "Vendeur introuvable" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
