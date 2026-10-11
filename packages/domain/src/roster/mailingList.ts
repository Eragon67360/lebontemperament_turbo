// Comparison between the member roster and a mailing list (a Google Group).
// Pure: roster rows and the list's addresses in, the two differences out.
// The roster is the master: whoever is in it should be on the list, and the
// list should hold nobody else, except the addresses admins chose to keep
// (or to leave out) on purpose.

import { isValidEmail, normalizeEmail } from "./normalize";
import type { RosterRow } from "./types";

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

/**
 * The key two addresses are matched on: lower-cased and trimmed; for Gmail,
 * also without the dots and the `+tag` of the local part, and with
 * googlemail.com read as gmail.com, since Gmail delivers all of those to the
 * same mailbox. Other providers are taken as written.
 */
export function mailingListKey(email: string | null | undefined): string {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf("@");
  if (at <= 0) return normalized;
  const domain = normalized.slice(at + 1);
  if (!GMAIL_DOMAINS.has(domain)) return normalized;
  const local = normalized.slice(0, at).split("+")[0]!.replace(/\./g, "");
  return `${local}@gmail.com`;
}

export interface MailingListException {
  /** As stored: already a `mailingListKey`. */
  email: string;
  note: string | null;
}

export interface MissingFromList {
  name: string;
  email: string;
}

export interface ExtraOnList {
  email: string;
}

export interface KeptAddress {
  email: string;
  note: string | null;
  /** Where the kept address sits: on the list only, in the roster only. */
  side: "list" | "roster";
}

export interface MailingListComparison {
  /** In the roster, not on the list: to add to the group. */
  missing: MissingFromList[];
  /** On the list, not in the roster: to remove from the group. */
  extra: ExtraOnList[];
  /** Differences an admin chose to keep. */
  kept: KeptAddress[];
  /** Roster rows with no usable email, which cannot be compared. */
  rosterWithoutEmail: number;
  /** Addresses on both sides. */
  matched: number;
}

const byText = (a: string, b: string) => a.localeCompare(b, "fr");

/**
 * Compares the roster with the list. Every address is matched on its
 * `mailingListKey`; an exception's address is left out of both differences
 * and reported under `kept` when it would have been one.
 */
export function compareMailingList(
  rows: readonly RosterRow[],
  listEmails: readonly string[],
  exceptions: readonly MailingListException[] = [],
): MailingListComparison {
  const notes = new Map(
    exceptions.map((e) => [mailingListKey(e.email), e.note] as const),
  );

  const roster = new Map<string, MissingFromList>();
  let rosterWithoutEmail = 0;
  for (const row of rows) {
    const email = normalizeEmail(row.email);
    if (!email || !isValidEmail(email)) {
      rosterWithoutEmail++;
      continue;
    }
    const key = mailingListKey(email);
    if (!roster.has(key)) roster.set(key, { name: row.name, email });
  }

  const list = new Map<string, string>();
  for (const raw of listEmails) {
    const email = normalizeEmail(raw);
    if (!email) continue;
    const key = mailingListKey(email);
    if (!list.has(key)) list.set(key, email);
  }

  const missing: MissingFromList[] = [];
  const extra: ExtraOnList[] = [];
  const kept: KeptAddress[] = [];
  let matched = 0;

  for (const [key, member] of roster) {
    if (list.has(key)) {
      matched++;
    } else if (notes.has(key)) {
      kept.push({ email: member.email, note: notes.get(key)!, side: "roster" });
    } else {
      missing.push(member);
    }
  }
  for (const [key, email] of list) {
    if (roster.has(key)) continue;
    if (notes.has(key)) {
      kept.push({ email, note: notes.get(key)!, side: "list" });
    } else {
      extra.push({ email });
    }
  }

  missing.sort((a, b) => byText(a.name, b.name) || byText(a.email, b.email));
  extra.sort((a, b) => byText(a.email, b.email));
  kept.sort((a, b) => byText(a.email, b.email));
  return { missing, extra, kept, rosterWithoutEmail, matched };
}
