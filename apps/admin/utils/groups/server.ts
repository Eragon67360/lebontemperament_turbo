// « Groupes »: what the /api/groups routes (and the audience part of
// /api/events) share. Every route checks the admin first; the tables are
// read with the admin's session (RLS lets admins read every group) and
// written with the service role, since members and admins only have SELECT.
import type { GroupPerson } from "@/utils/groups/types";
import type { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

type AdminClient = ReturnType<typeof createAdminClient>;

export const GROUPS_NOT_INSTALLED_MESSAGE =
  "Les groupes ne sont pas encore installés sur cette base : la migration doit d'abord être appliquée.";

/** The event columns a group's card and page show. */
export const GROUP_EVENT_COLUMNS =
  "id, title, date_from, date_to, time, location";

/**
 * The French messages raised by the migration's functions and triggers: the
 * only database messages passed on to the admin. Any other message (a CHECK
 * constraint's) names tables and columns, so it stays in the server log.
 */
export const OWN_DATABASE_MESSAGES = new Set([
  "Un événement public ne peut pas être réservé à des groupes",
  "Un événement réservé à des groupes ne peut pas être public",
  "Événement manquant",
  "Groupe inconnu ou archivé",
  "Événement introuvable",
]);

/** 42P01 / PGRST205 (table) or 42883 / PGRST202 (function): not migrated yet. */
export function isNotInstalled(error: { code?: string | null } | null) {
  const code = error?.code;
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    code === "42883" ||
    code === "PGRST202"
  );
}

export type GroupErrorLike = {
  code?: string | null;
  message?: string | null;
} | null;

export type DescribedGroupError = {
  status: 400 | 403 | 404 | 409 | 500 | 503;
  error: string;
  notInstalled?: true;
};

/**
 * The answer for a failed database call of the groups routes, worded for
 * the admin: 503 `notInstalled` before the migration, the migration's own
 * French messages, « déjà ce nom » for the live-name index, and `fallback`
 * (500) for anything else.
 */
export function describeGroupError(
  error: GroupErrorLike,
  fallback: string,
): DescribedGroupError {
  if (isNotInstalled(error)) {
    return {
      status: 503,
      error: GROUPS_NOT_INSTALLED_MESSAGE,
      notInstalled: true,
    };
  }
  const message = error?.message?.trim() ?? "";
  const own = OWN_DATABASE_MESSAGES.has(message);
  switch (error?.code) {
    case "P0002":
    case "PGRST116":
      return { status: 404, error: own ? message : "Introuvable" };
    case "23505":
      return { status: 409, error: "Un autre groupe porte déjà ce nom" };
    case "23503":
      return { status: 400, error: "Membre ou groupe introuvable" };
    case "42501":
      return { status: 403, error: "Action non autorisée" };
    case "22023":
    case "23514":
      return {
        status: 400,
        error: own ? message : "Valeurs refusées par la base de données",
      };
    default:
      return { status: 500, error: fallback };
  }
}

/** The JSON answer for a database error (see `describeGroupError`). */
export function groupErrorResponse(error: GroupErrorLike, fallback: string) {
  const described = describeGroupError(error, fallback);
  if (described.status === 500) console.error(fallback, error);
  return NextResponse.json(described, { status: described.status });
}

/** A body that is no JSON at all reads as `undefined`, refused by the parser. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

/** A refused body: `{ error, field? }` with 400. */
export function badRequest(error: string, field?: string) {
  return NextResponse.json(field ? { error, field } : { error }, {
    status: 400,
  });
}

export type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  profile_picture_url: string | null;
};

/** A profile as the groups pages show it. */
export function personOf(profile: ProfileRow): GroupPerson {
  return {
    id: profile.id,
    name:
      profile.display_name?.trim() || profile.email?.split("@")[0] || "Membre",
    email: profile.email,
    avatar: profile.profile_picture_url || null,
  };
}

/** The people behind `ids`, by id (unknown ids are left out). */
export async function loadPeople(
  admin: AdminClient,
  ids: readonly string[],
): Promise<Map<string, GroupPerson>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  const { data, error } = await admin
    .from("profiles")
    .select("id, display_name, email, profile_picture_url")
    .in("id", unique);
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, personOf(row)]));
}

/**
 * One line of « Activité récente » (`group_updated`). A failed write is
 * logged, never a failed request: the change itself is done.
 */
export async function logGroupActivity(
  admin: AdminClient,
  entry: {
    actorId: string;
    targetId?: string | null;
    title: string;
    description: string;
    metadata: Record<string, string | number | boolean | null>;
  },
) {
  const { error } = await admin.from("activities").insert({
    type: "group_updated",
    user_id: entry.actorId,
    target_id: entry.targetId ?? null,
    title: entry.title,
    description: entry.description,
    metadata: entry.metadata,
  });
  if (error) console.error("Error logging a group change:", error);
}
