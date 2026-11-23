// « Groupes »: how the API's rows become the list's cards and the group
// page, and the small words around them. Pure and unit-tested (view.test.ts).
import type {
  GroupEventLine,
  GroupMember,
  GroupPerson,
  GroupSummary,
} from "@/utils/groups/types";
import RouteNames from "@/utils/routes";
import { isUpcomingEvent } from "@/utils/season/schedule";
import type {
  GroupColor,
  GroupKind,
  GroupMemberRole,
  MemberGroup,
} from "@repo/domain/types/memberGroups";

/** Avatars on a card. */
export const GROUP_PREVIEW_SIZE = 5;

const KIND_ORDER: Record<GroupKind, number> = {
  instance: 0,
  commission: 1,
  ensemble: 2,
  autre: 3,
};

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, "fr", { sensitivity: "base" });

/** The CA (system groups) first, then instances, commissions…, then by name. */
export function sortGroups<T extends MemberGroup>(groups: readonly T[]): T[] {
  return [...groups].sort(
    (a, b) =>
      Number(b.is_system) - Number(a.is_system) ||
      KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
      byName(a, b),
  );
}

/** « Responsable » first, then by name. */
export function sortMembers<T extends GroupPerson & { role: GroupMemberRole }>(
  members: readonly T[],
): T[] {
  return [...members].sort(
    (a, b) =>
      Number(b.role === "manager") - Number(a.role === "manager") ||
      byName(a, b),
  );
}

/** Events soonest first (day, then time). */
function byStart(a: GroupEventLine, b: GroupEventLine) {
  return a.date_from.localeCompare(b.date_from) || a.time.localeCompare(b.time);
}

export type GroupRows = {
  groups: MemberGroup[];
  memberships: {
    group_id: string;
    profile_id: string;
    role: GroupMemberRole;
  }[];
  people: ReadonlyMap<string, GroupPerson>;
  audiences: { event_id: string; group_id: string }[];
  /** Events of any date: those over by `today` are left out. */
  events: GroupEventLine[];
  /** « 2026-11-23 », the Paris day. */
  today: string;
};

/**
 * GET /api/groups: each group with its members' ids, up to five avatars
 * (« Responsable » first), the managers' names and its next event. A
 * membership whose profile is gone is skipped.
 */
export function buildGroupSummaries(rows: GroupRows): GroupSummary[] {
  const upcoming = rows.events
    .filter((event) => isUpcomingEvent(event, rows.today))
    .sort(byStart);
  const eventById = new Map(upcoming.map((event) => [event.id, event]));
  const nextByGroup = new Map<string, GroupEventLine>();
  for (const audience of rows.audiences) {
    const event = eventById.get(audience.event_id);
    if (!event) continue;
    const current = nextByGroup.get(audience.group_id);
    if (!current || byStart(event, current) < 0) {
      nextByGroup.set(audience.group_id, event);
    }
  }

  const membersByGroup = new Map<string, GroupMember[]>();
  for (const m of rows.memberships) {
    const person = rows.people.get(m.profile_id);
    if (!person) continue;
    const list = membersByGroup.get(m.group_id) ?? [];
    list.push({ ...person, role: m.role, title: null, added_at: "" });
    membersByGroup.set(m.group_id, list);
  }

  return sortGroups(rows.groups).map((group) => {
    const members = sortMembers(membersByGroup.get(group.id) ?? []);
    return {
      ...group,
      member_ids: members.map((m) => m.id),
      preview: members
        .slice(0, GROUP_PREVIEW_SIZE)
        .map(({ id, name, email, avatar }) => ({ id, name, email, avatar })),
      managers: members.filter((m) => m.role === "manager").map((m) => m.name),
      next_event: nextByGroup.get(group.id) ?? null,
    };
  });
}

/** The live groups and the archived ones, each in list order. */
export function splitGroups<T extends MemberGroup>(groups: readonly T[]) {
  const sorted = sortGroups(groups);
  return {
    active: sorted.filter((g) => g.archived_at === null),
    archived: sorted.filter((g) => g.archived_at !== null),
  };
}

export type KindFilter = "all" | GroupKind;

/** The list's tabs; a tab with no group is hidden by the page. */
export const KIND_FILTERS: readonly { value: KindFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "instance", label: "Instances" },
  { value: "commission", label: "Commissions" },
  { value: "ensemble", label: "Ensembles" },
  { value: "autre", label: "Autres" },
];

export function filterByKind<T extends MemberGroup>(
  groups: readonly T[],
  kind: KindFilter,
): T[] {
  return kind === "all" ? [...groups] : groups.filter((g) => g.kind === kind);
}

/**
 * The tile of a group's icon, from the admin's semantic tokens only (one
 * soft tint and its readable text colour), so both themes stay legible.
 */
export const GROUP_COLOR_CLASSES: Record<GroupColor, string> = {
  teal: "bg-primary-soft text-primary-text",
  blue: "bg-info-soft text-info-foreground",
  green: "bg-success-soft text-success-foreground",
  gold: "bg-warning-soft text-warning-foreground",
  slate: "bg-muted text-foreground",
};

/**
 * Who an event is for, on its row: « Conseil d’administration »,
 * « Bureau, Commission concerts », « 3 groupes »; null for every member.
 * A group the list doesn't know (archived, not loaded) counts as a group.
 */
export function audienceLabel(
  audience: readonly string[] | undefined,
  namesById: ReadonlyMap<string, string>,
): string | null {
  if (!audience || audience.length === 0) return null;
  const names = audience
    .map((id) => namesById.get(id))
    .filter((name): name is string => !!name)
    .sort((a, b) => a.localeCompare(b, "fr"));
  if (names.length === audience.length && names.length <= 2) {
    return names.join(", ");
  }
  return audience.length === 1 ? "1 groupe" : `${audience.length} groupes`;
}

/** Creating, renaming and archiving groups is the superadmins'. */
export function canManageGroups(role: string | null | undefined): boolean {
  return role === "superadmin";
}

/** Why « Archiver » is off for this group, or null when it may be archived. */
export function archiveBlocker(group: MemberGroup): string | null {
  if (group.is_system) {
    return "Le conseil d’administration fait partie de l’association : il ne s’archive pas.";
  }
  return null;
}

/** « Responsable : Claire MARTIN, Jean DUPONT ». */
export function managersLine(managers: readonly string[]): string | null {
  if (managers.length === 0) return null;
  return `${managers.length > 1 ? "Responsables" : "Responsable"} : ${managers.join(", ")}`;
}

/** The query parameter of « Nouvel événement » on a group page. */
export const NEW_EVENT_GROUP_PARAM = "pour";

/** « Nouvel événement » opens the events page's dialog, reserved for the group. */
export function newEventForGroupHref(groupId: string): string {
  return `${RouteNames.DASHBOARD.MEMBERS.EVENEMENTS}?${NEW_EVENT_GROUP_PARAM}=${encodeURIComponent(groupId)}`;
}

/** The group a link asked the events page to start a new event for, if any. */
export function groupFromSearch(search: string): string | null {
  const id = new URLSearchParams(search).get(NEW_EVENT_GROUP_PARAM);
  return id && /^[0-9a-f-]{36}$/i.test(id) ? id.toLowerCase() : null;
}
