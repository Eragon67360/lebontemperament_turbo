/** The first name of a « Prénom NOM » display name (hyphenated names kept). */
export function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return "";
  const match = fullName.match(/^([\p{L}]+(?:-[\p{L}]+)*)/u);
  if (match) return match[0];
  return fullName.split(/(?=[A-Z]{2,})/)[0]?.trim() ?? "";
}

/** Two capital letters for an avatar: first letter of the first and last word. */
export function getInitials(name: string | null | undefined): string {
  const parts = (name ?? "").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]!;
  const last = parts[parts.length - 1]!;
  if (parts.length >= 2) {
    return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase();
  }
  return first.slice(0, 2).toUpperCase();
}
