// The /api/groups routes run as Next.js runs them, with the session and the
// Supabase clients replaced by stubs (Node's in-thread module hooks, before
// the routes are imported), like app/api/bodyValidation.test.ts. It checks
// who may call what (every admin reads and changes members; only a
// superadmin creates, edits or archives), that a body is refused before any
// database client exists, and what reaches the database.
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

type Refused = { authorized: false; error: string; status: 401 | 403 };
type Auth =
  | { authorized: true; user: { id: string }; role: "admin" | "superadmin" }
  | Refused;
type Result = { data: unknown; error: unknown };

const state = {
  auth: { authorized: false, error: "Non authentifié", status: 401 } as Auth,
  clients: 0,
  calls: [] as unknown[][],
  results: [] as Result[],
  client: () => fakeClient(),
};
(globalThis as { __groupsTest?: typeof state }).__groupsTest = state;

const STUBS: Record<string, string> = {
  "@/utils/auth": `
    export const checkAuthorization = async () => globalThis.__groupsTest.auth;
    export const checkSuperadminAuthorization = async () => {
      const auth = globalThis.__groupsTest.auth;
      if (auth.authorized && auth.role !== "superadmin") {
        return { authorized: false, error: "Réservé aux superadmins", status: 403 };
      }
      return auth;
    };`,
  "@/utils/supabase/server":
    "export const createClient = async () => globalThis.__groupsTest.client();",
  "@/utils/supabase/admin":
    "export const createAdminClient = () => globalThis.__groupsTest.client();",
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    const source = STUBS[specifier];
    if (source === undefined) return nextResolve(specifier, context);
    return {
      url: `data:text/javascript,${encodeURIComponent(source)}`,
      shortCircuit: true,
    };
  },
});

function fakeClient() {
  state.clients += 1;
  const query: object = new Proxy(
    {},
    {
      get(_target, property) {
        if (property === "then") {
          return (resolve: (result: Result) => void) =>
            resolve(state.results.shift() ?? { data: null, error: null });
        }
        return (...args: unknown[]) => {
          state.calls.push([String(property), ...args]);
          return query;
        };
      },
    },
  );
  return {
    from(table: string) {
      state.calls.push(["from", table]);
      return query;
    },
  };
}

const groups = await import("./route");
const group = await import("./[id]/route");
const members = await import("./[id]/members/route");

const ACTOR = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";
const GROUP = "6f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f";
const P1 = "00000000-0000-4000-8000-000000000001";
const P2 = "00000000-0000-4000-8000-000000000002";
const ANONYMOUS: Refused = {
  authorized: false,
  error: "Non authentifié",
  status: 401,
};
const MEMBER: Refused = {
  authorized: false,
  error: "Non autorisé",
  status: 403,
};
const admin: Auth = { authorized: true, user: { id: ACTOR }, role: "admin" };
const superadmin: Auth = { ...admin, role: "superadmin" };

function reset(auth: Auth, results: Result[] = []) {
  state.auth = auth;
  state.clients = 0;
  state.calls = [];
  state.results = results;
}
function request(method: string, body?: unknown) {
  return new Request("http://admin.test/api/groups", {
    method,
    headers: { "content-type": "application/json" },
    body:
      body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
  });
}
async function answer(response: Response) {
  return { status: response.status, body: await response.json() };
}
const params = (id: string) => ({ params: Promise.resolve({ id }) });
/** The first insert or upsert made on `table`, if any. */
function inserted(table: string) {
  const from = state.calls.findIndex((c) => c[0] === "from" && c[1] === table);
  if (from < 0) return undefined;
  return state.calls
    .slice(from + 1)
    .find((c) => c[0] === "insert" || c[0] === "upsert");
}

const ca = {
  id: GROUP,
  name: "Conseil d’administration",
  slug: "ca",
  kind: "instance",
  description: null,
  color: "teal",
  icon: "landmark",
  visibility: "private",
  is_system: true,
  archived_at: null,
  created_by: null,
  created_at: "2026-11-23T18:00:00Z",
  updated_at: "2026-11-23T18:00:00Z",
};
const newGroup = {
  name: " Commission concerts ",
  kind: "commission",
  color: "blue",
  icon: "music",
  visibility: "members",
};

