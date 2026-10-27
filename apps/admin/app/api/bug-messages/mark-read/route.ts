import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import { markReadSchema } from "@/utils/bug-reports/apiSchemas";
import { databaseErrorResponse } from "@/utils/databaseErrors";
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

  const parsed = parsePatchBody(markReadSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: parsed.status },
    );
  }
  const { bug_report_id } = parsed.data;
  const currentUserId = authCheck.user.id;

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
    return databaseErrorResponse(
      error,
      "Les messages n'ont pas pu être marqués comme lus",
    );
  }
}
