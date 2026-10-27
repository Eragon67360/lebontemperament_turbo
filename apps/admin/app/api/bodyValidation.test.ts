// The routes of CODE-004 run as Next.js runs them, with the session, the
// Supabase clients and the website revalidation replaced by stubs (Node's
// in-thread module hooks, before the routes are imported). It checks the
// order of the refusals: the caller first (anonymous 401, member 403, the
// superadmin-only e-mail change), then the body, both before any database
// client exists; and that a write carries the parsed body, never the raw one.
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

type Refused = { authorized: false; error: string; status: 401 | 403 };
type Auth =
  | { authorized: true; user: { id: string }; role: "admin" | "superadmin" }
  | Refused;
type Result = { data: unknown; error: unknown };

const state = {
  auth: { authorized: false, error: "Non authentifié", status: 401 } as Auth,
  /** Database clients created (session or service role). */
  clients: 0,
  /** Every query-builder call, in order: `["from", "cas"]`, `["insert", …]`. */
  calls: [] as unknown[][],
  /** What each awaited query answers, in order. */
  results: [] as Result[],
  client: () => fakeClient(),
};
(globalThis as { __routeTest?: typeof state }).__routeTest = state;

const STUBS: Record<string, string> = {
  "@/utils/auth":
    "export const checkAuthorization = async () => globalThis.__routeTest.auth;",
  "@/utils/supabase/server":
    "export const createClient = async () => globalThis.__routeTest.client();",
  "@/utils/supabase/admin":
    "export const createAdminClient = () => globalThis.__routeTest.client();",
  "@/utils/revalidateWebsite":
    "export const REVALIDATE = { agenda: {} }; export const revalidateWebsiteAfterResponse = () => {};",
  "@/utils/events/documents": "export const removeEventFiles = async () => {};",
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

/** A Supabase client that records each call and answers from `results`. */
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

// Everything that may reach a stubbed module is imported after the hooks.
const { toEventPayload, toRehearsalPayloads } =
  await import("../../utils/season/schedule");
const cas = await import("./cas/route");
const bugMessages = await import("./bug-messages/route");
const markRead = await import("./bug-messages/mark-read/route");
const rehearsals = await import("./rehearsals/route");
const rehearsal = await import("./rehearsals/[id]/route");
const events = await import("./events/route");
const users = await import("./users/route");
const usersEmail = await import("./users/email/route");

const ADMIN = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";
const ID = "6f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f";
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
const admin: Auth = { authorized: true, user: { id: ADMIN }, role: "admin" };
const superadmin: Auth = { ...admin, role: "superadmin" };

function reset(auth: Auth, results: Result[] = []) {
  state.auth = auth;
  state.clients = 0;
  state.calls = [];
  state.results = results;
}

function request(method: string, body: unknown) {
  return new Request("http://admin.test/api", {
    method,
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

// POST /api/users has a path that answers nothing (no account returned).
async function answer(response: Response | undefined) {
  assert.ok(response, "the handler answered");
  return { status: response.status, body: await response.json() };
}

/** Runs with console.error silenced (the routes log database errors). */
async function quietly<T>(run: () => Promise<T>): Promise<T> {
  const consoleError = console.error;
  console.error = () => {};
  try {
    return await run();
  } finally {
    console.error = consoleError;
  }
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });

type Handler = (request: Request) => Promise<Response | undefined>;
const HANDLERS: [string, string, Handler][] = [
  ["POST", "/api/cas", cas.POST],
  ["PATCH", "/api/cas", cas.PATCH],
  ["DELETE", "/api/cas", cas.DELETE],
  ["POST", "/api/bug-messages", bugMessages.POST],
  ["PATCH", "/api/bug-messages", bugMessages.PATCH],
  ["DELETE", "/api/bug-messages", bugMessages.DELETE],
  ["POST", "/api/bug-messages/mark-read", markRead.POST],
  ["POST", "/api/rehearsals", rehearsals.POST],
  ["PATCH", "/api/rehearsals/[id]", (r) => rehearsal.PATCH(r, params(ID))],
  ["POST", "/api/events", events.POST],
  ["PATCH", "/api/events", events.PATCH],
  ["DELETE", "/api/events", events.DELETE],
  ["POST", "/api/users", users.POST],
  ["PATCH", "/api/users", users.PATCH],
  ["PATCH", "/api/users/email", usersEmail.PATCH],
];

for (const [method, path, handler] of HANDLERS) {
  const label = `${method} ${path}`;

  // Anonymous and member: refused before the body is read.
  for (const caller of [ANONYMOUS, MEMBER]) {
    reset(caller);
    const sent = request(method, { created_by: ADMIN });
    assert.deepEqual(
      await answer(await handler(sent)),
      { status: caller.status, body: { error: caller.error } },
      `${label}: ${caller.status}`,
    );
    assert.equal(sent.bodyUsed, false, `${label}: body left unread`);
    assert.equal(state.clients, 0, `${label}: no database client`);
  }

  // An admin's body with a column no screen sends: refused by name, and
  // nothing reaches the database. (The e-mail change is superadmin-only.)
  const signedIn = path === "/api/users/email" ? superadmin : admin;
  reset(signedIn);
  assert.deepEqual(
    await answer(await handler(request(method, { created_at: "2026-01-01" }))),
    { status: 400, body: { error: "Champs non modifiables : created_at" } },
    `${label}: unknown column`,
  );
  assert.equal(state.clients, 0, `${label}: unknown column, no client`);

  reset(signedIn);
  assert.deepEqual(
    await answer(await handler(request(method, "{"))),
    { status: 400, body: { error: "Corps de requête invalide" } },
    `${label}: not JSON`,
  );
  assert.equal(state.clients, 0, `${label}: not JSON, no client`);
}

// --- The account routes keep their own refusals, after the parse ---
{
  // An admin cannot change a sign-in e-mail, whatever the body says.
  reset(admin);
  const sent = request("PATCH", { userId: ID, email: "new@example.com" });
  assert.deepEqual(await answer(await usersEmail.PATCH(sent)), {
    status: 403,
    body: {
      error: "Seul un super administrateur peut changer l'email d'un compte",
    },
  });
  assert.equal(sent.bodyUsed, false);
  assert.equal(state.clients, 0);

  // An admin cannot create an administrator: refused before any client.
  reset(admin);
  assert.deepEqual(
    await answer(
      await users.POST(
        request("POST", {
          email: "member@example.com",
          password: "test".repeat(6),
          role: "admin",
          display_name: "Prénom NOM",
        }),
      ),
    ),
    {
      status: 403,
      body: {
        error:
          "Seul un super administrateur peut créer un compte administrateur",
      },
    },
  );
  assert.equal(state.clients, 0);

  // Account options are never taken from the body.
  reset(superadmin);
  assert.deepEqual(
    await answer(
      await users.POST(
        request("POST", {
          email: "member@example.com",
          password: "test".repeat(6),
          role: "user",
          user_metadata: { role: "superadmin" },
        }),
      ),
    ),
    { status: 400, body: { error: "Champs non modifiables : user_metadata" } },
  );
  assert.equal(state.clients, 0);

  reset(superadmin);
  assert.deepEqual(
    await answer(
      await users.PATCH(request("PATCH", { userId: "moi", role: "admin" })),
    ),
    { status: 400, body: { error: "Champs invalides : userId" } },
  );
  assert.equal(state.clients, 0);
}

// --- What is written is the parsed body ---
{
  reset(admin, [
    {
      data: { id: ID, title: "CA d'octobre", date_from: "2026-10-12" },
      error: null,
    },
    { data: null, error: null },
  ]);
  const response = await cas.POST(
    request("POST", {
      title: "  CA d'octobre ",
      date_from: "2026-10-12",
      file_url: null,
    }),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(state.calls.slice(0, 2), [
    ["from", "cas"],
    [
      "insert",
      [
        {
          title: "CA d'octobre",
          date_from: "2026-10-12",
          file_url: null,
          created_by: ADMIN,
        },
      ],
    ],
  ]);

  reset(admin, [{ data: { id: ID }, error: null }]);
  await cas.PATCH(request("PATCH", { id: ID, title: "CA" }));
  assert.deepEqual(state.calls.slice(0, 3), [
    ["from", "cas"],
    ["update", { title: "CA" }],
    ["eq", "id", ID],
  ]);
}
{
  // A message is reworded by its sender only, and only its text changes.
  reset(admin, [
    { data: { sender_id: ADMIN }, error: null },
    { data: { id: ID, message: "Corrigé", sender: [] }, error: null },
  ]);
  const reworded = await bugMessages.PATCH(
    request("PATCH", { id: ID, message: " Corrigé " }),
  );
  assert.equal(reworded.status, 200);
  assert.deepEqual(
    state.calls.find(([method]) => method === "update"),
    ["update", { message: "Corrigé" }],
  );

  reset(admin, [{ data: { sender_id: ID }, error: null }]);
  assert.deepEqual(
    await answer(
      await bugMessages.PATCH(request("PATCH", { id: ID, message: "Corrigé" })),
    ),
    {
      status: 403,
      body: { error: "Vous n'êtes pas autorisé à modifier ce message" },
    },
  );
  assert.equal(
    state.calls.some(([method]) => method === "update"),
    false,
  );
}
{
  const rows = toRehearsalPayloads({
    name: "Répétition générale",
    group_type: "Tous",
    date: new Date(2026, 10, 3),
    place: "Salle des fêtes",
    address: "",
    room: "",
    start_time: "19:30",
    end_time: "21:30",
    repeat: true,
    repeat_interval: 1,
    repeat_until: new Date(2026, 10, 17),
  });
  reset(admin, [{ data: [], error: null }]);
  assert.equal((await rehearsals.POST(request("POST", rows))).status, 201);
  assert.deepEqual(state.calls.slice(0, 2), [
    ["from", "rehearsals"],
    ["insert", rows],
  ]);

  reset(admin, [{ data: {}, error: null }]);
  assert.equal((await rehearsals.POST(request("POST", rows[0]))).status, 201);
  assert.deepEqual(state.calls[1], ["insert", [rows[0]]]);

  reset(admin, [{ data: { id: ID }, error: null }]);
  await rehearsal.PATCH(request("PATCH", rows[0]), params(ID));
  assert.deepEqual(state.calls.slice(0, 3), [
    ["from", "rehearsals"],
    ["update", rows[0]],
    ["eq", "id", ID],
  ]);

  reset(admin);
  assert.deepEqual(
    await answer(
      await rehearsal.PATCH(request("PATCH", rows[0]), params("12")),
    ),
    { status: 404, body: { error: "Répétition introuvable" } },
  );
  assert.equal(state.clients, 0);
}
{
  const event = toEventPayload({
    title: "Week-end choral",
    date_from: new Date(2026, 10, 14),
    date_to: undefined,
    time: "09:30",
    location: "Centre de vacances",
    responsible_name: "Prénom NOM",
    responsible_email: "",
    event_type: "sejour",
    description: "",
    link: "",
    is_public: false,
  });
  reset(admin, [{ data: null, error: null }]);
  assert.equal((await events.POST(request("POST", event))).status, 200);
  assert.deepEqual(state.calls, [
    ["from", "events"],
    ["insert", [event]],
  ]);

  reset(admin, [{ data: null, error: null }]);
  await events.PATCH(request("PATCH", { id: ID, ...event }));
  assert.deepEqual(state.calls, [
    ["from", "events"],
    ["update", event],
    ["eq", "id", ID],
  ]);

  // A value the database refuses: a French 400, never its own message.
  reset(admin, [
    {
      data: null,
      error: { code: "22P02", message: 'invalid input syntax for type "x"' },
    },
  ]);
  assert.deepEqual(
    await quietly(async () =>
      answer(await events.POST(request("POST", event))),
    ),
    { status: 400, body: { error: "Valeurs refusées par la base de données" } },
  );
}

console.log(
  `admin API bodies (CODE-004): ${HANDLERS.length} handlers, all assertions passed`,
);
