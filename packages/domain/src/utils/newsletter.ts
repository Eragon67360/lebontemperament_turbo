const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

/** Name of the hidden form field that only bots fill in. */
export const NEWSLETTER_HONEYPOT_FIELD = "website";

export type NewsletterRequest =
  { kind: "subscribe"; email: string } | { kind: "bot" } | { kind: "invalid" };

/**
 * Classifies a newsletter sign-up body: a filled honeypot marks a bot (checked
 * first, so bots never learn about validation), then the address is checked.
 */
export const classifyNewsletterRequest = (body: unknown): NewsletterRequest => {
  const fields =
    body !== null && typeof body === "object"
      ? (body as Record<string, unknown>)
      : {};

  const honeypot = fields[NEWSLETTER_HONEYPOT_FIELD];
  if (honeypot !== undefined && honeypot !== null && honeypot !== "") {
    return { kind: "bot" };
  }

  const email = typeof fields.email === "string" ? fields.email.trim() : "";
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return { kind: "invalid" };
  }

  return { kind: "subscribe", email };
};
