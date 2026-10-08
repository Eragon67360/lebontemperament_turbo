import { PRIVACY_CONTACT_EMAIL } from "@/lib/contact";
import {
  deletionRequestEmails,
  parseDeletionNote,
} from "@/lib/deletionRequest";
import { createMailer } from "@/lib/mail";
import { checkAuthorization } from "@/utils/auth";
import { NextResponse } from "next/server";

const FAILED = {
  success: false,
  message:
    "La demande n’a pas pu être envoyée. Réessayez plus tard ou écrivez-nous.",
};

/**
 * « Demander la suppression de mon compte » (#354): e-mails the request to
 * the association's mailbox and an acknowledgement to the member. It deletes
 * nothing; see lib/deletionRequest.ts.
 */
export async function POST(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body: unknown = await request.json().catch(() => ({}));
  const note = parseDeletionNote(
    body && typeof body === "object" && "message" in body
      ? body.message
      : undefined,
  );
  if (note === false) {
    return NextResponse.json(
      { success: false, message: "Le message est trop long." },
      { status: 400 },
    );
  }

  const email = auth.user.email;
  if (!email) {
    return NextResponse.json(FAILED, { status: 400 });
  }

  const mailer = createMailer();
  if (!mailer) {
    console.error("[api/membres/demande-suppression] Email not configured");
    return NextResponse.json(FAILED, { status: 500 });
  }

  // The caller's own profile row (row-level security allows exactly that).
  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("display_name")
    .eq("id", auth.user.id)
    .maybeSingle();
  const metadata = auth.user.user_metadata ?? {};
  const name =
    profile?.display_name ||
    metadata.display_name ||
    metadata.full_name ||
    metadata.name ||
    null;

  const { toAssociation, toMember } = deletionRequestEmails(
    { id: auth.user.id, email, name },
    note,
    new Date(),
    process.env.VERCEL_ENV !== "production",
  );

  try {
    await mailer.transporter.sendMail({
      from: mailer.from,
      to: PRIVACY_CONTACT_EMAIL,
      replyTo: email,
      ...toAssociation,
    });
  } catch (error) {
    console.error("[api/membres/demande-suppression] Send failed:", error);
    return NextResponse.json(FAILED, { status: 500 });
  }

  try {
    await mailer.transporter.sendMail({
      from: mailer.from,
      to: email,
      replyTo: PRIVACY_CONTACT_EMAIL,
      ...toMember,
    });
  } catch (error) {
    // The association has the request; only the acknowledgement is missing.
    console.error("[api/membres/demande-suppression] Ack failed:", error);
  }

  return NextResponse.json({
    success: true,
    message: "Votre demande est envoyée.",
  });
}
