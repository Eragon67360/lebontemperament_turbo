import {
  dbErrorResponse,
  readJson,
  requireSuperadmin,
} from "@/utils/orders/server";
import { createClient } from "@/utils/supabase/server";
import { isUuid } from "@repo/domain/utils/orders";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ saleId: string }> };

/**
 * POST `{ member_id }`: the member sells for this sale. They then sign in
 * to the admin and see « Mes ventes »: their own buyers and payments,
 * nothing else. Adding someone already listed changes nothing.
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;
  const { saleId } = await params;
  if (!isUuid(saleId)) {
    return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
  }

  const body = await readJson(request);
  const memberId =
    typeof body === "object" && body !== null && "member_id" in body
      ? (body as { member_id: unknown }).member_id
      : undefined;
  if (!isUuid(memberId)) {
    return NextResponse.json(
      { error: "Choisissez un membre", field: "member_id" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const [sale, member] = await Promise.all([
    supabase.from("order_sales").select("id").eq("id", saleId).maybeSingle(),
    supabase.from("profiles").select("id").eq("id", memberId).maybeSingle(),
  ]);
  const failed = sale.error ?? member.error;
  if (failed) return dbErrorResponse(failed, "La vente n'a pas pu être lue");
  if (!sale.data) {
    return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
  }
  if (!member.data) {
    return NextResponse.json(
      { error: "Ce membre n'existe pas", field: "member_id" },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("order_sale_sellers")
    .upsert(
      { sale_id: saleId, member_id: memberId, added_by: auth.user.id },
      { onConflict: "sale_id,member_id", ignoreDuplicates: true },
    );
  if (error) {
    return dbErrorResponse(error, "Le vendeur n'a pas pu être ajouté");
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
