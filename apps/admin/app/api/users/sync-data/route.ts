// app/api/users/sync-data/route.ts
import { checkAuthorization } from "@/utils/auth";
import { fetchRosterRows, RosterSourceError } from "@/utils/roster/source";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

// One row of the roster sheet, keyed by its header row (see
// utils/roster/source.ts). Cells are strings; a column missing from the sheet
// reads as undefined.
type ExcelMember = Partial<
  Record<
    | "NOM Prénom"
    | "Adresse mail"
    | "Adresse postale"
    | "Domicile"
    | "Portable"
    | "Voix",
    string
  >
>;

export async function POST(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = createAdminClient();
    const { userIds } = await request.json();

    // If userIds provided, sync only those users. Otherwise, sync all users that exist in Excel
    if (userIds && !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: "userIds must be an array" },
        { status: 400 },
      );
    }

    // Fetch the roster (private sheet, read with the service account)
    const rosterRows: ExcelMember[] = await fetchRosterRows();

    // Normalize Excel data
    const excelMembers = rosterRows
      .filter(
        (member) =>
          member["NOM Prénom"]?.trim() && member["Adresse mail"]?.trim(),
      )
      .map((member) => ({
        name: member["NOM Prénom"]?.trim() || "",
        email: member["Adresse mail"]?.trim().toLowerCase() || "",
        address: member["Adresse postale"]?.trim() || "",
        homePhone: member.Domicile?.trim() || "",
        mobilePhone: member.Portable?.trim() || "",
        voice: member.Voix?.trim() || "",
      }))
      .filter((member) => member.email);

    // Fetch users to sync
    let query = supabaseAdmin
      .from("profiles")
      .select(
        "id, email, display_name, address, home_phone, mobile_phone, voice",
      );

    if (userIds && userIds.length > 0) {
      query = query.in("id", userIds);
    }

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      return NextResponse.json(
        { error: "No users found to sync" },
        { status: 404 },
      );
    }

    // Sync each user with Excel data
    const updates: string[] = [];
    const skipped: string[] = [];
    const unchanged: string[] = [];

    for (const profile of profiles) {
      const excelMember = excelMembers.find(
        (em) => em.email === profile.email?.toLowerCase(),
      );

      if (excelMember) {
        const updateData: {
          address?: string;
          home_phone?: string;
          mobile_phone?: string;
          voice?: string;
        } = {};

        // Only include fields that are different from current values
        const currentAddress = (profile.address || "").trim();
        const excelAddress = (excelMember.address || "").trim();
        if (excelAddress && currentAddress !== excelAddress) {
          updateData.address = excelAddress;
        }

        const currentHomePhone = (profile.home_phone || "").trim();
        const excelHomePhone = (excelMember.homePhone || "").trim();
        if (excelHomePhone && currentHomePhone !== excelHomePhone) {
          updateData.home_phone = excelHomePhone;
        }

        const currentMobilePhone = (profile.mobile_phone || "").trim();
        const excelMobilePhone = (excelMember.mobilePhone || "").trim();
        if (excelMobilePhone && currentMobilePhone !== excelMobilePhone) {
          updateData.mobile_phone = excelMobilePhone;
        }

        const currentVoice = (profile.voice || "").trim();
        const excelVoice = (excelMember.voice || "").trim();
        if (excelVoice && currentVoice !== excelVoice) {
          updateData.voice = excelVoice;
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update(updateData)
            .eq("id", profile.id);

          if (updateError) {
            console.error(`Error updating user ${profile.id}:`, updateError);
            skipped.push(profile.id);
          } else {
            updates.push(profile.id);
          }
        } else {
          // No changes needed - data already matches
          unchanged.push(profile.id);
        }
      } else {
        skipped.push(profile.id);
      }
    }

    return NextResponse.json({
      message: `${updates.length} utilisateur(s) synchronisé(s)`,
      updated: updates.length,
      unchanged: unchanged.length,
      skipped: skipped.length,
    });
  } catch (error) {
    if (error instanceof RosterSourceError) {
      console.error(`Roster source (${error.code}):`, error.message);
      return NextResponse.json(
        { error: error.userMessage },
        { status: error.status },
      );
    }
    console.error("Error syncing user data:", error);
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation des données" },
      { status: 500 },
    );
  }
}
