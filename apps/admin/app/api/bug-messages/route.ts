import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import {
  bugMessageCreateSchema,
  bugMessageDeleteSchema,
  bugMessagePatchSchema,
} from "@/utils/bug-reports/apiSchemas";
import { databaseErrorResponse } from "@/utils/databaseErrors";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  const { searchParams } = new URL(request.url);
  const bug_report_id = searchParams.get("bug_report_id");

  if (!bug_report_id) {
    return NextResponse.json(
      { error: "bug_report_id is required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bug_messages")
    .select(
      `
      *,
      sender:profiles!sender_id(email, display_name)
    `,
    )
    .eq("bug_report_id", bug_report_id)
    .order("created_at", { ascending: true });

  if (error) {
    return databaseErrorResponse(
      error,
      "Les messages n'ont pas pu être chargés",
    );
  }

  // Transform the data to match the expected structure
  const transformedData = data.map((message) => ({
    ...message,
    sender: Array.isArray(message.sender) ? message.sender[0] : message.sender,
  }));

  return NextResponse.json(transformedData);
}

export async function POST(request: Request) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  // The report and the text only: the sender and receiver are set below.
  const parsed = parsePatchBody(
    bugMessageCreateSchema,
    await readJson(request),
  );
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: parsed.status },
    );
  }
  const messageData = parsed.data;
  const supabase = await createClient();
  const currentUserId = authCheck.user.id;

  try {
    // Get the bug report to determine receiver_id
    const { data: bugReport, error: bugReportError } = await supabase
      .from("bug_reports")
      .select("reported_by")
      .eq("id", messageData.bug_report_id)
      .single();

    if (bugReportError) throw bugReportError;

    // Determine receiver_id:
    // If current user is the reporter, find the last admin who messaged them
    // If current user is admin, receiver is the reporter
    let receiver_id: string | null = null;

    if (currentUserId === bugReport.reported_by) {
      // User is replying - find the last admin/superadmin who sent a message
      const { data: lastAdminMessage } = await supabase
        .from("bug_messages")
        .select("sender_id")
        .eq("bug_report_id", messageData.bug_report_id)
        .neq("sender_id", currentUserId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      receiver_id = lastAdminMessage?.sender_id || null;
    } else {
      // Admin is sending - receiver is the reporter
      receiver_id = bugReport.reported_by;
    }

    const { data: newMessage, error: messageError } = await supabase
      .from("bug_messages")
      .insert([
        {
          ...messageData,
          sender_id: currentUserId,
          receiver_id,
        },
      ])
      .select(
        `
        *,
        sender:profiles!sender_id(email, display_name)
      `,
      )
      .single();

    if (messageError) throw messageError;

    // Transform the sender data
    const transformedMessage = {
      ...newMessage,
      sender: Array.isArray(newMessage.sender)
        ? newMessage.sender[0]
        : newMessage.sender,
    };

    return NextResponse.json(transformedMessage);
  } catch (error) {
    return databaseErrorResponse(
      error,
      "Erreur lors de la création du message",
    );
  }
}

export async function PATCH(request: Request) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  // The text only: unknown keys are refused.
  const parsed = parsePatchBody(bugMessagePatchSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: parsed.status },
    );
  }
  const { id, ...updateData } = parsed.data;
  const supabase = await createClient();

  // Check if the user is the sender of the message
  const { data: existingMessage, error: fetchError } = await supabase
    .from("bug_messages")
    .select("sender_id")
    .eq("id", id)
    .single();

  if (fetchError) {
    return databaseErrorResponse(
      fetchError,
      "Erreur lors de la modification du message",
    );
  }

  if (existingMessage.sender_id !== authCheck.user.id) {
    return NextResponse.json(
      { error: "Vous n'êtes pas autorisé à modifier ce message" },
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .from("bug_messages")
    .update(updateData)
    .eq("id", id)
    .select(
      `
      *,
      sender:profiles!sender_id(email, display_name)
    `,
    )
    .single();

  if (error) {
    return databaseErrorResponse(
      error,
      "Erreur lors de la modification du message",
    );
  }

  // Transform the sender data
  const transformedMessage = {
    ...data,
    sender: Array.isArray(data.sender) ? data.sender[0] : data.sender,
  };

  return NextResponse.json(transformedMessage);
}

export async function DELETE(request: Request) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  const parsed = parsePatchBody(
    bugMessageDeleteSchema,
    await readJson(request),
  );
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: parsed.status },
    );
  }
  const { id } = parsed.data;
  const supabase = await createClient();

  try {
    // Check if the user is the sender of the message
    const { data: existingMessage, error: fetchError } = await supabase
      .from("bug_messages")
      .select("sender_id")
      .eq("id", id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (existingMessage.sender_id !== authCheck.user.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à supprimer ce message" },
        { status: 403 },
      );
    }

    // Delete the message
    const { error: deleteError } = await supabase
      .from("bug_messages")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return databaseErrorResponse(
      error,
      "Erreur lors de la suppression du message",
    );
  }
}
