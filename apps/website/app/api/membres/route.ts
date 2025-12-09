// app/api/membres/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

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

    // Transform profiles to match the expected Member interface
    const members = profiles
      .filter((profile) => profile.email) // Only include profiles with email
      .map((profile) => ({
        "NOM Prénom": profile.display_name || profile.email.split("@")[0] || "",
        "Adresse mail": profile.email || "",
        "Adresse postale": profile.address || "",
        Domicile: profile.home_phone || "",
        Portable: profile.mobile_phone || "",
        Voix: profile.voice || "",
        photoUrl: profile.profile_picture_url || undefined,
      }));

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error in membres API:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
