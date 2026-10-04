// A stable fingerprint of the normalised roster, so an apply can refuse when
// the sheet changed since the review. Pure: the hash function is injected
// (`node:crypto` on the server, Web Crypto elsewhere).

import type { RosterRow } from "./types";

export type Sha256Hex = (input: string) => string;

/**
 * SHA-256 (hex) of the rows the sync acts on, in sheet order. Order matters:
 * `rowId` is positional, so moving rows must invalidate a pending review.
 * The mobile phone is left out (the sync never writes it); within a row,
 * voices are sorted so their order in the cell does not count.
 */
export function rosterFingerprint(
  rows: readonly RosterRow[],
  sha256Hex: Sha256Hex,
): string {
  const payload = rows.map((row) => [
    row.rowId,
    row.name,
    row.email,
    row.address,
    row.homePhone,
    [...row.voices].sort(),
  ]);
  return sha256Hex(JSON.stringify(payload));
}
