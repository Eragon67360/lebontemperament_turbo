// app/api/invite-users/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/admin";
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

function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size),
  );
}

interface InvitationResult {
  email: string;
  displayName: string;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const BATCH_SIZE = 10; // Process 10 emails at a time
    const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches

    const redirectTo =
      process.env.VERCEL_ENV === "production"
        ? "https://www.lebontemperament.com/auth/create-profile"
        : "https://dev.lebontemperament.com/auth/create-profile"; //replace with dev.lebontemperament.com

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
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const adminAuthClient = createAdminClient();
    const emailBatches = chunkArray(validationResult.data.emails, BATCH_SIZE);
    let allResults: InvitationResult[] = [];
    const totalInvitations = validationResult.data.emails.length;
    let processedCount = 0;

    for (const batch of emailBatches) {
      const batchResults = await Promise.all(
        batch.map(async ({ email, displayName }) => {
          try {
            const { error } =
              await adminAuthClient.auth.admin.inviteUserByEmail(email, {
                data: {
                  invited_by: validationResult.data.invitedBy,
                  display_name: displayName,
                },
                redirectTo: validationResult.data.redirectTo,
              });
            processedCount++;
            if (error) {
              return {
                email,
                displayName,
                success: false,
                error: error.message,
                progress: {
                  current: processedCount,
                  total: totalInvitations,
                  percentage: Math.round(
                    (processedCount / totalInvitations) * 100,
                  ),
                },
              };
            }

            return {
              email,
              displayName,
              success: true,
              progress: {
                current: processedCount,
                total: totalInvitations,
                percentage: Math.round(
                  (processedCount / totalInvitations) * 100,
                ),
              },
            };
          } catch (error) {
            processedCount++;
            return {
              email,
              displayName,
              success: false,
              error: error instanceof Error ? error.message : "Erreur inconnue",
              progress: {
                current: processedCount,
                total: totalInvitations,
                percentage: Math.round(
                  (processedCount / totalInvitations) * 100,
                ),
              },
            };
          }
        }),
      );

      allResults = [...allResults, ...batchResults];

      if (emailBatches.indexOf(batch) < emailBatches.length - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_BATCHES),
        );
      }
    }

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
