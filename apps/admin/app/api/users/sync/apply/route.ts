// app/api/users/sync/apply/route.ts
//
// Applies what the admin chose on the review page (#462): profile updates on
// roster-owned fields and invitations for new members. The roster is read
// again and the request is refused (409) when its fingerprint changed. Any
// admin may apply (owner decision, #433); writes go through the service-role
// client after the admin check, as the previous sync routes did.
import { checkAuthorization } from "@/utils/auth";
import { inviteRedirectUrl, sendInvitations } from "@/utils/invitations";
import { applyRosterSync, parseApplyRequest } from "@/utils/roster/apply";
import { buildRosterReview, loadProfilesForDiff } from "@/utils/roster/review";
import { fetchRosterRows, RosterSourceError } from "@/utils/roster/source";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

// Invitations go out in throttled batches: 100 members take over 10 s.
export const maxDuration = 60;

const UPDATE_FAILED = "La base de données a refusé la mise à jour.";

export async function POST(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const parsed = parseApplyRequest(await request.json().catch(() => null));
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const adminId = auth.user.id;

    const outcome = await applyRosterSync(parsed.request, {
      buildReview: () =>
        buildRosterReview({
          fetchRosterRows,
          loadProfiles: () => loadProfilesForDiff(supabaseAdmin),
        }),

      updateProfile: async (profileId, patch) => {
        const { error } = await supabaseAdmin
          .from("profiles")
          .update(patch)
          .eq("id", profileId);
        if (error) {
          console.error(
            `Roster sync: profile ${profileId} update failed:`,
            error,
          );
          return UPDATE_FAILED;
        }
        // The name also lives in the auth metadata (as PATCH /api/users/display-name does).
        if (patch.display_name !== undefined) {
          const { error: metadataError } =
            await supabaseAdmin.auth.admin.updateUserById(profileId, {
              user_metadata: { display_name: patch.display_name },
            });
          if (metadataError) {
            console.error(
              `Roster sync: auth metadata of ${profileId} not updated:`,
              metadataError,
            );
          }
        }
        return null;
      },

      sendInvitations: (entries) =>
        sendInvitations(supabaseAdmin, entries, {
          invitedBy: auth.user.email || "admin@lebontemperament.com",
          redirectTo: inviteRedirectUrl(),
        }),

      // `user_created` is the existing activity type that fits an invitation
      // (an auth user is created); the home feed shows the title and text.
      logInvitation: async ({ userId, email, displayName }) => {
        const { error } = await supabaseAdmin.from("activities").insert({
          type: "user_created",
          user_id: adminId,
          target_id: userId ?? null,
          title: "Invitation envoyée",
          description: `${displayName} a été invité·e depuis la liste des membres`,
          metadata: {
            source: "roster_sync",
            invited_user_id: userId ?? null,
            invited_user_email: email,
          },
        });
        if (error) console.error("Roster sync: invitation not logged:", error);
      },

      // No activity type fits a profile update yet (part 2 adds one with its
      // migration); until then the server log keeps ids and field names only.
      logUpdate: ({ profileId, fields }) => {
        console.info(
          `Roster sync: profile ${profileId} updated (${fields.join(", ")}) by ${adminId}`,
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
    console.error("Error applying the roster sync:", error);
    return NextResponse.json(
      { error: "L'application de la synchronisation a échoué." },
      { status: 500 },
    );
  }
}
