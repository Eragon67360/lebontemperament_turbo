// app/api/membres/route.ts
import { checkAuthorization } from "@/utils/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";
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
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    // Fetch all profiles - all authenticated users can read profiles
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select(
        "id, email, display_name, address, home_phone, mobile_phone, voice, profile_picture_url",
      )
      .order("display_name", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("Error fetching members:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des membres" },
        { status: 500 },
      );
    }

    if (!profiles) {
      return NextResponse.json([], { status: 200 });
    }

    // Function to get all auth users with pagination
    const getAllAuthUsers = async () => {
      let allUsers: User[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const {
          data: { users },
          error,
        } = await supabaseAdmin.auth.admin.listUsers({
          page: page,
          perPage: 50,
        });

        if (error) {
          console.error(`Error fetching users page ${page}:`, error);
          // Continue without Google avatars if we can't fetch auth users
          break;
        }

        if (!users || users.length === 0) {
          hasMore = false;
        } else {
          allUsers = [...allUsers, ...users];
          page++;
        }
      }

      return allUsers;
    };

    // Fetch auth users to get Google avatars
    const authUsers = await getAllAuthUsers().catch((error) => {
      console.error("Error fetching auth users:", error);
      return [];
    });

    // Transform profiles to match the expected Member interface
    const members = profiles
      .filter((profile) => profile.email) // Only include profiles with email
      .map((profile) => {
        // Find matching auth user to get Google avatar
        const authUser = authUsers.find((au) => au.id === profile.id);
        const googleAvatar = authUser?.user_metadata?.avatar_url;

        // Prioritize: profile_picture_url > Google avatar > undefined
        const photoUrl =
          profile.profile_picture_url || googleAvatar || undefined;

        return {
          "NOM Prénom":
            profile.display_name || profile.email.split("@")[0] || "",
          "Adresse mail": profile.email || "",
          "Adresse postale": profile.address || "",
          Domicile: profile.home_phone || "",
          Portable: profile.mobile_phone || "",
          Voix: profile.voice || "",
          photoUrl,
        };
      });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error in membres API:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
