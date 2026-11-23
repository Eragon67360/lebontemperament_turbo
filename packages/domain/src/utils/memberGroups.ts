// Member groups (« Groupes »): the wording, the checks of the admin's routes
// (the database checks the same limits) and the « Pour qui ? » sentence of the
// event dialog. Pure and unit-tested (memberGroups.test.ts).
import {
  GROUP_COLORS,
  GROUP_ICONS,
  GROUP_MEMBER_ROLES,
  GROUP_VISIBILITIES,
  PICKABLE_GROUP_KINDS,
  type GroupColor,
  type GroupIcon,
  type GroupKind,
  type GroupMemberRole,
  type GroupVisibility,
} from "../types/memberGroups";
import { slugify } from "./slug";

export const GROUP_NAME_MAX = 80;
export const GROUP_DESCRIPTION_MAX = 300;
export const GROUP_SLUG_MAX = 60;
export const GROUP_MEMBER_TITLE_MAX = 60;
/** Members added in one go (« Ajouter des membres »). */
export const GROUP_MEMBERS_ADD_MAX = 100;
/** Groups one event can be reserved for. */
export const EVENT_AUDIENCE_MAX = 20;

export const GROUP_KIND_LABELS: Record<GroupKind, string> = {
  instance: "Instance",
  commission: "Commission",
  ensemble: "Ensemble",
  autre: "Autre",
};

export const GROUP_KIND_HINTS: Record<GroupKind, string> = {
  instance: "Le CA, le bureau : une instance de l’association.",
  commission: "Une commission ou un groupe de travail.",
  ensemble: "Un ensemble de répétition.",
  autre: "Une équipe d’accueil, des bénévoles…",
};

export const GROUP_VISIBILITY_LABELS: Record<GroupVisibility, string> = {
  private: "Privé",
  members: "Visible des membres",
};

export const GROUP_VISIBILITY_DESCRIPTIONS: Record<GroupVisibility, string> = {
  private:
    "Seuls ses membres et les administrateurs voient le groupe, sa liste et ses événements.",
  members:
    "Tout membre voit que le groupe existe et qui en fait partie. Ses événements restent réservés à ses membres.",
};

export const GROUP_COLOR_LABELS: Record<GroupColor, string> = {
  teal: "Sarcelle",
  blue: "Bleu",
  green: "Vert",
  gold: "Or",
  slate: "Ardoise",
};

export const GROUP_ICON_LABELS: Record<GroupIcon, string> = {
  landmark: "Institution",
  users: "Personnes",
  music: "Musique",
  megaphone: "Communication",
  "calendar-days": "Agenda",
  "clipboard-list": "Liste",
  briefcase: "Dossier",
  "heart-handshake": "Accueil",
  "piggy-bank": "Finances",
  camera: "Photo",
  "book-open": "Archives",
  cake: "Anniversaire",
};

export const GROUP_MEMBER_ROLE_LABELS: Record<GroupMemberRole, string> = {
  member: "Membre",
  manager: "Responsable",
};

/** « Aucun membre », « 1 membre », « 11 membres ». */
export function groupMemberCountLabel(count: number): string {
  if (count === 0) return "Aucun membre";
  return count === 1 ? "1 membre" : `${count} membres`;
}

// ---------------------------------------------------------------------------
// Checks

