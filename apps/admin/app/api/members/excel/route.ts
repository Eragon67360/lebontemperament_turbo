// app/api/members/excel/route.ts
import { checkAuthorization } from "@/utils/auth";
import { fetchRosterRows, RosterSourceError } from "@/utils/roster/source";
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

export async function GET() {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Fetch the roster (private sheet, read with the service account)
    const rosterRows: ExcelMember[] = await fetchRosterRows();

    // Filter out empty rows and normalize data
    const validData = rosterRows
      .filter((member) => member["NOM Prénom"]?.trim())
      .map((member) => ({
        name: member["NOM Prénom"]?.trim() || "",
        email: member["Adresse mail"]?.trim().toLowerCase() || "",
        address: member["Adresse postale"]?.trim() || "",
        homePhone: member.Domicile?.trim() || "",
        mobilePhone: member.Portable?.trim() || "",
        voice: member.Voix?.trim() || "",
      }))
      .filter((member) => member.email); // Only include members with email

    return NextResponse.json(validData);
  } catch (error) {
    if (error instanceof RosterSourceError) {
      console.error(`Roster source (${error.code}):`, error.message);
      return NextResponse.json(
        { error: error.userMessage },
        { status: error.status },
      );
    }
    console.error("Error fetching Excel members:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des membres Excel" },
      { status: 500 },
    );
  }
}
