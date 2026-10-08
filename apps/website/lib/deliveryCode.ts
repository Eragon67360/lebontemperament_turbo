/**
 * Delivery codes (#593): 8 characters from an alphabet without the look-alike
 * pairs 0/O and 1/I/L, stored uppercase without a dash and shown to people as
 * `XXXX-XXXX`. The same rules live in the database function
 * `redeem_delivery_code` and in the mobile app.
 */

export const DELIVERY_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const DELIVERY_CODE_LENGTH = 8;

const VALID_CODE = new RegExp(
  `^[${DELIVERY_CODE_ALPHABET}]{${DELIVERY_CODE_LENGTH}}$`,
);

/**
 * What a person typed or what the URL carried, reduced to the stored form:
 * uppercase, everything that is not A–Z or 0–9 dropped (dashes, spaces).
 */
export function normalizeDeliveryCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** True when a normalised code has the right length and alphabet. */
export function isValidDeliveryCode(code: string): boolean {
  return VALID_CODE.test(code);
}

/** `ABCD2345` → `ABCD-2345`, the form printed in SMS and on screen. */
export function formatDeliveryCode(code: string): string {
  const half = DELIVERY_CODE_LENGTH / 2;
  return code.length === DELIVERY_CODE_LENGTH
    ? `${code.slice(0, half)}-${code.slice(half)}`
    : code;
}
