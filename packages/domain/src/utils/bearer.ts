/**
 * Extracts the token from an `Authorization: Bearer <token>` header value.
 * Returns null for a missing header, another scheme (Basic, …) or an empty or
 * malformed token, so callers can fall back to their other authentication.
 */
export const parseBearerToken = (
  header: string | null | undefined,
): string | null => {
  if (!header) {
    return null;
  }
  const match = header.trim().match(/^Bearer[ \t]+(\S+)$/i);
  return match?.[1] ?? null;
};
