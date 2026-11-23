import { loadSellerSale, myName, requireSignedIn } from "@/utils/orders/seller";
import { createClient } from "@/utils/supabase/server";
import { isUuid } from "@repo/domain/utils/orders";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ saleId: string }> };

/**
 * GET: one sale for its seller: the catalogue and the seller's own orders
 * (quantities and payments), shaped like the superadmins' sale page.
 */
export async function GET(_request: Request, { params }: Params) {
  const supabase = await createClient();
  const auth = await requireSignedIn(supabase);
  if (!auth.ok) return auth.response;
  const { saleId } = await params;
  if (!isUuid(saleId)) {
    return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
  }
  const me = { id: auth.user.id, name: await myName(supabase, auth.user.id) };
  const loaded = await loadSellerSale(supabase, saleId, me);
  if (!loaded.ok) return loaded.response;
  return NextResponse.json(loaded.detail);
}
