// One group: its page (every admin) and its changes (superadmins: rename,
// describe, archive). A group is archived, never deleted: its events keep
// their audience (event_audiences.group_id is ON DELETE RESTRICT).
import { checkAuthorization, checkSuperadminAuthorization } from "@/utils/auth";
import {
  badRequest,
  GROUP_EVENT_COLUMNS,
  groupErrorResponse,
  loadPeople,
  logGroupActivity,
  readJson,
} from "@/utils/groups/server";
import type {
  GroupDetail,
  GroupEventLine,
  GroupMember,
} from "@/utils/groups/types";
import { archiveBlocker, sortMembers } from "@/utils/groups/view";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import type { TablesUpdate } from "@repo/domain/database.types";
import type {
  GroupMemberRole,
  MemberGroup,
} from "@repo/domain/types/memberGroups";
import { parseGroupInput } from "@repo/domain/utils/memberGroups";
import { isUuid } from "@repo/domain/utils/orders";
import { parisToday } from "@repo/domain/utils/parisDay";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// A function: a Response body can only be read once.
const unknown = () =>
  NextResponse.json({ error: "Groupe introuvable" }, { status: 404 });

/** GET: the group, its members (« Responsable » first) and its next events. */
export async function GET(_request: Request, { params }: Params) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;
  if (!isUuid(id)) return unknown();

  const supabase = await createClient();
  const [group, memberships, audiences] = await Promise.all([
    supabase.from("member_groups").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("member_group_members")
      .select("profile_id, role, title, added_at")
      .eq("group_id", id),
    supabase.from("event_audiences").select("event_id").eq("group_id", id),
  ]);
  const failed = group.error ?? memberships.error ?? audiences.error;
  if (failed) {
    return groupErrorResponse(failed, "Le groupe n'a pas pu être chargé");
  }
  if (!group.data) return unknown();

  const today = parisToday();
  const eventIds = (audiences.data ?? []).map((a) => a.event_id);
  const events =
    eventIds.length === 0
      ? { data: [] as GroupEventLine[], error: null }
      : await supabase
          .from("events")
          .select(GROUP_EVENT_COLUMNS)
          .in("id", eventIds)
          .or(
            `date_to.gte.${today},and(date_to.is.null,date_from.gte.${today})`,
          )
          .order("date_from", { ascending: true })
          .order("time", { ascending: true });
  if (events.error) {
    return groupErrorResponse(
      events.error,
      "Les événements du groupe n'ont pas pu être chargés",
    );
  }

  try {
    const rows = memberships.data ?? [];
    const people = await loadPeople(
      createAdminClient(),
      rows.map((m) => m.profile_id),
    );
    const members: GroupMember[] = rows.flatMap((m) => {
      const person = people.get(m.profile_id);
      return person
        ? [
            {
              ...person,
              role: m.role as GroupMemberRole,
              title: m.title,
              added_at: m.added_at,
            },
          ]
        : [];
    });
    const body: GroupDetail = {
      // view-model: the CHECK constraints narrow kind, color, visibility.
      group: group.data as MemberGroup,
      members: sortMembers(members),
      upcoming: (events.data ?? []) as GroupEventLine[],
    };
    return NextResponse.json(body);
  } catch (error) {
    return groupErrorResponse(
      error as { code?: string },
      "Les membres du groupe n'ont pas pu être chargés",
    );
  }
}

/**
 * PATCH (superadmins): some of name, kind, description, color, icon,
 * visibility, and `archived` (true archives, false brings it back). The
 * conseil d'administration is never archived.
 */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await checkSuperadminAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;
  if (!isUuid(id)) return unknown();
  const parsed = parseGroupInput(await readJson(request), true);
  if (!parsed.ok) return badRequest(parsed.error, parsed.field);

  const admin = createAdminClient();
  const { data: current, error: readError } = await admin
    .from("member_groups")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (readError) {
    return groupErrorResponse(readError, "Le groupe n'a pas pu être modifié");
  }
  if (!current) return unknown();

  const { archived, ...fields } = parsed.value;
  if (archived === true) {
    const blocker = archiveBlocker(current as MemberGroup);
    if (blocker) return badRequest(blocker, "archived");
  }
  const update: TablesUpdate<"member_groups"> = { ...fields };
  if (archived !== undefined) {
    update.archived_at = archived
      ? (current.archived_at ?? new Date().toISOString())
      : null;
  }

  const { data, error } = await admin
    .from("member_groups")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error)
    return groupErrorResponse(error, "Le groupe n'a pas pu être modifié");

  const title =
    archived === true
      ? "Groupe archivé"
      : archived === false
        ? "Groupe rétabli"
        : "Groupe modifié";
  const description =
    archived === true
      ? `Le groupe « ${data.name} » a été archivé`
      : archived === false
        ? `Le groupe « ${data.name} » a été rétabli`
        : fields.name && fields.name !== current.name
          ? `Le groupe « ${current.name} » s'appelle maintenant « ${data.name} »`
          : `Le groupe « ${data.name} » a été modifié`;
  await logGroupActivity(admin, {
    actorId: auth.user.id,
    targetId: id,
    title,
    description,
    metadata: { group_id: id, group_name: data.name },
  });
  return NextResponse.json(data as MemberGroup);
}
