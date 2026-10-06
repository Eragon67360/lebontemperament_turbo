import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

type SmtpCredentials = { user: string; pass: string };

/**
 * Credentials of the association's sending mailbox, from the server-only
 * `SMTP_USER` / `SMTP_PASSWORD` variables (#321). Never give them a
 * `NEXT_PUBLIC_` prefix: those are sent to every browser.
 */
function getSmtpCredentials(): SmtpCredentials | null {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  return user && pass ? { user, pass } : null;
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
