// « Nom de l'acheteur » can come from the members: the suggestions while the
// name is typed, and what picking one fills in. Pure and unit-tested
// (members.test.ts).
import { normalizeText } from "@/utils/orders/view";
import { formatPhone } from "@repo/domain/utils/orders";

/** A member as the order form offers them (sold by, bought by). */
export type MemberOption = {
  id: string;
  name: string;
  email?: string | null;
  /** Mobile phone first, else home phone, as the profile holds it. */
  phone?: string | null;
  address?: string | null;
};

/** Suggestions start at two letters. */
export const MEMBER_QUERY_MIN = 2;
const MEMBER_SUGGESTIONS_MAX = 6;

/**
 * The members whose name or e-mail holds every typed word (accents and
 * capitals ignored), names starting with the first word first, at most six.
 */
export function matchMembers(
  members: readonly MemberOption[],
  query: string,
  limit = MEMBER_SUGGESTIONS_MAX,
): MemberOption[] {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (words.join("").length < MEMBER_QUERY_MIN) return [];
  const scored = members.flatMap((member) => {
    const name = normalizeText(member.name);
    const haystack = `${name} ${normalizeText(member.email ?? "")}`;
    if (!words.every((w) => haystack.includes(w))) return [];
    const starts = name
      .split(/[\s-]+/)
      .some((part) => part.startsWith(words[0]!));
    return [{ member, rank: starts ? 0 : 1 }];
  });
  return scored
    .sort(
      (a, b) =>
        a.rank - b.rank || a.member.name.localeCompare(b.member.name, "fr"),
    )
    .slice(0, limit)
    .map((s) => s.member);
}

/**
 * What picking a member writes into the form: their name, and their phone
 * and address only where the admin left the field empty (what was typed
 * from the paper form wins).
 */
export function fillFromMember(
  member: MemberOption,
  current: { buyer_phone: string; buyer_address: string },
): { buyer_name: string; buyer_phone: string; buyer_address: string } {
  return {
    buyer_name: member.name,
    buyer_phone:
      current.buyer_phone.trim() || formatPhone(member.phone?.trim() ?? ""),
    buyer_address:
      current.buyer_address.trim() || (member.address?.trim() ?? ""),
  };
}

/** The member options from the admin's users list, by name. */
export function memberOptions<
  U extends {
    id: string;
    email: string;
    mobile_phone?: string | null;
    home_phone?: string | null;
    address?: string | null;
  },
>(users: readonly U[], nameOf: (user: U) => string): MemberOption[] {
  return users
    .map((u) => ({
      id: u.id,
      name: nameOf(u),
      email: u.email,
      phone: u.mobile_phone?.trim() || u.home_phone?.trim() || null,
      address: u.address?.trim() || null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
