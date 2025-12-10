// app/api/check-group-member/route.ts
import { NextRequest, NextResponse } from "next/server";

const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;
const GROUP_EMAIL =
  process.env.GOOGLE_GROUP_EMAIL || "btnewsletter@googlegroups.com";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 },
      );
    }

    if (!GOOGLE_APPS_SCRIPT_URL) {
      // If script URL is not configured, assume email is not in group
      // This allows the subscription flow to continue even if the check fails
      return NextResponse.json({ isMember: false });
    }

    // Fetch group members from Google Apps Script
    const url = new URL(GOOGLE_APPS_SCRIPT_URL);
    url.searchParams.append("groupEmail", GROUP_EMAIL);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // If the check fails, assume email is not in group to allow subscription
      console.error("Failed to check group membership:", response.statusText);
      return NextResponse.json({ isMember: false });
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      return NextResponse.json({ isMember: false });
    }

    // Check if the email is in the members list
    const members = data.data;
    const isMember = members.some((member: unknown) => {
      const memberEmail =
        typeof member === "string"
          ? member
          : (member as { email: string }).email;
      return memberEmail.toLowerCase() === email.toLowerCase();
    });

    return NextResponse.json({ isMember });
  } catch (error) {
    console.error("Error checking group membership:", error);
    // On error, assume email is not in group to allow subscription
    return NextResponse.json({ isMember: false });
  }
}
