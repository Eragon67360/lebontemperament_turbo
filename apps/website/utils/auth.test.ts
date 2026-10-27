// Role matrix of the website's sign-in checks (utils/auth.ts): the members'
// API routes only ask for a signed-in account, whatever its role (row-level
// security decides what it then reads); the admin preview of /40-ans asks for
// an admin or superadmin. Supabase and the request headers are fakes; each
// row is one kind of caller and the whole table is compared at once.
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

type Caller = {
  /** The signed-in account; null when signed out. */
  user: { id: string } | null;
  /** Its `profiles` row; null when there is none. */
  profile: { role: unknown } | null;
};

const someone = { id: "11111111-1111-4111-8111-111111111111" };
const CALLERS = {
  anonymous: { user: null, profile: null },
  user: { user: someone, profile: { role: "user" } },
  admin: { user: someone, profile: { role: "admin" } },
  superadmin: { user: someone, profile: { role: "superadmin" } },
  "no role": { user: someone, profile: { role: null } },
  "unknown role": { user: someone, profile: { role: "owner" } },
  "no profile": { user: someone, profile: null },
} satisfies Record<string, Caller>;

// --- Fakes, swapped in for the real modules below ---

const VALID_TOKEN = "valid.access.token";

const state: {
  /** Who the session cookie belongs to. */
  cookie: Caller;
  /** Who the valid bearer token belongs to. */
  bearer: Caller;
  authorization: string | null;
  profileReads: number;
  bearerOptions: unknown;
} = {
  cookie: CALLERS.anonymous,
  bearer: CALLERS.anonymous,
  authorization: null,
  profileReads: 0,
  bearerOptions: undefined,
};

/** The few calls the checks make, answered for `caller`. */
function fakeSupabase(caller: () => Caller, acceptsToken: boolean) {
  return {
    auth: {
      getUser: async (token?: string) => {
        const user =
          token === undefined || (acceptsToken && token === VALID_TOKEN)
            ? caller().user
            : null;
        return {
          data: { user },
          error: user ? null : new Error("invalid session"),
        };
      },
    },
    from(table: string) {
      assert.equal(table, "profiles");
      state.profileReads += 1;
      const { user, profile } = caller();
      return {
        select(columns: string) {
          assert.equal(columns, "role");
          return {
            eq(column: string, id: unknown) {
              assert.equal(column, "id");
              assert.equal(id, user?.id);
              return {
                single: async () =>
                  profile
                    ? { data: profile, error: null }
                    : {
                        data: null,
                        error: { code: "PGRST116", message: "0 rows" },
                      },
              };
            },
          };
        },
      };
    },
  };
}

const cookieClient = fakeSupabase(() => state.cookie, false);
const bearerClient = fakeSupabase(() => state.bearer, true);

const fakes = {
  createClient: async () => cookieClient,
  createSupabaseClient: (_url: string, _key: string, options: unknown) => {
    state.bearerOptions = options;
    return bearerClient;
  },
  headers: async () =>
    new Headers(
      state.authorization ? { authorization: state.authorization } : {},
    ),
};
Object.assign(globalThis, { __roleMatrixFakes: fakes });

/** A module whose exports forward to `fakes` (`exported` → `fake`). */
const fakeModule = (exports: Record<string, keyof typeof fakes>) =>
  "data:text/javascript," +
  encodeURIComponent(
    Object.entries(exports)
      .map(
        ([exported, fake]) =>
          `export const ${exported} = (...args) => globalThis.__roleMatrixFakes.${fake}(...args);`,
      )
      .join("\n"),
  );

const AUTH = new URL("./auth.ts", import.meta.url).href;
const FAKE_FILES = new Map([
  [
    new URL("./supabase/server.ts", import.meta.url).href,
    fakeModule({ createClient: "createClient" }),
  ],
]);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/headers") {
      return { url: fakeModule({ headers: "headers" }), shortCircuit: true };
    }
    // The bearer client is built in utils/auth.ts itself.
    if (specifier === "@supabase/supabase-js" && context.parentURL === AUTH) {
      return {
        url: fakeModule({ createClient: "createSupabaseClient" }),
        shortCircuit: true,
      };
    }
    const resolved = nextResolve(specifier, context);
    const fakeFile = FAKE_FILES.get(resolved.url);
    return fakeFile ? { url: fakeFile, shortCircuit: true } : resolved;
  },
});

// --- The checks, loaded after the fakes are in place ---

const { checkAuthorization, checkAdminAuth } = await import("./auth");
const { GET: checkAdminRoute } =
  await import("../app/api/auth/check-admin/route");

type Check = Awaited<ReturnType<typeof checkAuthorization>>;
function signedIn(result: Check) {
  if (!result.authorized) return `${result.status} ${result.error}`;
  assert.equal(result.user, someone);
  if (result.supabase === (cookieClient as unknown)) return "200 cookie";
  if (result.supabase === (bearerClient as unknown)) return "200 bearer";
  return "200 unknown client";
}

const matrix: Record<string, Record<string, string>> = {};
for (const [who, caller] of Object.entries(CALLERS)) {
  // The browser: a session cookie, no Authorization header.
  state.cookie = caller;
  state.authorization = null;
  state.profileReads = 0;
  const cookie = signedIn(await checkAuthorization());
  assert.equal(state.profileReads, 0, "no role is read");

  // The mobile app: a bearer token (an invalid one when signed out).
  state.cookie = CALLERS.anonymous;
  state.bearer = caller;
  state.authorization = `Bearer ${caller.user ? VALID_TOKEN : "not-a-token"}`;
  const bearer = signedIn(await checkAuthorization());
  assert.equal(state.profileReads, 0, "no role is read");

  state.cookie = caller;
  state.authorization = null;
  const { isAdmin, user } = await checkAdminAuth();
  assert.equal(user, caller.user);
  const response = await checkAdminRoute();

  matrix[who] = {
    cookie,
    bearer,
    checkAdminAuth: isAdmin ? "admin" : "not admin",
    checkAdminRoute: `${response.status} ${JSON.stringify(await response.json())}`,
  };
}

const member = {
  cookie: "200 cookie",
  bearer: "200 bearer",
  checkAdminAuth: "not admin",
  checkAdminRoute: '200 {"isAdmin":false}',
};
const admin = {
  cookie: "200 cookie",
  bearer: "200 bearer",
  checkAdminAuth: "admin",
  checkAdminRoute: '200 {"isAdmin":true}',
};

assert.deepEqual(matrix, {
  anonymous: {
    cookie: "401 Non authentifié",
    bearer: "401 Non authentifié",
    checkAdminAuth: "not admin",
    checkAdminRoute: '200 {"isAdmin":false}',
  },
  user: member,
  admin,
  superadmin: admin,
  "no role": member,
  "unknown role": member,
  "no profile": member,
});

// A bearer token decides on its own: an invalid one is refused even with a
// valid session cookie, and the client it builds sends that token.
state.cookie = CALLERS.admin;
state.bearer = CALLERS.admin;
state.authorization = "Bearer not-a-token";
assert.equal(signedIn(await checkAuthorization()), "401 Non authentifié");
state.authorization = `Bearer ${VALID_TOKEN}`;
assert.equal(signedIn(await checkAuthorization()), "200 bearer");
assert.deepEqual(state.bearerOptions, {
  global: { headers: { Authorization: `Bearer ${VALID_TOKEN}` } },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
// Another scheme is not a bearer token: the cookie decides.
state.authorization = `Basic ${VALID_TOKEN}`;
assert.equal(signedIn(await checkAuthorization()), "200 cookie");

console.log("auth.test.ts: role matrix holds");
