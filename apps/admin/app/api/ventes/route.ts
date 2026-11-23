import { myName, mySellerSales, requireSignedIn } from "@/utils/orders/seller";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET: the sales the signed-in member sells for (not archived) and who they
 * are. An empty list means « Mes ventes » has nothing for them.
 */
export async function GET() {
  const supabase = await createClient();
  const auth = await requireSignedIn(supabase);
  if (!auth.ok) return auth.response;
  const [sales, name] = await Promise.all([
    mySellerSales(supabase),
    myName(supabase, auth.user.id),
  ]);
  return NextResponse.json({ sales, me: { id: auth.user.id, name } });
}
