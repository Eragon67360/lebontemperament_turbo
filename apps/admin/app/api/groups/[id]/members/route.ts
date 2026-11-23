// Who is in a group (every admin): add members, change a role (« Membre » /
// « Responsable ») or a title (« Trésorière »), remove someone. Each change
// is a line of « Activité récente ».
import { checkAuthorization } from "@/utils/auth";
import {
  badRequest,
  groupErrorResponse,
  loadPeople,
  logGroupActivity,
  readJson,
} from "@/utils/groups/server";
import { createAdminClient } from "@/utils/supabase/admin";
import type { TablesUpdate } from "@repo/domain/database.types";
import {
  GROUP_MEMBER_ROLE_LABELS,
  parseMemberRemove,
  parseMembersAdd,
  parseMemberUpdate,
} from "@repo/domain/utils/memberGroups";
import { isUuid } from "@repo/domain/utils/orders";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

const unknownGroup = () =>
  NextResponse.json({ error: "Groupe introuvable" }, { status: 404 });
const notInGroup = () =>
  NextResponse.json(
    { error: "Cette personne ne fait pas partie du groupe" },
    { status: 404 },
  );

type Admin = ReturnType<typeof createAdminClient>;

/** The group's name and whether it is archived, or null when it doesn't exist. */
async function readGroup(admin: Admin, id: string) {
  const { data, error } = await admin
    .from("member_groups")
    .select("id, name, archived_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function start(params: Params["params"]) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: auth.error },
        { status: auth.status },
      ),
    };
  }
  const { id } = await params;
  if (!isUuid(id)) return { ok: false as const, response: unknownGroup() };
  return { ok: true as const, id, actorId: auth.user.id };
}

/** POST `{ profile_ids, role? }`: those already in the group are left as they are. */
export async function POST(request: Request, { params }: Params) {
  const begin = await start(params);
  if (!begin.ok) return begin.response;
  const parsed = parseMembersAdd(await readJson(request));
  if (!parsed.ok) return badRequest(parsed.error, parsed.field);
  const { profile_ids, role } = parsed.value;

  const admin = createAdminClient();
  try {
    const group = await readGroup(admin, begin.id);
    if (!group) return unknownGroup();
    if (group.archived_at) {
      return badRequest(
        "Ce groupe est archivé : rétablissez-le avant d'y ajouter des membres.",
      );
    }

    const { data, error } = await admin
      .from("member_group_members")
      .upsert(
        profile_ids.map((profile_id) => ({
          group_id: begin.id,
          profile_id,
          role,
          added_by: begin.actorId,
        })),
        { onConflict: "group_id,profile_id", ignoreDuplicates: true },
      )
      .select("profile_id");
    if (error) throw error;

    const added = (data ?? []).map((row) => row.profile_id);
    if (added.length > 0) {
      const people = await loadPeople(admin, added);
      const only = added.length === 1 ? people.get(added[0]!) : undefined;
      await logGroupActivity(admin, {
        actorId: begin.actorId,
        targetId: only ? only.id : begin.id,
        title: "Membres d'un groupe",
        description: only
          ? `${only.name} a rejoint le groupe « ${group.name} »`
          : `${added.length} membres ont rejoint le groupe « ${group.name} »`,
        metadata: {
          group_id: begin.id,
          group_name: group.name,
          added: added.length,
        },
      });
    }
    return NextResponse.json({ added: added.length });
  } catch (error) {
    return groupErrorResponse(
      error as { code?: string },
      "Les membres n'ont pas pu être ajoutés",
    );
  }
}

/** PATCH `{ profile_id, role?, title? }`. */
export async function PATCH(request: Request, { params }: Params) {
  const begin = await start(params);
  if (!begin.ok) return begin.response;
  const parsed = parseMemberUpdate(await readJson(request));
  if (!parsed.ok) return badRequest(parsed.error, parsed.field);
  const { profile_id, ...change } = parsed.value;

  const admin = createAdminClient();
  try {
    const group = await readGroup(admin, begin.id);
    if (!group) return unknownGroup();

    const update: TablesUpdate<"member_group_members"> = {};
    if (change.role !== undefined) update.role = change.role;
    if (change.title !== undefined) update.title = change.title;
    const { data, error } = await admin
      .from("member_group_members")
      .update(update)
      .eq("group_id", begin.id)
      .eq("profile_id", profile_id)
      .select("profile_id, role, title");
    if (error) throw error;
    if (!data || data.length === 0) return notInGroup();

    const person = (await loadPeople(admin, [profile_id])).get(profile_id);
    const name = person?.name ?? "Un membre";
    const what = [
      change.role !== undefined &&
        `rôle « ${GROUP_MEMBER_ROLE_LABELS[change.role]} »`,
      change.title !== undefined &&
        (change.title ? `fonction « ${change.title} »` : "sans fonction"),
    ]
      .filter(Boolean)
      .join(", ");
    await logGroupActivity(admin, {
      actorId: begin.actorId,
      targetId: profile_id,
      title: "Membres d'un groupe",
      description: `${name}, groupe « ${group.name} » : ${what}`,
      metadata: { group_id: begin.id, group_name: group.name },
    });
    return NextResponse.json(data[0]);
  } catch (error) {
    return groupErrorResponse(
      error as { code?: string },
      "Le membre n'a pas pu être modifié",
    );
  }
}

/** DELETE `{ profile_id }`: the person leaves the group. */
export async function DELETE(request: Request, { params }: Params) {
  const begin = await start(params);
  if (!begin.ok) return begin.response;
  const parsed = parseMemberRemove(await readJson(request));
  if (!parsed.ok) return badRequest(parsed.error, parsed.field);
  const profile_id = parsed.value;

  const admin = createAdminClient();
  try {
    const group = await readGroup(admin, begin.id);
    if (!group) return unknownGroup();

    // The name for « Activité récente ».
    const person = (await loadPeople(admin, [profile_id])).get(profile_id);
    const { data, error } = await admin
      .from("member_group_members")
      .delete()
      .eq("group_id", begin.id)
      .eq("profile_id", profile_id)
      .select("profile_id");
    if (error) throw error;
    if (!data || data.length === 0) return notInGroup();

    await logGroupActivity(admin, {
      actorId: begin.actorId,
      targetId: profile_id,
      title: "Membres d'un groupe",
      description: `${person?.name ?? "Un membre"} a quitté le groupe « ${group.name} »`,
      metadata: { group_id: begin.id, group_name: group.name },
    });
    return NextResponse.json({ removed: 1 });
  } catch (error) {
    return groupErrorResponse(
      error as { code?: string },
      "Le membre n'a pas pu être retiré",
    );
  }
}
