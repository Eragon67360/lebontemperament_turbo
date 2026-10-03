import { CONTACT_EMAIL } from "@/lib/contact";
import { createMailer } from "@/lib/mail";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { ContactFormProps } from "@/types/contactFormData";
import { escapeHtml, escapeHtmlWithBreaks } from "@repo/domain/utils/html";
import { NextRequest, NextResponse } from "next/server";

const SEND_FAILED = {
  success: false,
  message: "Une erreur est survenue lors de l'envoi du message",
};

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, subject, message, captchaValue } =
      (await request.json()) as ContactFormProps;

    if (!captchaValue) {
      return NextResponse.json(
        {
          success: false,
          message: "Veuillez vérifier que vous n'êtes pas un robot",
        },
        { status: 400 },
      );
    }

    const recaptcha = await verifyRecaptcha(String(captchaValue));
    if (recaptcha === "not-configured") {
      return NextResponse.json(
        {
          success: false,
          message: "Configuration du serveur incomplète",
        },
        { status: 500 },
      );
    }
    if (recaptcha === "failed") {
      return NextResponse.json(
        {
          success: false,
          message: "Échec de la vérification reCAPTCHA",
        },
        { status: 400 },
      );
    }

    const mailer = createMailer();
    if (!mailer) {
      console.error("[api/contact] Email service not configured");
      return NextResponse.json(SEND_FAILED, { status: 500 });
    }

    // Send email to BT
    await mailer.transporter.sendMail({
      from: mailer.from,
      to: CONTACT_EMAIL,
      subject: `Nouvelle demande de contact de ${firstName} ${lastName}`,
      html: `
                <p>Nom: ${escapeHtml(lastName)} </p>
                <p>Prénom: ${escapeHtml(firstName)} </p>
                <p>Email: ${escapeHtml(email)} </p>
                <p>Sujet: ${escapeHtml(subject)} </p>
                <p>Message: ${escapeHtmlWithBreaks(message)} </p>
            `,
    });

    // Send confirmation email to user
    await mailer.transporter.sendMail({
      from: mailer.from,
      to: email?.toString(),
      subject: `Votre demande de contact est bien arrivée!`,
      html: `
                <p>Bonjour ${escapeHtml(firstName)} !</p>
                <p>L'équipe communication du BT vous remercie pour votre demande de contact! Nous essayerons de traiter votre demande le plus vite possible!</p>
                <p>Chaleureusement et musicalement,</p>
                <p>L'équipe <strong>Com' du Bon Tempérament</strong></p>
            `,
    });

    return NextResponse.json({
      success: true,
      message: "Votre demande de contact a bien été envoyée",
    });
  } catch (error) {
    console.error("[api/contact] Email sending error:", error);
    return NextResponse.json(SEND_FAILED, { status: 500 });
  }
}
