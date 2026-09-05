import type { Database } from "@repo/domain/database.types";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const SUPPORT_EMAIL = "lebontemperament@gmail.com";

interface MobileContactBody {
  subject: string;
  message: string;
}

async function parseRequestBody(
  request: NextRequest,
): Promise<MobileContactBody> {
  const body = await request.json();
  return body as MobileContactBody;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 },
      );
    }
    const token = authHeader.slice(7);

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    const { subject, message } = await parseRequestBody(request);

    if (!subject?.trim() || !message?.trim()) {
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

    const username = process.env.NEXT_PUBLIC_BURNER_USERNAME;
    const password = process.env.NEXT_PUBLIC_BURNER_PASSWORD;

    if (!username || !password) {
      console.error("Email service not configured");
      return NextResponse.json(
        {
          success: false,
          message: "Service d'email non configuré",
        },
        { status: 500 },
      );
    }

    const firstName =
      (user.user_metadata?.display_name as string)?.split(" ")[0] ||
      user.email.split("@")[0] ||
      "Utilisateur";

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
      },
      auth: {
        user: username,
        pass: password,
      },
    });

    // Send email to support
    await transporter.sendMail({
      from: username,
      to: SUPPORT_EMAIL,
      subject: `[App] ${subject} - ${user.email}`,
      html: `
        <p><strong>Depuis l'application mobile</strong></p>
        <p>Nom / Prénom: ${user.user_metadata?.display_name ?? "Non renseigné"}</p>
        <p>Email: ${user.email}</p>
        <p>Sujet: ${subject}</p>
        <p>Message:</p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    // Send confirmation email to user
    await transporter.sendMail({
      from: username,
      to: user.email,
      subject: "Votre demande de contact a bien été envoyée",
      html: `
        <p>Bonjour ${firstName} !</p>
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
    console.error("Mobile contact email error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Une erreur est survenue lors de l'envoi du message",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
