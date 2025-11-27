// route.ts
import { ContactFormProps } from "@/types/contactFormData";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

async function parseRequestBody(
  request: NextRequest,
): Promise<ContactFormProps> {
  const body = await request.json();
  return body as ContactFormProps;
}

export async function POST(request: NextRequest) {
  try {
    const username = process.env.NEXT_PUBLIC_BURNER_USERNAME;
    const password = process.env.NEXT_PUBLIC_BURNER_PASSWORD;

    const { firstName, lastName, email, subject, message, captchaValue } =
      await parseRequestBody(request);

    // Verify reCAPTCHA token
    if (!captchaValue) {
      return NextResponse.json(
        {
          success: false,
          message: "Veuillez vérifier que vous n'êtes pas un robot",
        },
        { status: 400 },
      );
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY not found in environment variables");
      return NextResponse.json(
        {
          success: false,
          message: "Configuration du serveur incomplète",
        },
        { status: 500 },
      );
    }

    // Verify reCAPTCHA with Google
    const recaptchaResponse = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaValue}`,
      {
        method: "POST",
      },
    );

    const recaptchaResult = await recaptchaResponse.json();

    if (!recaptchaResult.success) {
      console.error(
        "reCAPTCHA verification failed:",
        recaptchaResult["error-codes"],
      );
      return NextResponse.json(
        {
          success: false,
          message: "Échec de la vérification reCAPTCHA",
          errorCodes: recaptchaResult["error-codes"],
        },
        { status: 400 },
      );
    }

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

    // Send email to BT
    await transporter.sendMail({
      from: username,
      to: "lebontemperament@gmail.com",
      subject: `Nouvelle demande de contact de ${firstName} ${lastName}`,
      html: `
                <p>Nom: ${lastName} </p>
                <p>Prénom: ${firstName} </p>
                <p>Email: ${email} </p>
                <p>Sujet: ${subject} </p>
                <p>Message: ${message} </p>
            `,
    });

    // Send confirmation email to user
    await transporter.sendMail({
      from: username,
      to: email?.toString(),
      subject: `Votre demande de contact est bien arrivée!`,
      html: `
                <p>Bonjour ${firstName} !</p>
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
    console.error("Email sending error:", error);
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
