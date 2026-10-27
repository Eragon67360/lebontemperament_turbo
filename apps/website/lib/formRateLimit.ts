import "server-only";

import { createAdminClient } from "@/utils/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { isIP } from "node:net";

/**
 * Rate limits for the public forms that send an e-mail: contact, newsletter
 * sign-up, anniversary memory. Each submission counts once for the visitor's
 * IP address and once for the address it sends a confirmation to; past
 * either limit the route answers 429 and sends nothing.
 *
 * Counted in Supabase by `rate_limit_allow()` (migration
 * 20261026190227_form_rate_limits.sql), called with the service-role key.
 * Only SHA-256 hashes of the IP address and the e-mail address are sent and
 * stored. When the count can't be taken (migration not applied yet, network,
 * missing key), the form goes ahead and a warning is logged: the limits
 * never stop a real person's message because of an outage.
 */

export type PublicForm = "contact" | "subscribe" | "memory";

export type RateLimit = { max: number; windowSeconds: number };

/**
 * Per IP address (or IPv6 /64 network): 5 submissions of a form in 10
 * minutes, enough for a person who sends again after a typo, or for a few
 * people sharing a connection (a family, an office).
 */
export const PER_IP: RateLimit = { max: 5, windowSeconds: 10 * 60 };

/**
 * Per recipient: 3 submissions of a form for one address in an hour, more
 * than a person sends to themselves.
 */
export const PER_RECIPIENT: RateLimit = { max: 3, windowSeconds: 60 * 60 };

export const RATE_LIMITED_MESSAGE =
  "Trop de demandes. Réessayez dans quelques minutes.";

/** Longest wait for the count before the form goes ahead without it. */
const COUNT_TIMEOUT_MS = 3000;

/** SHA-256 of the value, as 64 lowercase hex characters. */
export function hashKey(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/**
 * The visitor's IP address: Vercel's `x-real-ip`, else the first entry of
 * `x-forwarded-for` (both set by Vercel, not by the browser). Null when
 * neither is there (local development).
 */
export function clientIp(headers: Headers): string | null {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || null;
}

/** The eight 16-bit groups of a valid IPv6 address (`::` and a dotted tail expanded). */
function ipv6Groups(address: string): number[] {
  const groupsOf = (part: string): number[] =>
    part === ""
      ? []
      : part.split(":").flatMap((piece) => {
          if (!piece.includes(".")) return [parseInt(piece, 16)];
          const [a = 0, b = 0, c = 0, d = 0] = piece.split(".").map(Number);
          return [(a << 8) | b, (c << 8) | d];
        });
  const [head = "", tail] = address.split("::");
  const before = groupsOf(head);
  const after = tail === undefined ? [] : groupsOf(tail);
  const zeros = Array<number>(8 - before.length - after.length).fill(0);
  return [...before, ...zeros, ...after];
}

/**
 * What the per-IP limit counts: an IPv4 address as is (also when written
 * IPv4-mapped, `::ffff:192.0.2.1`), and for IPv6 the /64 network, which
 * usually belongs to a single subscriber: all its addresses share one count.
 */
export function ipKey(ip: string): string {
  const address = ip.trim().toLowerCase().replace(/%.*$/, "");
  const version = isIP(address);
  if (version !== 6) return address;
  const groups = ipv6Groups(address);
  if (groups.slice(0, 5).every((g) => g === 0) && groups[5] === 0xffff) {
    const [high = 0, low = 0] = groups.slice(6);
    return [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");
  }
  return `${groups
    .slice(0, 4)
    .map((g) => g.toString(16))
    .join(":")}::/64`;
}

/**
 * What the per-recipient limit counts: the mailbox the address delivers to,
 * in lower case, without a `+tag` (delivered to the same mailbox by most
 * providers) and, for Gmail, without dots. Used to count, never to send.
 */
export function recipientKey(email: string): string {
  const address = email.trim().toLowerCase();
  const at = address.lastIndexOf("@");
  if (at < 1) return address;
  let local = address.slice(0, at);
  let domain = address.slice(at + 1);
  if (domain === "googlemail.com") domain = "gmail.com";
  local = local.replace(/\+.*$/, "") || local;
  if (domain === "gmail.com") local = local.replaceAll(".", "") || local;
  return `${local}@${domain}`;
}

/**
 * Counts one submission for the key (a SHA-256 hash) and says whether it is
 * allowed: false at the limit, in which case nothing is counted.
 */
export type CountSubmission = (
  scope: string,
  keyHash: string,
  limit: RateLimit,
) => Promise<boolean>;

/** `rate_limit_allow()` through the service-role client, created on first use. */
function countInSupabase(): CountSubmission {
  // Not in database.types.ts until the migration is applied and the types
  // regenerated: called untyped, and the answer is checked here.
  let client: SupabaseClient | null = null;
  return async (scope, keyHash, limit) => {
    client ??= createAdminClient();
    const { data, error } = await client
      .rpc("rate_limit_allow", {
        p_scope: scope,
        p_key_hash: keyHash,
        p_max: limit.max,
        p_window_seconds: limit.windowSeconds,
      })
      .abortSignal(AbortSignal.timeout(COUNT_TIMEOUT_MS));
    if (error) throw new Error(`${error.code ?? ""} ${error.message}`.trim());
    if (typeof data !== "boolean") {
      throw new Error("rate_limit_allow did not answer true or false");
    }
    return data;
  };
}

/**
 * Whether this submission of `form` goes over the per-IP or the
 * per-recipient limit (`email` is the address the form would write to).
 * Counts the submission when it is allowed. Never throws: if the count
 * fails, the submission is allowed and a warning logged.
 */
export async function isFormRateLimited(
  form: PublicForm,
  headers: Headers,
  email: string,
  count: CountSubmission = countInSupabase(),
): Promise<boolean> {
  const checks: [scope: string, key: string, limit: RateLimit][] = [];
  const ip = clientIp(headers);
  if (ip) {
    checks.push([`${form}:ip`, ipKey(ip), PER_IP]);
  } else {
    console.warn(`[rate-limit] ${form}: no client IP, per-IP limit skipped`);
  }
  checks.push([`${form}:email`, recipientKey(email), PER_RECIPIENT]);

  for (const [scope, key, limit] of checks) {
    try {
      if (!(await count(scope, hashKey(key), limit))) return true;
    } catch (error) {
      console.warn(
        `[rate-limit] ${form}: limits not checked, submission allowed:`,
        error instanceof Error ? error.message : error,
      );
      return false;
    }
  }
  return false;
}
