// utils/users/emailChange.ts
//
// The new sign-in email a superadmin types for a member (PATCH
// /api/users/email): trimmed and lower-cased like the roster's emails, so the
// next sync still matches the account. Pure.

import { isValidEmail, normalizeEmail } from "@repo/domain/roster/normalize";

export type NewEmailCheck =
  { ok: true; email: string } | { ok: false; error: string };

export function checkNewEmail(
  current: string | null | undefined,
  requested: unknown,
): NewEmailCheck {
  if (typeof requested !== "string" || !requested.trim()) {
    return { ok: false, error: "Indiquez la nouvelle adresse e-mail" };
  }
  const email = normalizeEmail(requested);
  if (!isValidEmail(email)) {
    return { ok: false, error: "Cette adresse e-mail n'est pas valide" };
  }
  if (email === normalizeEmail(current)) {
    return { ok: false, error: "C'est déjà l'adresse de ce compte" };
  }
  return { ok: true, email };
}

/** Supabase Auth's answer when another account already has the address. */
export function isEmailTakenError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { code, message } = error as { code?: unknown; message?: unknown };
  return (
    code === "email_exists" ||
    (typeof message === "string" &&
      /already (been )?registered|already exists/i.test(message))
  );
}

export const EMAIL_TAKEN = "Un autre compte utilise déjà cette adresse e-mail";
