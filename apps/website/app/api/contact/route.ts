import { errorCodes } from "@/lib/errorCodes";
import { isFormRateLimited, RATE_LIMITED_MESSAGE } from "@/lib/formRateLimit";
import { createMailer } from "@/lib/mail";
import { getContactEmail } from "@/lib/siteSettings";
import { ContactFormProps } from "@/types/contactFormData";
import { detectFormAbuse } from "@repo/domain/utils/formAbuse";
import { escapeHtml, escapeHtmlWithBreaks } from "@repo/domain/utils/html";
import { NextRequest, NextResponse } from "next/server";

/** The only success answer, whether the message was sent or quietly dropped. */
const SENT = {
  success: true,
  message: "Votre demande de contact a bien été envoyée",
};

const SEND_FAILED = {
  success: false,
  message: "Une erreur est survenue lors de l'envoi du message",
};

const INVALID = {
  success: false,
  message: "Une adresse email valide et un message sont requis",
};

const RATE_LIMITED = { success: false, message: RATE_LIMITED_MESSAGE };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (value: unknown) => (typeof value === "string" ? value : "");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Honeypot filled or submitted faster than a person types: answer like a
    // real submission (bots learn nothing) and send nothing.
    const verdict = detectFormAbuse(body);
    if (verdict !== "human") {
      console.warn(`[api/contact] Submission ignored (${verdict})`);
      return NextResponse.json(SENT);
    }

    const { firstName, lastName, email, subject, message } =
      body as ContactFormProps;
    if (!EMAIL_PATTERN.test(text(email)) || !text(message).trim()) {
      return NextResponse.json(INVALID, { status: 400 });
    }

    // Per-IP and per-recipient limits, before anything is sent.
    if (await isFormRateLimited("contact", request.headers, text(email))) {
      return NextResponse.json(RATE_LIMITED, { status: 429 });
    }

    const mailer = createMailer();
    if (!mailer) {
      console.error("[api/contact] Email service not configured");
      return NextResponse.json(SEND_FAILED, { status: 500 });
    }

    // Send email to BT
    await mailer.transporter.sendMail({
      from: mailer.from,
      to: await getContactEmail(),
      subject: `Nouvelle demande de contact de ${text(firstName)} ${text(lastName)}`,
      html: `
                <p>Nom: ${escapeHtml(text(lastName))} </p>
                <p>Prénom: ${escapeHtml(text(firstName))} </p>
                <p>Email: ${escapeHtml(email)} </p>
                <p>Sujet: ${escapeHtml(text(subject))} </p>
                <p>Message: ${escapeHtmlWithBreaks(message)} </p>
            `,
    });

    // Confirmation to the address the visitor typed: fixed text, nothing they
    // typed is repeated.
    await mailer.transporter.sendMail({
      from: mailer.from,
      to: email,
      subject: `Votre demande de contact est bien arrivée!`,
      html: `
                <p>Bonjour !</p>
                <p>L'équipe communication du BT vous remercie pour votre demande de contact! Nous essayerons de traiter votre demande le plus vite possible!</p>
                <p>Chaleureusement et musicalement,</p>
                <p>L'équipe <strong>Com' du Bon Tempérament</strong></p>
            `,
    });

    return NextResponse.json(SENT);
  } catch (error) {
    console.error("[api/contact] Email sending error:", errorCodes(error));
    return NextResponse.json(SEND_FAILED, { status: 500 });
  }
}
