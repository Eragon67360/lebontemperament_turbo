import type { GoogleGroup, GoogleGroupMember } from "@/hooks/useGoogleGroups";

/** The association's newsletter group, selected when the page opens. */
export const DEFAULT_GROUP_EMAIL = "btnewsletter@googlegroups.com";

/**
 * The groups of the selector. The groups endpoint can come back empty; the
 * default group keeps the selector usable instead of showing an empty menu.
 */
export function groupsWithDefault(
  groups: GoogleGroup[] | undefined,
  defaultEmail: string = DEFAULT_GROUP_EMAIL,
): GoogleGroup[] {
  return groups?.length
    ? groups
    : [{ email: defaultEmail, name: defaultEmail, description: null }];
}

/** A group's name, and its address underneath only when the two differ. */
export function groupLabel(group: GoogleGroup): {
  name: string;
  email: string | null;
} {
  return group.name && group.name !== group.email
    ? { name: group.name, email: group.email }
    : { name: group.email, email: null };
}

/** The members endpoint returns either plain addresses or `{ email }` objects. */
export function memberEmails(
  members: (GoogleGroupMember | string)[] | undefined,
): string[] {
  return (members ?? []).map((member) =>
    typeof member === "string" ? member : member.email,
  );
}

/** « 1 adresse », « 42 adresses ». */
export function addressCountLabel(count: number): string {
  return `${count} ${count === 1 ? "adresse" : "adresses"}`;
}

/** « 8 octobre 2026 à 09:55 », in the association's time zone. */
export function readAtLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}
