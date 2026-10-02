import { CONTACT_EMAIL } from "@/lib/contact";
import { createMailer } from "@/lib/mail";
import type { Database } from "@repo/domain/database.types";
import { parseBearerToken } from "@repo/domain/utils/bearer";
import { escapeHtml, escapeHtmlWithBreaks } from "@repo/domain/utils/html";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Contract used by the mobile app (support_contact_screen.dart): POST
// { subject, message } with `Authorization: Bearer <access token>`; answers
// { success, message } and the app shows `message` on failure.

interface MobileContactBody {
  subject: string;
  message: string;
}

const SEND_FAILED = {
  success: false,
  message: "Une erreur est survenue lors de l'envoi du message",
};

export async function POST(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 },
      );
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user?.email) {
      return NextResponse.json(
        { success: false, message: "Session invalide ou expirée" },
        { status: 401 },
      );
    }

    const { subject, message } =
      (await request.json()) as Partial<MobileContactBody>;

    if (
      typeof subject !== "string" ||
      typeof message !== "string" ||
      !subject.trim() ||
      !message.trim()
    ) {
      console.warn(
        "[api/contact/mobile] Validation failed: subject or message empty",
      );
      return NextResponse.json(
        {
          success: false,
          message: "Le sujet et le message sont requis",
        },
        { status: 400 },
      );
    }

    if (message.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Le message doit contenir au moins 10 caractères",
        },
        { status: 400 },
      );
    }

    const mailer = createMailer();
    if (!mailer) {
      console.error("[api/contact/mobile] Email service not configured");
      return NextResponse.json(
        {
          success: false,
          message: "Service d'email non configuré",
        },
        { status: 500 },
      );
    }

    const displayName = user.user_metadata?.display_name as string | undefined;
    const firstName =
      displayName?.split(" ")[0] || user.email.split("@")[0] || "Utilisateur";

    // Send email to support
    await mailer.transporter.sendMail({
      from: mailer.from,
      to: CONTACT_EMAIL,
      subject: `[App] ${subject} - ${user.email}`,
      html: `
        <p><strong>Depuis l'application mobile</strong></p>
        <p>Nom / Prénom: ${escapeHtml(displayName ?? "Non renseigné")}</p>
        <p>Email: ${escapeHtml(user.email)}</p>
        <p>Sujet: ${escapeHtml(subject)}</p>
        <p>Message:</p>
        <p>${escapeHtmlWithBreaks(message)}</p>
      `,
    });

    // Send confirmation email to user
    await mailer.transporter.sendMail({
      from: mailer.from,
      to: user.email,
      subject: "Votre demande de contact a bien été envoyée",
      html: `
        <p>Bonjour ${escapeHtml(firstName)} !</p>
        <p>L'équipe du Bon Tempérament vous remercie pour votre demande de contact. Nous traiterons votre demande dans les meilleurs délais.</p>
        <p>Chaleureusement et musicalement,</p>
        <p>L'équipe <strong>Le Bon Tempérament</strong></p>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Votre demande de contact a bien été envoyée",
    });
  } catch (error) {
    console.error("[api/contact/mobile] Email error:", error);
    return NextResponse.json(SEND_FAILED, { status: 500 });
  }
}
