// app/api/users/sync/delete/route.ts
//
// Deletes the accounts the admin selected among « Absents de la liste » on the
// sync page (bulk version of DELETE /api/users, #354). Superadmin only, as for
// one account. The roster is read again and each account must still be absent
// from it; the request is refused (409) when the roster changed since the
// review. Writes go through the service-role client after the admin check.
// Production only (utils/memberLists.ts).
import { checkAuthorization } from "@/utils/auth";
import {
  memberListsAvailable,
  productionOnlyResponse,
  ROSTER_PRODUCTION_ONLY_MESSAGE,
} from "@/utils/memberLists";
import { deleteMemberAccount } from "@/utils/members/memberFiles";
import {
  deleteAbsentMembers,
  parseBulkDeleteRequest,
} from "@/utils/roster/bulkDelete";
import { buildRosterReview, loadProfilesForDiff } from "@/utils/roster/review";
import { fetchRosterRows, RosterSourceError } from "@/utils/roster/source";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

// Up to 50 accounts, each with a few Storage and Auth calls, after the roster
// re-read. 300 s is Vercel's default limit on Fluid compute.
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    if (!memberListsAvailable()) {
      return productionOnlyResponse(ROSTER_PRODUCTION_ONLY_MESSAGE);
    }

    const parsed = parseBulkDeleteRequest(
      await request.json().catch(() => null),
    );
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const adminId = auth.user.id;

    const outcome = await deleteAbsentMembers(parsed.request, {
      actor: { id: adminId, role: auth.role },
      buildReview: () =>
        buildRosterReview({
          fetchRosterRows,
          loadProfiles: () => loadProfilesForDiff(supabaseAdmin),
        }),
      deleteAccount: (profileId) =>
        deleteMemberAccount(supabaseAdmin, profileId),
      // Ids and role only: no activity type fits a deletion, and the feed
      // must not keep a former member's name (#354).
      logDeletion: ({ profileId, role }) => {
        console.info(
          `Roster sync: account ${profileId} (${role}) deleted by ${adminId}`,
        );
      },
    });

    return NextResponse.json(outcome.body, { status: outcome.status });
  } catch (error) {
    if (error instanceof RosterSourceError) {
      console.error(`Roster source (${error.code}):`, error.message);
      return NextResponse.json(
        { error: error.userMessage },
        { status: error.status },
      );
    }
    console.error("Error deleting the absent accounts:", error);
    return NextResponse.json(
      { error: "La suppression des comptes a échoué." },
      { status: 500 },
    );
  }
}
