import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

type SmtpCredentials = { user: string; pass: string };

/**
 * Credentials of the association's mailbox. `SMTP_USER` / `SMTP_PASSWORD` are
 * the server-only names; the `NEXT_PUBLIC_BURNER_*` pair is a temporary
 * fallback until those variables are deleted from Vercel (then remove it).
 */
function getSmtpCredentials(): SmtpCredentials | null {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (user && pass) {
    return { user, pass };
  }

  const legacyUser = process.env.NEXT_PUBLIC_BURNER_USERNAME;
  const legacyPass = process.env.NEXT_PUBLIC_BURNER_PASSWORD;
  if (legacyUser && legacyPass) {
    return { user: legacyUser, pass: legacyPass };
  }

  return null;
}

export type Mailer = {
  transporter: Transporter;
  /** Sender address (the mailbox itself). */
  from: string;
};

/**
 * Mail transport through the association's Gmail mailbox (TLS on port 465,
 * certificates verified), or null when the credentials are not configured.
 */
export function createMailer(): Mailer | null {
  const credentials = getSmtpCredentials();
  if (!credentials) {
    return null;
  }

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: credentials,
  });

  return { transporter, from: credentials.user };
}
