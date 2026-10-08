import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import { SLOT_COLUMNS, slotCreateSchema } from "@/utils/joining/schemas";
import {
  REVALIDATE,
  revalidateWebsiteAfterResponse,
} from "@/utils/revalidateWebsite";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/** POST: a new rehearsal slot, added at the end of the list unless told otherwise. */
export async function POST(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = parsePatchBody(slotCreateSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = await createClient();
  let sortOrder = parsed.data.sort_order;
  if (sortOrder === undefined) {
    const { data: last, error } = await supabase
      .from("joining_slots")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
    sortOrder = (last?.sort_order ?? 0) + 10;
  }

  const { data, error } = await supabase
    .from("joining_slots")
    .insert({
      ...parsed.data,
      sort_order: sortOrder,
      created_by: auth.user.id,
      updated_by: auth.user.id,
    })
    .select(SLOT_COLUMNS)
    .single();

  if (error) {
    console.error("Error creating joining_slots row:", error);
    return NextResponse.json(
      { error: "L'horaire n'a pas pu être enregistré" },
      { status: 500 },
    );
  }

  if (data.status === "published") {
    revalidateWebsiteAfterResponse(REVALIDATE.joiningSlots);
  }
  return NextResponse.json(data, { status: 201 });
}
