// utils/roster/deletionReview.ts
//
// What the bulk-deletion dialog tells the admin about the accounts they
// ticked under « Absents de la liste »: who is an administrator, who signed
// in recently (probably still a member), who never signed in. Pure and
// unit-tested; `now` is passed in so the wording is stable in tests.

import { isAdminRole } from "@/utils/access";
import type { AbsentMember } from "@repo/domain/roster/types";

/** Signed in within this many days: the person is probably still using the account. */
export const RECENT_SIGN_IN_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

export const isAdminAccount = (account: Pick<AbsentMember, "role">) =>
  isAdminRole(account.role);

export function signedInRecently(
  account: Pick<AbsentMember, "lastSignInAt">,
  now: Date,
): boolean {
  if (!account.lastSignInAt) return false;
  const at = new Date(account.lastSignInAt).getTime();
  if (Number.isNaN(at)) return false;
  return now.getTime() - at <= RECENT_SIGN_IN_DAYS * DAY_MS;
}

export interface DeletionReview {
  /** Risky accounts first (administrators, then recent sign-ins), then by name. */
  accounts: AbsentMember[];
  admins: AbsentMember[];
  recent: AbsentMember[];
  /** Never signed in: invitation not accepted, or an account nobody used. */
  neverSignedIn: number;
}

const byName = (a: AbsentMember, b: AbsentMember) =>
  a.displayName.localeCompare(b.displayName, "fr") ||
  a.email.localeCompare(b.email, "fr");

export function reviewDeletion(
  accounts: readonly AbsentMember[],
  now: Date,
): DeletionReview {
  const rank = (account: AbsentMember) =>
    isAdminAccount(account) ? 0 : signedInRecently(account, now) ? 1 : 2;
  const sorted = [...accounts].sort(
    (a, b) => rank(a) - rank(b) || byName(a, b),
  );
  return {
    accounts: sorted,
    admins: sorted.filter(isAdminAccount),
    recent: sorted.filter((account) => signedInRecently(account, now)),
    neverSignedIn: sorted.filter((account) => !account.lastSignInAt).length,
  };
}
