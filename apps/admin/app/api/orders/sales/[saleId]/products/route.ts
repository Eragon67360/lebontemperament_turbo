import {
  dbErrorResponse,
  readJson,
  requireSuperadmin,
  saleProductIds,
} from "@/utils/orders/server";
import { createClient } from "@/utils/supabase/server";
import { isUuid, parseProductInput } from "@repo/domain/utils/orders";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ saleId: string }> };

// A function: a Response body can only be read once, so each request
// needs its own.
const unknown = () =>
  NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

/** POST: a product added at the end of the sale's catalogue. */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;
  const { saleId } = await params;
  if (!isUuid(saleId)) return unknown();

  const parsed = parseProductInput(await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, field: parsed.field },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: last, error: lastError } = await supabase
    .from("order_products")
    .select("display_order")
    .eq("sale_id", saleId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) {
    return dbErrorResponse(lastError, "Le catalogue n'a pas pu être lu");
  }

  const { data, error } = await supabase
    .from("order_products")
    .insert({
      ...parsed.value,
      sale_id: saleId,
      display_order: (last?.display_order ?? 0) + 10,
    })
    .select("*")
    .single();
  if (error) {
    return dbErrorResponse(error, "Le produit n'a pas pu être ajouté");
  }
  return NextResponse.json(data, { status: 201 });
}

/**
 * PUT `{ ids: string[] }`: the catalogue's new order, every product of the
 * sale listed once. The categories stay as they are: products are moved
 * within the list, and the page groups them again.
 */
export async function PUT(request: Request, { params }: Params) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;
  const { saleId } = await params;
  if (!isUuid(saleId)) return unknown();

  const body = await readJson(request);
  const ids =
    typeof body === "object" && body !== null && "ids" in body
      ? (body as { ids: unknown }).ids
      : undefined;
  if (!Array.isArray(ids) || !ids.every(isUuid)) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const supabase = await createClient();
  const known = await saleProductIds(supabase, saleId);
  if (!known.ok) return known.response;
  if (
    ids.length !== known.ids.size ||
    new Set(ids).size !== ids.length ||
    !ids.every((id) => known.ids.has(id))
  ) {
    return NextResponse.json(
      { error: "La liste ne correspond pas au catalogue de cette vente" },
      { status: 400 },
    );
  }

  const results = await Promise.all(
    ids.map((id, index) =>
      supabase
        .from("order_products")
        .update({ display_order: (index + 1) * 10 })
        .eq("id", id)
        .eq("sale_id", saleId),
    ),
  );
  const failed = results.find((r) => r.error)?.error;
  if (failed) {
    return dbErrorResponse(failed, "L'ordre n'a pas pu être enregistré");
  }
  return NextResponse.json({ ok: true });
}
