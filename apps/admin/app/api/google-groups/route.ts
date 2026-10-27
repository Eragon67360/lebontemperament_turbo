// app/api/google-groups/route.ts
import { checkAuthorization } from "@/utils/auth";
import { appsScriptUrl } from "@/utils/google-groups/appsScript";
import { NextResponse } from "next/server";

const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

if (!GOOGLE_APPS_SCRIPT_URL) {
  console.warn(
    "GOOGLE_APPS_SCRIPT_URL is not set. Google Groups functionality will not work.",
  );
}

export async function GET(request: Request) {
  try {
    const auth = await checkAuthorization();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!GOOGLE_APPS_SCRIPT_URL) {
      return NextResponse.json(
        { error: "Google Apps Script URL not configured" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const groupEmail = searchParams.get("groupEmail");
    const action = searchParams.get("action"); // 'list-groups' to get all groups

    // The script's URL with these parameters and its key: never logged
    const url = appsScriptUrl(GOOGLE_APPS_SCRIPT_URL, { action, groupEmail });

    // Fetch from Google Apps Script
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch from Google Apps Script: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching Google Groups:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des membres du groupe",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
