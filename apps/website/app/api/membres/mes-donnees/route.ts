import { PRIVACY_CONTACT_EMAIL } from "@/lib/contact";
import { collectMemberData, exportFileName } from "@/lib/memberData";
import { checkAuthorization } from "@/utils/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * « Télécharger mes données » (#354): the signed-in member's own data as a
 * JSON file. No parameter: the member is the one the session (cookie, or the
 * app's bearer token) belongs to, and lib/memberData.ts filters every read on
 * that id.
 */
export async function GET() {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const now = new Date();
    const data = await collectMemberData(
      // Several tables have no policy for members; the service role reads
      // them and collectMemberData keeps only this member's rows.
      createAdminClient() as unknown as SupabaseClient,
      auth.user,
      PRIVACY_CONTACT_EMAIL,
      now,
    );

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exportFileName(now)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[api/membres/mes-donnees] Export failed:", error);
    return NextResponse.json(
      { error: "L’export de vos données a échoué" },
      { status: 500 },
    );
  }
}
