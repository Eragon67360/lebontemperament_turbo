/**
 * Cheap spam checks shared by the public forms (contact, anniversary memory):
 * a honeypot field that only bots fill in, and the time a person needed to
 * fill the form. Neither needs a third party, so nothing loads before the
 * visitor has typed anything. The checks are advisory: a targeted script can
 * fake both, which the rate limit on the API routes (Vercel Firewall) covers.
 */

/** Name of the hidden form field that only bots fill in. */
export const HONEYPOT_FIELD = "website";

/** Milliseconds between the form's first render and its submission. */
export const FILL_TIME_FIELD = "fillTimeMs";

/** A person needs at least this long to type an email and a message. */
export const MIN_FILL_TIME_MS = 3000;

export type FormAbuseVerdict = "human" | "honeypot" | "too-fast";

/**
 * Looks at the submitted body and says whether it came from a person.
 * The honeypot is checked first so a bot never learns about the timing rule.
 * The fill time is measured by the client (an elapsed duration, not a clock
 * reading), so a visitor's wrong system clock cannot turn them into a bot.
 */
export const detectFormAbuse = (body: unknown): FormAbuseVerdict => {
  const fields =
    body !== null && typeof body === "object"
      ? (body as Record<string, unknown>)
      : {};

  const honeypot = fields[HONEYPOT_FIELD];
  if (honeypot !== undefined && honeypot !== null && honeypot !== "") {
    return "honeypot";
  }

  const fillTime = fields[FILL_TIME_FIELD];
  const elapsed = typeof fillTime === "number" ? fillTime : Number(fillTime);
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_TIME_MS) {
    return "too-fast";
  }

  return "human";
};
