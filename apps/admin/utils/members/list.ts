// « Membres » (admin wave 4, #433): what the list and the member page show
// for an account, worded for the commission's volunteers. Pure and
// unit-tested (list.test.ts); the pages feed it `GET /api/users` and the
// roster review of `GET /api/users/sync`.
import type { StatusTone } from "@/components/ui/status-badge";
import type { User } from "@/types/user";
import {
  DEFAULT_KNOWN_VOICES,
  splitVoices,
} from "@repo/domain/roster/normalize";
import type {
  FieldChange,
  RosterOwnedField,
  RosterReview,
} from "@repo/domain/roster/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export type Role = User["role"];

/** The words the admin reads everywhere: the list, the member page, the account menu. */
export const ROLE_LABELS: Record<Role, string> = {
  user: "Membre",
  admin: "Administrateur",
  superadmin: "Super-administrateur",
};

/** What each role can do, under the role on the member page. */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  user: "Espace membres et application. Pas d’accès à cette administration.",
  admin:
    "En plus : modifie les concerts, le site public, la campagne 40 ans et la saison, invite des membres. Ne supprime pas de compte.",
  superadmin:
    "Tous les droits, y compris la suppression définitive d’un compte et la gestion des administrateurs.",
};

export type MemberStatus = "active" | "invited";

export const STATUS_LABELS: Record<MemberStatus, string> = {
  active: "Actif",
  invited: "Invitation envoyée",
};

export const STATUS_TONES: Record<MemberStatus, StatusTone> = {
  active: "success",
  invited: "info",
};

export const STATUS_DESCRIPTIONS: Record<MemberStatus, string> = {
  active:
    "Visible dans l’annuaire, accès à l’espace membres et à l’application.",
  invited:
    "N’a pas encore accepté l’invitation reçue par e-mail : pas encore de mot de passe.",
};

/** « Actif » once the e-mail is confirmed or the invitation accepted. */
export function memberStatus(user: Pick<User, "invite_status">): MemberStatus {
  return user.invite_status === "approuvé" ? "active" : "invited";
}

/** « Lucie BERNARD » → « LB »; the e-mail’s first letter when there is no name. */
export function initialsOf(name: string | null | undefined, email = "") {
  const words = (name ?? "")
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean);
  if (words.length === 0) return (email[0] ?? "?").toUpperCase();
  const first = words[0]!;
  const last = words.length > 1 ? words[words.length - 1]! : "";
  return (first[0]! + (last[0] ?? "")).toUpperCase();
}

/** The name shown for an account: its display name, else the e-mail’s local part. */
export function memberName(user: Pick<User, "display_name" | "email">) {
  return user.display_name?.trim() || user.email.split("@")[0] || user.email;
}

/** « Lucie » from « Lucie BERNARD », for sentences about the person. */
export function firstNameOf(user: Pick<User, "display_name" | "email">) {
  return memberName(user).split(/\s+/)[0] ?? memberName(user);
}

/** The stored voice (« Soprane & Jeune ») as chips. */
export function memberVoices(user: Pick<User, "voice">): string[] {
  return splitVoices(user.voice ?? "");
}

export const VOICE_OPTIONS = DEFAULT_KNOWN_VOICES;

/**
 * « à l'instant », « il y a 3 heures », « hier », « il y a 2 semaines »,
 * « jamais ». `now` is passed in so the wording is testable.
 */
export function lastSeenLabel(
  iso: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!iso) return "jamais";
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "jamais";
  const seconds = Math.round((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return "à l’instant";
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 7) return rtf.format(-days, "day");
  if (days < 31) return rtf.format(-Math.round(days / 7), "week");
  if (days < 365) return rtf.format(-Math.round(days / 30), "month");
  return rtf.format(-Math.round(days / 365), "year");
}

/** « 13 janvier 2026 ». */
export function formatDayFr(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "d MMMM yyyy", { locale: fr });
}

/** « 1 membre », « 127 membres ». */
export function memberCountLabel(count: number) {
  return `${count} ${count > 1 ? "membres" : "membre"}`;
}

// --- The roster review, per account -----------------------------------------

export type RosterFlag = {
  /** The roster no longer lists this account. */
  absent: boolean;
  /** The roster says otherwise for these fields. */
  changes: FieldChange[];
};

/** Per profile id, what the roster review says about the account. */
export function rosterFlags(
  review: RosterReview | undefined,
): Map<string, RosterFlag> {
  const flags = new Map<string, RosterFlag>();
  if (!review) return flags;
  const flagOf = (id: string) => {
    const existing = flags.get(id);
    if (existing) return existing;
    const created: RosterFlag = { absent: false, changes: [] };
    flags.set(id, created);
    return created;
  };
  for (const member of review.groups.absents)
    flagOf(member.profileId).absent = true;
  for (const member of review.groups.modifies) {
    flagOf(member.profileId).changes.push(...member.changes);
  }
  return flags;
}

