import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  const { bug_report_id } = await request.json();
  const currentUserId = authCheck?.user?.id;

  if (!bug_report_id) {
    return NextResponse.json(
      { error: "bug_report_id is required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    // Mark all messages in this conversation where current user is the receiver as read
    const { error } = await supabase
      .from("bug_messages")
      .update({ is_read: true })
      .eq("bug_report_id", bug_report_id)
      .eq("receiver_id", currentUserId)
      .eq("is_read", false);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 },
    );
  }
}
