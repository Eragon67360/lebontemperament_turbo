import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  const supabase = await createClient();
  const userId = authCheck?.user?.id;

  // Check if user is superadmin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const isSuperAdmin = profile?.role === "superadmin";

  let bugReportIds: string[] = [];

  if (isSuperAdmin) {
    // For superadmins: get all bug reports where they have sent or received messages
    const { data: messagesData, error: messagesError } = await supabase
      .from("bug_messages")
      .select("bug_report_id")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (messagesError) {
      return NextResponse.json(
        { error: messagesError.message },
        { status: 500 },
      );
    }

    // Get unique bug report IDs
    bugReportIds = [...new Set(messagesData.map((m) => m.bug_report_id))];
  } else {
    // For regular users: get bug reports they created
    const { data: userReports, error: reportsError } = await supabase
      .from("bug_reports")
      .select("id")
      .eq("reported_by", userId);

    if (reportsError) {
      return NextResponse.json(
        { error: reportsError.message },
        { status: 500 },
      );
    }

    bugReportIds = userReports.map((r) => r.id);
  }

  if (bugReportIds.length === 0) {
    return NextResponse.json([]);
  }

  // Get all bug reports
  const { data: bugReports, error: reportsError } = await supabase
    .from("bug_reports")
    .select(
      `
      *,
      profiles:reported_by(email, display_name)
    `,
    )
    .in("id", bugReportIds)
    .order("created_at", { ascending: false });

  if (reportsError) {
    return NextResponse.json({ error: reportsError.message }, { status: 500 });
  }

  // For each bug report, get the messages count and last message
  const transformedData = await Promise.all(
    bugReports.map(async (report) => {
      // Get messages for this report, ordered by created_at
      const { data: messages, error: messagesError } = await supabase
        .from("bug_messages")
        .select("id, created_at, message, sender_id, is_read")
        .eq("bug_report_id", report.id)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
      }

      const messagesList = messages || [];
      const lastMessage =
        messagesList.length > 0 ? messagesList[messagesList.length - 1] : null;

      // Count unread messages where current user is the receiver and is_read = false
      const { count: unreadCount } = await supabase
        .from("bug_messages")
        .select("*", { count: "exact", head: true })
        .eq("bug_report_id", report.id)
        .eq("receiver_id", userId)
        .eq("is_read", false);

      return {
        ...report,
        profiles: Array.isArray(report.profiles)
          ? report.profiles[0]
          : report.profiles,
        last_message: lastMessage,
        message_count: messagesList.length,
        unread_count: unreadCount || 0,
      };
    }),
  );

  return NextResponse.json(transformedData);
}