/** Everything the sync page has to show, except unchanged accounts. */
export function pendingSyncCount(review: RosterReview | undefined) {
  if (!review) return 0;
  const { nouveaux, modifies, absents, aRegler } = review.groups;
  return nouveaux.length + modifies.length + absents.length + aRegler.length;
}

const plural = (count: number, one: string, many: string) =>
  `${count} ${count > 1 ? many : one}`;

/** « 2 nouveaux membres, 1 fiche à mettre à jour, 1 personne absente de la liste ». */
export function pendingSyncSummary(review: RosterReview | undefined) {
  if (!review) return "";
  const { nouveaux, modifies, absents, aRegler } = review.groups;
  return [
    nouveaux.length &&
      plural(nouveaux.length, "nouveau membre", "nouveaux membres"),
    modifies.length &&
      plural(
        modifies.length,
        "fiche à mettre à jour",
        "fiches à mettre à jour",
      ),
    absents.length &&
      plural(
        absents.length,
        "personne absente de la liste",
        "personnes absentes de la liste",
      ),
    aRegler.length &&
      plural(aRegler.length, "ligne à corriger", "lignes à corriger"),
  ]
    .filter(Boolean)
    .join(", ");
}

/** The roster-owned fields, as the member page names them. */
export const FIELD_NAMES: Record<RosterOwnedField, string> = {
  display_name: "Nom",
  address: "Adresse",
  home_phone: "Téléphone fixe",
  voice: "Voix",
};

/** A roster value as the admin reads it: « (vide) » rather than nothing. */
export function shownValue(value: string) {
  return value.trim() || "(vide)";
}

// --- Filters ----------------------------------------------------------------

export type StatusFilter = "all" | MemberStatus | "differs" | "absent";
export type RoleFilter = "all" | "user" | "admin";

export const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
  { value: "active", label: STATUS_LABELS.active },
  { value: "invited", label: STATUS_LABELS.invited },
  { value: "differs", label: "Diffère de la liste" },
  { value: "absent", label: "Absent de la liste" },
];

export const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "Tous les rôles" },
  { value: "user", label: "Membres" },
  { value: "admin", label: "Administrateurs" },
];

export type MemberFilters = {
  query: string;
  /** A voice from VOICE_OPTIONS, or "all". */
  voice: string;
  status: StatusFilter;
  role: RoleFilter;
};

export const NO_FILTERS: MemberFilters = {
  query: "",
  voice: "all",
  status: "all",
  role: "all",
};

const fold = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * The accounts matching the filters, sorted by name (French order). The
 * search ignores case and accents and looks at the name and the e-mail.
 */
export function filterMembers(
  users: User[],
  filters: MemberFilters,
  flags: Map<string, RosterFlag> = new Map(),
): User[] {
  const query = fold(filters.query.trim());
  const voiceKey = filters.voice === "all" ? "" : fold(filters.voice);
  return users
    .filter((user) => {
      if (query) {
        const haystack = fold(`${memberName(user)} ${user.email}`);
        if (!haystack.includes(query)) return false;
      }
      if (voiceKey && !memberVoices(user).some((v) => fold(v) === voiceKey)) {
        return false;
      }
      if (filters.role === "user" && user.role !== "user") return false;
      if (filters.role === "admin" && user.role === "user") return false;
      const flag = flags.get(user.id);
      switch (filters.status) {
        case "active":
        case "invited":
          return memberStatus(user) === filters.status;
        case "differs":
          return !!flag && flag.changes.length > 0;
        case "absent":
          return !!flag?.absent;
        default:
          return true;
      }
    })
    .sort((a, b) =>
      memberName(a).localeCompare(memberName(b), "fr", {
        sensitivity: "base",
      }),
    );
}

export function hasFilters(filters: MemberFilters) {
  return (
    filters.query.trim() !== "" ||
    filters.voice !== "all" ||
    filters.status !== "all" ||
    filters.role !== "all"
  );
}

// --- Who may do what (mirrors utils/access.ts, which the API enforces) ------

type Actor = { id: string | null | undefined; role: Role | null | undefined };

/** Why the role cannot be changed here, or null when it can. */
export function roleChangeBlocker(
  actor: Actor,
  target: Pick<User, "id" | "role">,
) {
  if (actor.id && actor.id === target.id) {
    return "Vous ne pouvez pas changer votre propre rôle.";
  }
  if (target.role === "superadmin" && actor.role !== "superadmin") {
    return "Seul un super-administrateur peut changer le rôle d’un super-administrateur.";
  }
  return null;
}

/** Why the account cannot be deleted by this admin, or null when it can. */
export function deletionBlocker(actor: Actor, target: Pick<User, "id">) {
  if (actor.id && actor.id === target.id) {
    return "Vous ne pouvez pas supprimer votre propre compte.";
  }
  if (actor.role !== "superadmin") {
    return "Réservé aux super-administrateurs.";
  }
  return null;
}
