// What the /api/groups routes answer (« Groupes »: the CA, commissions…). The
// rows are those of migration 20261123185221_member_groups.sql; the wording
// and the checks live in @repo/domain/utils/memberGroups.
import type {
  GroupMemberRole,
  MemberGroup,
} from "@repo/domain/types/memberGroups";

/** A member as the groups pages show them. */
export type GroupPerson = {
  id: string;
  /** « Prénom NOM », else the e-mail's local part. */
  name: string;
  email: string | null;
  /** The profile photo, if any. */
  avatar: string | null;
};

/** An event reserved for the group, as its card and its page list it. */
export type GroupEventLine = {
  id: string;
  title: string;
  date_from: string;
  date_to: string | null;
  time: string;
  location: string;
};

/** GET /api/groups: one card of the list. */
export type GroupSummary = MemberGroup & {
  /** Every member's id, for « Pour qui ? » (who would see an event). */
  member_ids: string[];
  /** Up to five people for the avatars, « Responsable » first. */
  preview: GroupPerson[];
  /** The « Responsable » names, sorted. */
  managers: string[];
  /** The next event reserved for the group (not over yet). */
  next_event: GroupEventLine | null;
};

export type GroupsData = { groups: GroupSummary[] };

/** A row of the group page's members list. */
export type GroupMember = GroupPerson & {
  role: GroupMemberRole;
  /** « Trésorière », « Président »… */
  title: string | null;
  added_at: string;
};

/** GET /api/groups/[id]. */
export type GroupDetail = {
  group: MemberGroup;
  members: GroupMember[];
  /** The events reserved for the group that aren't over, soonest first. */
  upcoming: GroupEventLine[];
};
