import { checkAuthorization } from "@/utils/auth";
import { loadMessageSummaries, NO_MESSAGES } from "@/utils/bug-reports/inbox";
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
  const userId = authCheck.user.id;

  // Check if user is superadmin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const isSuperAdmin = profile?.role === "superadmin";

  let bugReportIds: string[];

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

  // The messages of every report in one query: count, last one, unread.
  const messages = await loadMessageSummaries(
    supabase,
    userId,
    bugReports.map((report) => report.id),
  );
  if (!messages.ok) {
    return NextResponse.json(
      { error: messages.error.message },
      { status: 500 },
    );
  }

  const transformedData = bugReports.map((report) => ({
    ...report,
    profiles: Array.isArray(report.profiles)
      ? report.profiles[0]
      : report.profiles,
    ...(messages.summaries.get(report.id) ?? NO_MESSAGES),
  }));

  return NextResponse.json(transformedData);
}