// --- Who may call what: refused before the body and any client ---
const EVERY_ADMIN: [string, (r: Request) => Promise<Response>][] = [
  ["GET /api/groups", () => groups.GET()],
  ["GET /api/groups/[id]", (r) => group.GET(r, params(GROUP))],
  ["POST members", (r) => members.POST(r, params(GROUP))],
  ["PATCH members", (r) => members.PATCH(r, params(GROUP))],
  ["DELETE members", (r) => members.DELETE(r, params(GROUP))],
];
const SUPERADMIN_ONLY: [string, (r: Request) => Promise<Response>][] = [
  ["POST /api/groups", (r) => groups.POST(r)],
  ["PATCH /api/groups/[id]", (r) => group.PATCH(r, params(GROUP))],
];
for (const [label, handler] of [...EVERY_ADMIN, ...SUPERADMIN_ONLY]) {
  for (const caller of [ANONYMOUS, MEMBER]) {
    reset(caller);
    const sent = request("POST", { name: "x" });
    assert.deepEqual(
      await answer(await handler(sent)),
      { status: caller.status, body: { error: caller.error } },
      `${label}: ${caller.status}`,
    );
    assert.equal(sent.bodyUsed, false, `${label}: body left unread`);
    assert.equal(state.clients, 0, `${label}: no client`);
  }
}
for (const [label, handler] of SUPERADMIN_ONLY) {
  reset(admin);
  const sent = request("POST", newGroup);
  assert.equal((await handler(sent)).status, 403, `${label}: admin refused`);
  assert.equal(state.clients, 0, `${label}: admin, no client`);
}

// --- A body is checked before any client ---
reset(superadmin);
assert.deepEqual(
  await answer(
    await groups.POST(
      request("POST", { ...newGroup, slug: "ca", is_system: true }),
    ),
  ),
  { status: 400, body: { error: "Champs inconnus : slug, is_system" } },
);
assert.equal(state.clients, 0);
reset(superadmin);
assert.deepEqual(
  await answer(await groups.POST(request("POST", { ...newGroup, name: " " }))),
  { status: 400, body: { error: "Le nom est obligatoire", field: "name" } },
);
assert.equal(state.clients, 0);
reset(admin);
assert.equal(
  (await members.POST(request("POST", { profile_ids: ["x"] }), params(GROUP)))
    .status,
  400,
);
assert.equal(state.clients, 0);
reset(admin);
assert.equal(
  (await members.POST(request("POST", { profile_ids: [P1] }), params("ca")))
    .status,
  404,
  "a group id that is no uuid",
);
assert.equal(state.clients, 0);

// --- Creation: the slug from the name, never one already taken ---
{
  reset(superadmin, [
    { data: [{ slug: "ca" }, { slug: "commission-concerts" }], error: null },
    {
      data: { ...ca, id: P2, name: "Commission concerts", is_system: false },
      error: null,
    },
    { data: null, error: null },
  ]);
  const created = await answer(await groups.POST(request("POST", newGroup)));
  assert.equal(created.status, 201);
  assert.deepEqual(inserted("member_groups"), [
    "insert",
    {
      name: "Commission concerts",
      kind: "commission",
      description: null,
      color: "blue",
      icon: "music",
      visibility: "members",
      slug: "commission-concerts-2",
      created_by: ACTOR,
    },
  ]);
  const activity = inserted("activities")?.[1] as Record<string, unknown>;
  assert.equal(activity.type, "group_updated");
  assert.equal(activity.user_id, ACTOR);
}
{
  // Two live groups can't share a name: a 409 in words.
  reset(superadmin, [
    { data: [], error: null },
    { data: null, error: { code: "23505", message: "duplicate key value" } },
  ]);
  assert.deepEqual(await answer(await groups.POST(request("POST", newGroup))), {
    status: 409,
    body: { status: 409, error: "Un autre groupe porte déjà ce nom" },
  });
}

