// app/api/users/voice/route.ts
//
// An admin sets a member's voices (a member has none, one or several). The
// member list stays the first source: when it says otherwise, the next
// synchronisation proposes its value, and an empty cell there never clears
// what is set here.
import { checkAuthorization } from "@/utils/auth";
import { parseVoiceUpdate } from "@/utils/members/voice";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json().catch(() => null)) as {
      userId?: unknown;
      voices?: unknown;
    } | null;
    const userId = body?.userId;
    if (typeof userId !== "string" || userId === "") {
      return NextResponse.json(
        { error: "Le membre est requis." },
        { status: 400 },
      );
    }
    const parsed = parseVoiceUpdate(body?.voices);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ voice: parsed.voice })
      .eq("id", userId)
      .select("id");
    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Ce compte n'existe pas." },
        { status: 404 },
      );
    }

    return NextResponse.json({ voice: parsed.voice });
  } catch (error) {
    console.error("Error updating the voice:", error);
    return NextResponse.json(
      { error: "La voix n'a pas pu être enregistrée." },
      { status: 500 },
    );
  }
}
