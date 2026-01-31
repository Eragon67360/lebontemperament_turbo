import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

async function parseRequestBody(
  request: NextRequest,
): Promise<{ email: string }> {
  const body = await request.json();
  return body as { email: string };
}

export async function POST(request: NextRequest) {
  const welcomeEmailTemplate = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .footer { background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bienvenue à notre newsletter !</h1>
    </div>
    <div class="content">
      <p>Bonjour,</p>
      <p>Merci de vous être inscrit(e) à notre newsletter.</p>
      <p>Vous recevrez bientôt nos dernières actualités.</p>
    </div>
  </div>
</body>
</html>
`;

  try {
    const { email } = await parseRequestBody(request);

    // Validation de l'adresse email
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Une adresse email valide est requise" },
        { status: 400 },
      );
    }

    // Check if email is already in the Google Group
    const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;
    const GROUP_EMAIL =
      process.env.GOOGLE_GROUP_EMAIL || "btnewsletter@googlegroups.com";

    if (GOOGLE_APPS_SCRIPT_URL) {
      try {
        const checkUrl = new URL(GOOGLE_APPS_SCRIPT_URL);
        checkUrl.searchParams.append("groupEmail", GROUP_EMAIL);

        const checkResponse = await fetch(checkUrl.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (checkData.success && checkData.data) {
            const members = checkData.data;
            const isMember = members.some((member: unknown) => {
              const memberEmail =
                typeof member === "string"
                  ? member
                  : (member as { email: string }).email;
              return memberEmail.toLowerCase() === email.toLowerCase();
            });

            if (isMember) {
              return NextResponse.json(
                {
                  error: "already_member",
                  message:
                    "Cette adresse email est déjà abonnée à la newsletter",
                },
                { status: 400 },
              );
            }
          }
        }
      } catch (checkError) {
        // If check fails, continue with subscription (fail open)
        console.error("Error checking group membership:", checkError);
      }
    }

    // Configuration du service d'envoi d'emails
    const username = process.env.NEXT_PUBLIC_BURNER_USERNAME; // Pas de NEXT_PUBLIC_ !
    const password = process.env.NEXT_PUBLIC_BURNER_PASSWORD; // Mot de passe spécifique à l'application recommandé

    if (!username || !password) {
      return NextResponse.json(
        { error: "Service d'email non configuré" },
        { status: 500 },
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return NextResponse.json(
        { error: "Email de l'administrateur non configuré" },
        { status: 500 },
      );
    }

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: username,
        pass: password,
      },
    });

    // Envoyer une notification à l'administrateur concernant le nouvel abonné
    await transporter.sendMail({
      from: username,
      to: adminEmail,
      subject: "Nouvel abonné à la newsletter",
      html: `
        <h3>Nouvel abonné à la newsletter</h3>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Date d'inscription :</strong> ${new Date().toLocaleString("fr-FR")}</p>
        <hr>
        <p><em>Veuillez ajouter ce membre au Google Group manuellement via la Console d'administration.</em></p>
      `,
    });

    // Envoyer un email de bienvenue à l'abonné
    await transporter.sendMail({
      from: username,
      to: email,
      subject: "Bienvenue à notre newsletter !",
      html: welcomeEmailTemplate,
    });

    return NextResponse.json({
      message: "Inscription réussie ! Vérifiez votre boîte de réception.",
    });
  } catch (error: unknown) {
    console.error("Erreur lors de l'envoi des emails :", error);

    // Gestion des erreurs spécifiques
    if (error instanceof Error) {
      if (error.message.includes("Invalid login")) {
        return NextResponse.json(
          {
            error: "Échec de l'inscription",
            message: "Erreur d'authentification du service email",
          },
          { status: 500 },
        );
      }
      if (error.message.includes("ECONNECTION")) {
        return NextResponse.json(
          {
            error: "Échec de l'inscription",
            message: "Impossible de se connecter au serveur email",
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      {
        error: "Échec de l'inscription",
        message:
          "Une erreur inattendue s'est produite. Veuillez réessayer plus tard.",
      },
      { status: 500 },
    );
  }
}
