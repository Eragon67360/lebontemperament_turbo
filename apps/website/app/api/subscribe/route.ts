import { createMailer, type Mailer } from "@/lib/mail";
import { escapeHtml } from "@repo/domain/utils/html";
import { classifyNewsletterRequest } from "@repo/domain/utils/newsletter";
import { after, NextRequest, NextResponse } from "next/server";

/**
 * The only success answer, whatever happens next (new address, address already
 * on the list, honeypot filled): the endpoint must not reveal who subscribed.
 */
const ACCEPTED = {
  message: "Inscription réussie ! Vérifiez votre boîte de réception.",
};

const FAILED = {
  error: "Échec de l'inscription",
  message:
    "Une erreur inattendue s'est produite. Veuillez réessayer plus tard.",
};

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

/**
 * Whether the address is already in the newsletter Google Group (through the
 * Apps Script that lists its members). Fails open: unknown means "not yet".
 */
async function isAlreadySubscribed(email: string): Promise<boolean> {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) {
    return false;
  }

  try {
    const url = new URL(scriptUrl);
    url.searchParams.append(
      "groupEmail",
      process.env.GOOGLE_GROUP_EMAIL || "btnewsletter@googlegroups.com",
    );
    const response = await fetch(url.toString(), {
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    if (!result?.success || !Array.isArray(result.data)) {
      return false;
    }

    const wanted = email.toLowerCase();
    return result.data.some((member: unknown) => {
      const memberEmail =
        typeof member === "string"
          ? member
          : (member as { email?: unknown })?.email;
      return (
        typeof memberEmail === "string" && memberEmail.toLowerCase() === wanted
      );
    });
  } catch (error) {
    console.error("[api/subscribe] Group membership check failed:", error);
    return false;
  }
}

async function processSubscription(
  mailer: Mailer,
  adminEmail: string,
  email: string,
) {
  try {
    if (await isAlreadySubscribed(email)) {
      return;
    }

    // Notify the administrator, who adds the address to the Google Group.
    await mailer.transporter.sendMail({
      from: mailer.from,
      to: adminEmail,
      subject: "Nouvel abonné à la newsletter",
      html: `
        <h3>Nouvel abonné à la newsletter</h3>
        <p><strong>Email :</strong> ${escapeHtml(email)}</p>
        <p><strong>Date d'inscription :</strong> ${new Date().toLocaleString("fr-FR")}</p>
        <hr>
        <p><em>Veuillez ajouter ce membre au Google Group manuellement via la Console d'administration.</em></p>
      `,
    });

    await mailer.transporter.sendMail({
      from: mailer.from,
      to: email,
      subject: "Bienvenue à notre newsletter !",
      html: welcomeEmailTemplate,
    });
  } catch (error) {
    console.error("[api/subscribe] Failed to send subscription emails:", error);
  }
}

const INVALID = { error: "Une adresse email valide est requise" };

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(INVALID, { status: 400 });
  }

  const subscription = classifyNewsletterRequest(body);

  // Honeypot (a field hidden from people) filled in: same answer as a real
  // sign-up, and nothing is sent.
  if (subscription.kind === "bot") {
    console.warn("[api/subscribe] Honeypot field filled; submission ignored");
    return NextResponse.json(ACCEPTED);
  }
  if (subscription.kind === "invalid") {
    return NextResponse.json(INVALID, { status: 400 });
  }
  const { email } = subscription;

  const mailer = createMailer();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!mailer || !adminEmail) {
    console.error(
      "[api/subscribe] Email service or ADMIN_EMAIL not configured",
    );
    return NextResponse.json(FAILED, { status: 500 });
  }

  // The membership check and the emails run after the response, so neither
  // the answer nor its timing depends on whether the address is subscribed.
  after(() => processSubscription(mailer, adminEmail, email));

  return NextResponse.json(ACCEPTED);
}
