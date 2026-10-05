// app/api/users/sync/route.ts
//
// The reviewed diff between the member roster and the accounts (#462):
// validation, groups (nouveaux, modifiés, absents de la liste, à régler) and
// the roster's fingerprint, which POST /api/users/sync/apply must echo.
// Read-only: nothing is written here.
import { checkAuthorization } from "@/utils/auth";
import { buildRosterReview, loadProfilesForDiff } from "@/utils/roster/review";
import { fetchRosterRows, RosterSourceError } from "@/utils/roster/source";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

// Reading the roster and paging through the auth users can exceed 10 s.
export const maxDuration = 30;

export async function GET() {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = createAdminClient();
    const { review } = await buildRosterReview({
      fetchRosterRows,
      loadProfiles: () => loadProfilesForDiff(supabaseAdmin),
    });
    return NextResponse.json(review);
  } catch (error) {
    if (error instanceof RosterSourceError) {
      console.error(`Roster source (${error.code}):`, error.message);
      return NextResponse.json(
        { error: error.userMessage },
        { status: error.status },
      );
    }
    console.error("Error building the roster review:", error);
    return NextResponse.json(
      { error: "La comparaison avec le tableau des membres a échoué." },
      { status: 500 },
    );
  }
}
