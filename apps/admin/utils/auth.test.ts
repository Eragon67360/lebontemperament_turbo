// Role matrix of everything that lets someone into the admin: the two checks
// of utils/auth.ts, what is built on them (the dashboard shell, the
// superadmin-only pages, the /api/orders routes) and the sign-in action.
// Supabase, the redirects and the cache are fakes; each row is one kind of
// caller, each column one check, and the whole table is compared at once.
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import type { ReactNode } from "react";

type Caller = {
  /** The signed-in account; null when signed out or the password is wrong. */
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

class Redirect extends Error {
  constructor(readonly url: string) {
    super(`redirect to ${url}`);
  }
}

const state: { caller: Caller; signedOut: boolean; revalidated: boolean } = {
  caller: CALLERS.anonymous,
  signedOut: false,
  revalidated: false,
};

/** The few calls the checks make, answered for `state.caller`. */
function fakeSupabase() {
  const { user, profile } = state.caller;
  return {
    auth: {
      getUser: async () => ({
        data: { user },
        error: user ? null : new Error("Auth session missing!"),
      }),
      signInWithPassword: async () =>
        user
          ? { data: { user, session: {} }, error: null }
          : {
              data: { user: null, session: null },
              error: new Error("Invalid login credentials"),
            },
      signOut: async () => {
        state.signedOut = true;
        return { error: null };
      },
    },
    from(table: string) {
      assert.equal(table, "profiles");
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

const fakes = {
  createClient: async () => fakeSupabase(),
  revalidatePath: () => {
    state.revalidated = true;
  },
  redirect: (url: string): never => {
    throw new Redirect(url);
  },
};
Object.assign(globalThis, { __roleMatrixFakes: fakes });

/** A module whose exports forward to `fakes`. */
const fakeModule = (names: (keyof typeof fakes)[]) =>
  "data:text/javascript," +
  encodeURIComponent(
    names
      .map(
        (name) =>
          `export const ${name} = (...args) => globalThis.__roleMatrixFakes.${name}(...args);`,
      )
      .join("\n"),
  );

const FAKE_FILES = new Map([
  [
    new URL("./supabase/server.ts", import.meta.url).href,
    fakeModule(["createClient"]),
  ],
]);
const FAKE_PACKAGES = new Map([
  ["next/cache", fakeModule(["revalidatePath"])],
  ["next/navigation", fakeModule(["redirect"])],
]);

registerHooks({
  resolve(specifier, context, nextResolve) {
    const fakePackage = FAKE_PACKAGES.get(specifier);
    if (fakePackage) return { url: fakePackage, shortCircuit: true };
    const resolved = nextResolve(specifier, context);
    const fakeFile = FAKE_FILES.get(resolved.url);
    return fakeFile ? { url: fakeFile, shortCircuit: true } : resolved;
  },
});

// --- The checks, loaded after the fakes are in place ---

const { checkAuthorization, checkSuperadminAuthorization } =
  await import("./auth");
const { requireSuperadmin } = await import("./orders/server");
const { default: ProtectedLayout } =
  await import("../components/layouts/ProtectedLayout");
const { default: BugReportsLayout } =
  await import("../app/dashboard/admin/bug-reports/layout");
const { default: OrdersLayout } =
  await import("../app/dashboard/admin/commandes/layout");
const { login } = await import("../app/auth/login/actions");

type Check = Awaited<ReturnType<typeof checkAuthorization>>;
const check = (result: Check) =>
  result.authorized ? `200 ${result.role}` : `${result.status} ${result.error}`;

async function page(
  layout: (props: { children: ReactNode }) => Promise<ReactNode>,
) {
  try {
    await layout({ children: "page" });
    return "renders";
  } catch (error) {
    if (error instanceof Redirect) return `→ ${error.url}`;
    throw error;
  }
}

async function ordersRoute() {
  const result = await requireSuperadmin();
  if (result.ok) return "200";
  const body = (await result.response.json()) as { error: string };
  return `${result.response.status} ${body.error}`;
}

async function signIn() {
  const form = new FormData();
  form.set("email", "admin@example.com");
  form.set("password", "test".repeat(3));
  try {
    await login(form);
    return "no redirect";
  } catch (error) {
    if (!(error instanceof Redirect)) throw error;
    const notes = [
      state.signedOut && "signed out",
      state.revalidated && "revalidated",
    ].filter(Boolean);
    return `→ ${error.url}${notes.length ? ` (${notes.join(", ")})` : ""}`;
  }
}

const matrix: Record<string, Record<string, string>> = {};
for (const [who, caller] of Object.entries(CALLERS)) {
  state.caller = caller;
  matrix[who] = {
    admin: check(await checkAuthorization()),
    superadmin: check(await checkSuperadminAuthorization()),
    dashboard: await page(ProtectedLayout),
    bugReports: await page(BugReportsLayout),
    commandes: await page(OrdersLayout),
    ordersApi: await ordersRoute(),
  };
  state.signedOut = false;
  state.revalidated = false;
  matrix[who].signIn = await signIn();
}

const SUPERADMIN_ONLY = "403 Non autorisé - Rôle superadmin requis";
const refused = {
  admin: "403 Non autorisé",
  superadmin: SUPERADMIN_ONLY,
  dashboard: "→ /unauthorized",
  bugReports: "→ /unauthorized",
  commandes: "→ /unauthorized",
  ordersApi: SUPERADMIN_ONLY,
};

assert.deepEqual(matrix, {
  anonymous: {
    admin: "401 Non authentifié",
    superadmin: "401 Non authentifié",
    dashboard: "→ /auth/login",
    bugReports: "→ /auth/login",
    commandes: "→ /auth/login",
    ordersApi: "401 Non authentifié",
    signIn: "→ /auth/login?error=INVALID_CREDENTIALS",
  },
  user: {
    ...refused,
    signIn: "→ /auth/login?error=UNAUTHORIZED (signed out)",
  },
  admin: {
    admin: "200 admin",
    superadmin: SUPERADMIN_ONLY,
    dashboard: "renders",
    bugReports: "→ /unauthorized",
    commandes: "→ /unauthorized",
    ordersApi: SUPERADMIN_ONLY,
    signIn: "→ /dashboard (revalidated)",
  },
  superadmin: {
    admin: "200 superadmin",
    superadmin: "200 superadmin",
    dashboard: "renders",
    bugReports: "renders",
    commandes: "renders",
    ordersApi: "200",
    signIn: "→ /dashboard (revalidated)",
  },
  "no role": {
    ...refused,
    signIn: "→ /auth/login?error=UNAUTHORIZED (signed out)",
  },
  "unknown role": {
    ...refused,
    signIn: "→ /auth/login?error=UNAUTHORIZED (signed out)",
  },
  // The sign-in stops at the missing profile, before the role check.
  "no profile": {
    ...refused,
    signIn: "→ /auth/login?error=PROFILE_NOT_FOUND",
  },
});

// A granted check hands back the caller's own account.
state.caller = CALLERS.superadmin;
for (const result of [
  await checkAuthorization(),
  await checkSuperadminAuthorization(),
]) {
  assert.ok(result.authorized);
  assert.equal(result.user, someone);
}

console.log("auth.test.ts: role matrix holds");
