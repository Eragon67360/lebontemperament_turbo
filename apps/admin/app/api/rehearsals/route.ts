// app/api/rehearsals/route.ts
import { REHEARSAL_COLUMNS } from "@/lib/columns";
import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import { databaseErrorResponse } from "@/utils/databaseErrors";
import {
  rehearsalCreateSchema,
  rehearsalSeriesSchema,
} from "@/utils/season/apiSchemas";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  try {
    // Session client: rehearsals are readable under RLS (the members' app
    // reads them the same way), so the service role isn't needed here.
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("rehearsals")
      .select(REHEARSAL_COLUMNS)
      .order("date", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error fetching rehearsals" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  // One rehearsal, or one row per date of a weekly series: only the form's
  // columns, each value checked.
  const body = await readJson(request);
  const parsed = Array.isArray(body)
    ? parsePatchBody(rehearsalSeriesSchema, body)
    : parsePatchBody(rehearsalCreateSchema, body);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: parsed.status },
    );
  }

  try {
    const supabase = await createClient();
    const json = parsed.data;

    // Check if it's an array (bulk insert) or single object
    if (Array.isArray(json)) {
      // Bulk insert
      const { data, error } = await supabase
        .from("rehearsals")
        .insert(json)
        .select(REHEARSAL_COLUMNS);

      if (error) throw error;

      return NextResponse.json(data, { status: 201 });
    } else {
      // Single insert
      const { data, error } = await supabase
        .from("rehearsals")
        .insert([json])
        .select(REHEARSAL_COLUMNS)
        .single();

      if (error) throw error;

      return NextResponse.json(data, { status: 201 });
    }
  } catch (error) {
    return databaseErrorResponse(
      error,
      "Erreur lors de la création de la répétition",
    );
  }
}