// --- The CA is never archived; another group is, and comes back ---
{
  reset(superadmin, [{ data: ca, error: null }]);
  const refused = await answer(
    await group.PATCH(request("PATCH", { archived: true }), params(GROUP)),
  );
  assert.equal(refused.status, 400);
  assert.equal(refused.body.field, "archived");
  assert.equal(
    state.calls.some(([method]) => method === "update"),
    false,
  );

  const bureau = { ...ca, name: "Bureau", slug: "bureau", is_system: false };
  reset(superadmin, [
    { data: bureau, error: null },
    { data: { ...bureau, archived_at: "2026-11-23T19:00:00Z" }, error: null },
    { data: null, error: null },
  ]);
  assert.equal(
    (await group.PATCH(request("PATCH", { archived: true }), params(GROUP)))
      .status,
    200,
  );
  const update = state.calls.find(([method]) => method === "update")?.[1] as {
    archived_at: string;
  };
  assert.match(update.archived_at, /^\d{4}-\d{2}-\d{2}T/);

  reset(superadmin, [
    { data: { ...bureau, archived_at: "2026-11-23T19:00:00Z" }, error: null },
    { data: bureau, error: null },
    { data: null, error: null },
  ]);
  await group.PATCH(request("PATCH", { archived: false }), params(GROUP));
  assert.deepEqual(
    state.calls.find(([method]) => method === "update"),
    ["update", { archived_at: null }],
  );
}

// --- Members: added once each, never to an archived group ---
{
  reset(admin, [
    { data: { id: GROUP, name: "Bureau", archived_at: null }, error: null },
    { data: [{ profile_id: P2 }], error: null },
    {
      data: [
        {
          id: P2,
          display_name: "Jean DUPONT",
          email: null,
          profile_picture_url: null,
        },
      ],
      error: null,
    },
    { data: null, error: null },
  ]);
  const added = await answer(
    await members.POST(
      request("POST", { profile_ids: [P1, P2, P2.toUpperCase()] }),
      params(GROUP),
    ),
  );
  assert.deepEqual(added, { status: 200, body: { added: 1 } });
  const upsert = state.calls.find(([method]) => method === "upsert");
  assert.deepEqual(upsert, [
    "upsert",
    [
      { group_id: GROUP, profile_id: P1, role: "member", added_by: ACTOR },
      { group_id: GROUP, profile_id: P2, role: "member", added_by: ACTOR },
    ],
    { onConflict: "group_id,profile_id", ignoreDuplicates: true },
  ]);
  const activity = inserted("activities")?.[1] as Record<string, unknown>;
  assert.equal(
    activity.description,
    "Jean DUPONT a rejoint le groupe « Bureau »",
  );
  assert.equal(activity.target_id, P2);
}
{
  reset(admin, [
    {
      data: { id: GROUP, name: "Bureau", archived_at: "2026-11-23T19:00:00Z" },
      error: null,
    },
  ]);
  assert.equal(
    (await members.POST(request("POST", { profile_ids: [P1] }), params(GROUP)))
      .status,
    400,
  );
  assert.equal(
    state.calls.some(([method]) => method === "upsert"),
    false,
  );
}
{
  // Someone not in the group: 404, nothing logged.
  reset(admin, [
    { data: { id: GROUP, name: "Bureau", archived_at: null }, error: null },
    { data: [], error: null },
    { data: [], error: null },
  ]);
  assert.deepEqual(
    await answer(
      await members.DELETE(
        request("DELETE", { profile_id: P1 }),
        params(GROUP),
      ),
    ),
    {
      status: 404,
      body: { error: "Cette personne ne fait pas partie du groupe" },
    },
  );
  assert.equal(inserted("activities"), undefined);
}
{
  // « Responsable » and a function in one write.
  reset(admin, [
    { data: { id: GROUP, name: "Bureau", archived_at: null }, error: null },
    {
      data: [{ profile_id: P1, role: "manager", title: "Trésorière" }],
      error: null,
    },
    { data: [], error: null },
    { data: null, error: null },
  ]);
  assert.equal(
    (
      await members.PATCH(
        request("PATCH", {
          profile_id: P1,
          role: "manager",
          title: " Trésorière ",
        }),
        params(GROUP),
      )
    ).status,
    200,
  );
  assert.deepEqual(
    state.calls.find(([method]) => method === "update"),
    ["update", { role: "manager", title: "Trésorière" }],
  );
}

// --- Before the migration: 503 notInstalled, the page says so ---
{
  reset(admin, [
    { data: null, error: { code: "PGRST205", message: "no table" } },
    { data: null, error: null },
    { data: null, error: null },
    { data: null, error: null },
  ]);
  const early = await answer(await groups.GET());
  assert.equal(early.status, 503);
  assert.equal(early.body.notInstalled, true);
}

console.log("admin API groups: all assertions passed");