export type Parsed<T> =
  { ok: true; value: T } | { ok: false; error: string; field?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function oneOf<T extends string>(values: readonly T[], raw: unknown): raw is T {
  return typeof raw === "string" && (values as readonly string[]).includes(raw);
}

export type GroupInput = {
  name: string;
  kind: GroupKind;
  description: string | null;
  color: GroupColor;
  icon: GroupIcon;
  visibility: GroupVisibility;
};

export type GroupPatch = Partial<GroupInput> & { archived?: boolean };

const GROUP_FIELDS = new Set([
  "name",
  "kind",
  "description",
  "color",
  "icon",
  "visibility",
]);

/**
 * POST /api/groups: every field but the description required; PATCH
 * /api/groups/[id] (`partial`): at least one field, plus `archived`.
 * Unknown keys are refused, so a body can't write `slug`, `is_system` or the
 * timestamps.
 */
export function parseGroupInput(body: unknown): Parsed<GroupInput>;
export function parseGroupInput(
  body: unknown,
  partial: true,
): Parsed<GroupPatch>;
export function parseGroupInput(
  body: unknown,
  partial = false,
): Parsed<GroupInput | GroupPatch> {
  if (!isRecord(body)) return { ok: false, error: "Données invalides" };
  const unknown = Object.keys(body).filter(
    (key) => !GROUP_FIELDS.has(key) && !(partial && key === "archived"),
  );
  if (unknown.length > 0) {
    return { ok: false, error: `Champs inconnus : ${unknown.join(", ")}` };
  }
  const out: GroupPatch = {};

  if ("name" in body || !partial) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name === "") {
      return { ok: false, error: "Le nom est obligatoire", field: "name" };
    }
    if (name.length > GROUP_NAME_MAX) {
      return {
        ok: false,
        error: `Le nom : ${GROUP_NAME_MAX} caractères au plus`,
        field: "name",
      };
    }
    out.name = name;
  }
  if ("kind" in body || !partial) {
    if (!oneOf(PICKABLE_GROUP_KINDS, body.kind)) {
      return { ok: false, error: "Type de groupe inconnu", field: "kind" };
    }
    out.kind = body.kind;
  }
  if ("description" in body) {
    const raw = body.description;
    if (raw !== null && typeof raw !== "string") {
      return {
        ok: false,
        error: "La description doit être un texte",
        field: "description",
      };
    }
    const description = raw?.trim() ?? "";
    if (description.length > GROUP_DESCRIPTION_MAX) {
      return {
        ok: false,
        error: `La description : ${GROUP_DESCRIPTION_MAX} caractères au plus`,
        field: "description",
      };
    }
    out.description = description || null;
  } else if (!partial) {
    out.description = null;
  }
  if ("color" in body || !partial) {
    if (!oneOf(GROUP_COLORS, body.color)) {
      return { ok: false, error: "Teinte inconnue", field: "color" };
    }
    out.color = body.color;
  }
  if ("icon" in body || !partial) {
    if (!oneOf(GROUP_ICONS, body.icon)) {
      return { ok: false, error: "Icône inconnue", field: "icon" };
    }
    out.icon = body.icon;
  }
  if ("visibility" in body || !partial) {
    if (!oneOf(GROUP_VISIBILITIES, body.visibility)) {
      return { ok: false, error: "Visibilité inconnue", field: "visibility" };
    }
    out.visibility = body.visibility;
  }
  if (partial && "archived" in body) {
    if (typeof body.archived !== "boolean") {
      return { ok: false, error: "Archivage invalide", field: "archived" };
    }
    out.archived = body.archived;
  }
  if (partial && Object.keys(out).length === 0) {
    return { ok: false, error: "Rien à modifier" };
  }
  return { ok: true, value: out };
}

/**
 * The slug of a new group, from its name and never one already taken (an
 * archived group keeps its slug): « Commission concerts » →
 * « commission-concerts », then « commission-concerts-2 »… « groupe » when
 * the name has no letter or digit.
 */
export function groupSlug(name: string, taken: ReadonlySet<string>): string {
  const base = slugify(name, GROUP_SLUG_MAX - 3) || "groupe";
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

export type MembersAdd = { profile_ids: string[]; role: GroupMemberRole };

/** POST /api/groups/[id]/members: `{ profile_ids, role? }`. */
export function parseMembersAdd(body: unknown): Parsed<MembersAdd> {
  if (!isRecord(body)) return { ok: false, error: "Données invalides" };
  const ids = body.profile_ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false, error: "Choisissez au moins un membre" };
  }
  if (ids.length > GROUP_MEMBERS_ADD_MAX) {
    return {
      ok: false,
      error: `${GROUP_MEMBERS_ADD_MAX} membres au plus à la fois`,
    };
  }
  if (!ids.every(isUuid)) return { ok: false, error: "Membre inconnu" };
  const role = body.role ?? "member";
  if (!oneOf(GROUP_MEMBER_ROLES, role)) {
    return { ok: false, error: "Rôle inconnu", field: "role" };
  }
  return {
    ok: true,
    value: {
      profile_ids: [...new Set(ids.map((id) => id.toLowerCase()))],
      role,
    },
  };
}

