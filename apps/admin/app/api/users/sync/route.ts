// app/api/users/sync/route.ts
import { checkAuthorization } from "@/utils/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Papa from "papaparse";

interface ExcelMember {
  "NOM Prénom": string;
  "Adresse mail": string;
  "Adresse postale": string;
  Domicile: string;
  Portable: string;
  Voix: string;
}

if (!process.env.NEXT_EXCEL_CSV_URL) {
  throw Error("NO EXCEL URL FOUND");
}

const EXCEL_CSV_URL = process.env.NEXT_EXCEL_CSV_URL;

interface SyncResult {
  missingInDatabase: Array<{
    name: string;
    email: string;
    address: string;
    homePhone: string;
    mobilePhone: string;
    voice: string;
  }>;
  missingInExcel: Array<{
    id: string;
    email: string;
    display_name: string | null;
    invite_status: string;
  }>;
  matched: number;
}

export async function GET() {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = createAdminClient();

    // Fetch Excel data
    const excelResponse = await fetch(EXCEL_CSV_URL);
    if (!excelResponse.ok) {
      throw new Error("Failed to fetch Excel data");
    }

    const text = await excelResponse.text();
    const result = Papa.parse<ExcelMember>(text, { header: true });

    if (!result.data) {
      return NextResponse.json(
        { error: "No Excel data found" },
        { status: 404 },
      );
    }

    // Normalize Excel data
    const excelMembers = result.data
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

    // Fetch all database users
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, email, display_name, address, home_phone, mobile_phone, voice",
      );

    if (profilesError) throw profilesError;

    // Get all auth users to check invite status
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

        if (error) throw error;

        if (!users || users.length === 0) {
          hasMore = false;
        } else {
          allUsers = [...allUsers, ...users];
          page++;
        }
      }

      return allUsers;
    };

    const authUsers = await getAllAuthUsers();

    // Enrich profiles with invite status
    const enrichedProfiles = profiles?.map((profile) => {
      const authUser = authUsers.find((au) => au.id === profile.id);
      let invite_status: "en attente" | "approuvé" = "en attente";

      if (authUser) {
        if (
          (authUser.invited_at && authUser.confirmed_at) ||
          authUser.email_confirmed_at
        ) {
          invite_status = "approuvé";
        }
      }

      return {
        ...profile,
        invite_status,
      };
    });

    // Find members in Excel but not in database
    const missingInDatabase = excelMembers.filter(
      (excelMember) =>
        !enrichedProfiles?.some(
          (profile) => profile.email?.toLowerCase() === excelMember.email,
        ),
    );

    // Find users in database but not in Excel (only those with status != "approuvé")
    const missingInExcel =
      enrichedProfiles?.filter(
        (profile) =>
          profile.invite_status !== "approuvé" &&
          !excelMembers.some(
            (excelMember) => excelMember.email === profile.email?.toLowerCase(),
          ),
      ) || [];

    // Count matched users
    const matched = excelMembers.filter((excelMember) =>
      enrichedProfiles?.some(
        (profile) => profile.email?.toLowerCase() === excelMember.email,
      ),
    ).length;

    const syncResult: SyncResult = {
      missingInDatabase,
      missingInExcel: missingInExcel.map((p) => ({
        id: p.id,
        email: p.email || "",
        display_name: p.display_name,
        invite_status: p.invite_status,
      })),
      matched,
    };

    return NextResponse.json(syncResult);
  } catch (error) {
    console.error("Error syncing users:", error);
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = createAdminClient();
    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: "userIds array is required" },
        { status: 400 },
      );
    }

    // Fetch Excel data
    const excelResponse = await fetch(EXCEL_CSV_URL);
    if (!excelResponse.ok) {
      throw new Error("Failed to fetch Excel data");
    }

    const text = await excelResponse.text();
    const result = Papa.parse<ExcelMember>(text, { header: true });

    if (!result.data) {
      return NextResponse.json(
        { error: "No Excel data found" },
        { status: 404 },
      );
    }

    // Normalize Excel data
    const excelMembers = result.data
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
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, address, home_phone, mobile_phone, voice")
      .in("id", userIds);

    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ error: "No users found" }, { status: 404 });
    }

    // Sync each user with Excel data
    const updates: string[] = [];
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
          } else {
            updates.push(profile.id);
          }
        } else {
          // No changes needed - data already matches
          unchanged.push(profile.id);
        }
      }
    }

    return NextResponse.json({
      message: `${updates.length} utilisateur(s) synchronisé(s)`,
      updated: updates.length,
      unchanged: unchanged.length,
    });
  } catch (error) {
    console.error("Error syncing users:", error);
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation" },
      { status: 500 },
    );
  }
}
