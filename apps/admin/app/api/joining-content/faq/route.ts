import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import { FAQ_COLUMNS, faqCreateSchema } from "@/utils/joining/schemas";
import {
  REVALIDATE,
  revalidateWebsiteAfterResponse,
} from "@/utils/revalidateWebsite";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/** POST: a new question, added at the end of the list unless told otherwise. */
export async function POST(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = parsePatchBody(faqCreateSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = await createClient();
  let sortOrder = parsed.data.sort_order;
  if (sortOrder === undefined) {
    const { data: last, error } = await supabase
      .from("faq_items")
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
    .from("faq_items")
    .insert({
      ...parsed.data,
      sort_order: sortOrder,
      created_by: auth.user.id,
      updated_by: auth.user.id,
    })
    .select(FAQ_COLUMNS)
    .single();

  if (error) {
    console.error("Error creating faq_items row:", error);
    return NextResponse.json(
      { error: "La question n'a pas pu être enregistrée" },
      { status: 500 },
    );
  }

  if (data.status === "published") {
    revalidateWebsiteAfterResponse(REVALIDATE.faq);
  }
  return NextResponse.json(data, { status: 201 });
}
