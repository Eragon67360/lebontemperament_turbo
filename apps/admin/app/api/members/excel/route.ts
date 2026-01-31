// app/api/members/excel/route.ts
import { checkAuthorization } from "@/utils/auth";
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

export async function GET() {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const response = await fetch(EXCEL_CSV_URL);
    if (!response.ok) {
      throw new Error("Failed to fetch Excel data");
    }

    const text = await response.text();
    const result = Papa.parse<ExcelMember>(text, { header: true });

    if (!result.data) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    // Filter out empty rows and normalize data
    const validData = result.data
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
    console.error("Error fetching Excel members:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des membres Excel" },
      { status: 500 },
    );
  }
}
