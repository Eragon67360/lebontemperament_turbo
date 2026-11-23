// « Groupes » (the CA, commissions…): the list for every admin, the creation
// for superadmins. Migration 20261123185221_member_groups.sql; before it is
// applied every route answers 503 `notInstalled`.
import { checkAuthorization, checkSuperadminAuthorization } from "@/utils/auth";
import {
  badRequest,
  GROUP_EVENT_COLUMNS,
  groupErrorResponse,
  loadPeople,
  logGroupActivity,
  readJson,
} from "@/utils/groups/server";
import type { GroupEventLine, GroupsData } from "@/utils/groups/types";
import { buildGroupSummaries } from "@/utils/groups/view";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import type {
  GroupMemberRole,
  MemberGroup,
} from "@repo/domain/types/memberGroups";
import { groupSlug, parseGroupInput } from "@repo/domain/utils/memberGroups";
import { parisToday } from "@repo/domain/utils/parisDay";
import { NextResponse } from "next/server";

/**
 * GET: every group (archived ones included, the page folds them away) with
 * its members' ids, a few avatars, its « Responsable » and its next event.
 */
export async function GET() {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // RLS lets admins read every group, membership and audience.
  const supabase = await createClient();
  const today = parisToday();
  const [groups, memberships, audiences, events] = await Promise.all([
    supabase.from("member_groups").select("*"),
    supabase.from("member_group_members").select("group_id, profile_id, role"),
    supabase.from("event_audiences").select("event_id, group_id"),
    // The events not over yet: the only ones a card names.
    supabase
      .from("events")
      .select(GROUP_EVENT_COLUMNS)
      .or(`date_to.gte.${today},and(date_to.is.null,date_from.gte.${today})`),
  ]);
  const failed =
    groups.error ?? memberships.error ?? audiences.error ?? events.error;
  if (failed) {
    return groupErrorResponse(failed, "Les groupes n'ont pas pu être chargés");
  }

  try {
    const memberRows = memberships.data ?? [];
    const people = await loadPeople(
      createAdminClient(),
      memberRows.map((m) => m.profile_id),
    );
    const body: GroupsData = {
      groups: buildGroupSummaries({
        // view-model: the CHECK constraints narrow kind, color, visibility.
        groups: (groups.data ?? []) as MemberGroup[],
        memberships: memberRows as {
          group_id: string;
          profile_id: string;
          role: GroupMemberRole;
        }[],
        people,
        audiences: audiences.data ?? [],
        events: (events.data ?? []) as GroupEventLine[],
        today,
      }),
    };
    return NextResponse.json(body);
  } catch (error) {
    return groupErrorResponse(
      error as { code?: string },
      "Les membres des groupes n'ont pas pu être chargés",
    );
  }
}

/** POST (superadmins): a new group; its slug comes from its name. */
export async function POST(request: Request) {
  const auth = await checkSuperadminAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const parsed = parseGroupInput(await readJson(request));
  if (!parsed.ok) return badRequest(parsed.error, parsed.field);

  const admin = createAdminClient();
  const { data: taken, error: slugError } = await admin
    .from("member_groups")
    .select("slug");
  if (slugError) {
    return groupErrorResponse(slugError, "Le groupe n'a pas pu être créé");
  }
  const slug = groupSlug(
    parsed.value.name,
    new Set((taken ?? []).map((row) => row.slug)),
  );

  const { data, error } = await admin
    .from("member_groups")
    .insert({ ...parsed.value, slug, created_by: auth.user.id })
    .select("*")
    .single();
  if (error) return groupErrorResponse(error, "Le groupe n'a pas pu être créé");

  await logGroupActivity(admin, {
    actorId: auth.user.id,
    targetId: data.id,
    title: "Nouveau groupe",
    description: `Le groupe « ${data.name} » a été créé`,
    metadata: { group_id: data.id, group_name: data.name },
  });
  return NextResponse.json(data as MemberGroup, { status: 201 });
}
