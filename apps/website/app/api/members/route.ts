import { addGroupMember, getGroupMembers } from "@/lib/googleApi";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const groupEmail = process.env.GOOGLE_GROUP_EMAIL;
    if (!groupEmail) {
      return NextResponse.json(
        { error: "Group email not set" },
        { status: 400 }
      );
    }
    const members = await getGroupMembers(groupEmail);
    return NextResponse.json(members, { status: 200 });
  } catch (error) {
    console.error("Error fetching group members:", error);
    return NextResponse.json(
      { error: "Error fetching group members" },
      { status: 500 }
    );
  }
}

export async function POST() {
  const groupEmail =
    process.env.GOOGLE_GROUP_EMAIL || "btnewsletter@googlegroups.com";
  const email = "thomas-moser@orange.fr"; // You may want to parse this from the request body in a real scenario

  try {
    await addGroupMember(groupEmail, email);
    return NextResponse.json({ message: "Subscribed successfully!" });
  } catch (error) {
    console.error("Error in POST /api/group:", error);
    return NextResponse.json(
      { message: "Failed to subscribe", error: error },
      { status: 500 }
    );
  }
}
