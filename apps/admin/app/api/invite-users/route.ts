// app/api/invite-users/route.ts
import { checkAuthorization } from "@/utils/auth";
import { inviteRedirectUrl, sendInvitations } from "@/utils/invitations";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// Input validation schema
const invitationSchema = z.object({
  emails: z.array(
    z.object({
      email: z.string().email("Format d'email invalide"),
      displayName: z.string().min(1, "Le nom complet est requis"),
    }),
  ),
  invitedBy: z.string().email(),
  redirectTo: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Inviting creates accounts: admins and superadmins only.
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const user = auth.user;

    const body = await request.json();
    const redirectTo = inviteRedirectUrl();

    const validationResult = invitationSchema.safeParse({
      emails: body.emails.map(
        (entry: { email: string; displayName: string }) => ({
          email: entry.email,
          displayName: entry.displayName,
        }),
      ),
      invitedBy: user.email || "admin@lebontemperament.com",
      redirectTo,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation échouée",
          details: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

    // Same sender as the roster sync: batches of 10, a pause between them.
    const allResults = await sendInvitations(
      createAdminClient(),
      validationResult.data.emails,
      {
        invitedBy: validationResult.data.invitedBy,
        redirectTo: validationResult.data.redirectTo ?? redirectTo,
      },
    );

    const successfulInvitations = allResults.filter((result) => result.success);
    const failedInvitations = allResults.filter((result) => !result.success);

    return NextResponse.json({
      invitationResults: allResults,
      summary: {
        total: allResults.length,
        successful: successfulInvitations.length,
        failed: failedInvitations.length,
      },
    });
  } catch (error) {
    console.error("Invitation error:", error);
    return NextResponse.json({ error: "Erreur du serveur" }, { status: 500 });
  }
}
