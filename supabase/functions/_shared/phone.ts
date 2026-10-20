// Phone numbers for SMS. Same rule as public.normalize_order_phone and the
// app's normalizePhone: « 06 12 34 56 78 » → « +33612345678 », « 0041… » →
// « +41… », anything else without spaces; empty → null.
export function normalizePhone(
  input: string | null | undefined,
): string | null {
  const d = (input ?? "").replace(/[\s.\-()/]/g, "");
  if (d === "") return null;
  if (/^0[1-9]\d{8}$/.test(d)) return `+33${d.slice(1)}`;
  if (/^0033[1-9]\d{8}$/.test(d)) return `+${d.slice(2)}`;
  if (/^00[1-9]\d{6,14}$/.test(d)) return `+${d.slice(2)}`;
  return d;
}

/** The E.164 form Twilio requires, or null when the number can't be one. */
export function smsPhone(input: string | null | undefined): string | null {
  const n = normalizePhone(input);
  return n !== null && /^\+[1-9]\d{6,14}$/.test(n) ? n : null;
}
