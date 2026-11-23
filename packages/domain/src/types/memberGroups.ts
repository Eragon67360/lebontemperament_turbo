// Member groups (« Groupes »: the CA, commissions…), migration
// 20261123185221_member_groups.sql. The values below are the database's
// CHECK constraints; the wording lives in utils/memberGroups.ts.

export const GROUP_KINDS = [
  "instance",
  "commission",
  "ensemble",
  "autre",
] as const;
export type GroupKind = (typeof GROUP_KINDS)[number];

/** The kinds an admin picks from (« ensemble » is for the rehearsal groups, later). */
export const PICKABLE_GROUP_KINDS = [
  "instance",
  "commission",
  "autre",
] as const;

export const GROUP_VISIBILITIES = ["private", "members"] as const;
/** « private »: only its members (and the admins) see the group and its events. */
export type GroupVisibility = (typeof GROUP_VISIBILITIES)[number];

/** A tint from a fixed palette, drawn with the admin's semantic tokens. */
export const GROUP_COLORS = ["teal", "blue", "green", "gold", "slate"] as const;
export type GroupColor = (typeof GROUP_COLORS)[number];

/** Lucide icon names (kebab case), the same names the app can map later. */
export const GROUP_ICONS = [
  "landmark",
  "users",
  "music",
  "megaphone",
  "calendar-days",
  "clipboard-list",
  "briefcase",
  "heart-handshake",
  "piggy-bank",
  "camera",
  "book-open",
  "cake",
] as const;
export type GroupIcon = (typeof GROUP_ICONS)[number];

export const GROUP_MEMBER_ROLES = ["member", "manager"] as const;
/** « manager » = « Responsable » of the group; it gives no admin access. */
export type GroupMemberRole = (typeof GROUP_MEMBER_ROLES)[number];

/** A row of public.member_groups. */
export type MemberGroup = {
  id: string;
  name: string;
  slug: string;
  kind: GroupKind;
  description: string | null;
  color: GroupColor;
  icon: string;
  visibility: GroupVisibility;
  is_system: boolean;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** A row of public.member_group_members. */
export type MemberGroupMembership = {
  group_id: string;
  profile_id: string;
  role: GroupMemberRole;
  title: string | null;
  added_by: string | null;
  added_at: string;
};