export type MemberUpdate = {
  profile_id: string;
  role?: GroupMemberRole;
  title?: string | null;
};

/** PATCH /api/groups/[id]/members: `{ profile_id, role?, title? }`. */
export function parseMemberUpdate(body: unknown): Parsed<MemberUpdate> {
  if (!isRecord(body) || !isUuid(body.profile_id)) {
    return { ok: false, error: "Membre inconnu" };
  }
  const out: MemberUpdate = { profile_id: body.profile_id.toLowerCase() };
  if ("role" in body) {
    if (!oneOf(GROUP_MEMBER_ROLES, body.role)) {
      return { ok: false, error: "Rôle inconnu", field: "role" };
    }
    out.role = body.role;
  }
  if ("title" in body) {
    const raw = body.title;
    if (raw !== null && typeof raw !== "string") {
      return {
        ok: false,
        error: "La fonction doit être un texte",
        field: "title",
      };
    }
    const title = raw?.trim() ?? "";
    if (title.length > GROUP_MEMBER_TITLE_MAX) {
      return {
        ok: false,
        error: `La fonction : ${GROUP_MEMBER_TITLE_MAX} caractères au plus`,
        field: "title",
      };
    }
    out.title = title || null;
  }
  if (out.role === undefined && out.title === undefined) {
    return { ok: false, error: "Rien à modifier" };
  }
  return { ok: true, value: out };
}

/** DELETE /api/groups/[id]/members: `{ profile_id }`. */
export function parseMemberRemove(body: unknown): Parsed<string> {
  if (!isRecord(body) || !isUuid(body.profile_id)) {
    return { ok: false, error: "Membre inconnu" };
  }
  return { ok: true, value: body.profile_id.toLowerCase() };
}

/**
 * The groups an event is for (`audience` of /api/events): an empty list is
 * every member. Ids are deduplicated; at most EVENT_AUDIENCE_MAX.
 */
export function parseAudience(value: unknown): Parsed<string[]> {
  if (!Array.isArray(value) || !value.every(isUuid)) {
    return { ok: false, error: "Groupes inconnus", field: "audience" };
  }
  const ids = [...new Set(value.map((id) => id.toLowerCase()))];
  if (ids.length > EVENT_AUDIENCE_MAX) {
    return {
      ok: false,
      error: `${EVENT_AUDIENCE_MAX} groupes au plus`,
      field: "audience",
    };
  }
  return { ok: true, value: ids };
}

// ---------------------------------------------------------------------------
// « Pour qui ? »

/** How many different people are in at least one of the groups. */
export function audiencePeopleCount(
  groupIds: readonly string[],
  memberIdsByGroup: Readonly<Record<string, readonly string[]>>,
): number {
  const people = new Set<string>();
  for (const id of groupIds) {
    for (const member of memberIdsByGroup[id] ?? []) people.add(member);
  }
  return people.size;
}

/**
 * The sentence under « Pour qui ? »: who will see the event and who is
 * notified. Phones only get the push when the member has the app.
 */
export function audienceSentence(
  people: number,
  groupNames: readonly string[],
): string {
  if (groupNames.length === 0) {
    return "Tous les membres le verront ; ceux qui ont l’application recevront une notification.";
  }
  const where =
    groupNames.length === 1
      ? `du groupe « ${groupNames[0]} »`
      : `de ces ${groupNames.length} groupes`;
  if (people === 0) {
    return `Personne n’est encore membre ${where} : seuls les administrateurs verront l’événement, et aucune notification ne partira.`;
  }
  return people === 1
    ? `Seule la personne ${where} le verra, avec les administrateurs, et recevra une notification si elle a l’application. Les autres membres ne le verront pas.`
    : `Seules les ${people} personnes ${where} le verront, avec les administrateurs, et recevront une notification si elles ont l’application. Les autres membres ne le verront pas.`;
}
