// app/api/membres/route.ts
import { loadMemberDirectory } from "@/lib/memberDirectory";
import { checkAuthorization } from "@/utils/auth";
import { createAdminClient } from "@/utils/supabase/admin";
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
    // Acts as the caller (cookie session or the app's bearer token).
    const supabase = authCheck.supabase;
    const supabaseAdmin = createAdminClient();

    // Members see each other's name, email, voice and photo only (owner
    // decision on #350). Phones and postal address stay in the admin.
    const { rows: profiles, error } = await loadMemberDirectory(
      supabase,
      supabaseAdmin,
    );

    if (error) {
      console.error("Error fetching members:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des membres" },
        { status: 500 },
      );
    }

    // Transform profiles to match the expected Member interface
    const members = profiles
      .filter((profile) => profile.email) // Only include profiles with email
      .map((profile) => {
        // Prioritize: profile_picture_url > Google avatar > undefined
        const photoUrl =
          profile.profile_picture_url || profile.auth_avatar_url || undefined;

        return {
          "NOM Prénom":
            profile.display_name || profile.email?.split("@")[0] || "",
          "Adresse mail": profile.email || "",
          Voix: profile.voice || "",
          photoUrl,
        };
      });

    return NextResponse.json(members, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Error in membres API:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
