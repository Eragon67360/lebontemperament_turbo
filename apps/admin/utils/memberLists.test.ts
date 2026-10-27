import {
  fetchRosterReview,
  retryRosterReview,
  RosterUnavailableError,
} from "@/hooks/useRosterSync";
import assert from "node:assert/strict";
import {
  GROUPS_PRODUCTION_ONLY_MESSAGE,
  memberListsAvailable,
  productionOnlyResponse,
  ROSTER_PRODUCTION_ONLY_MESSAGE,
} from "./memberLists";

// Only production reads the member roster and the Google Groups lists;
// staging, previews and local development refuse them, local development
// unless it opts in (SEC-007). `fetch` is mocked, nothing leaves the process.

// --- Which environments may read them: (VERCEL_ENV, opt-in) ---

assert.equal(memberListsAvailable("production", undefined), true);
assert.equal(memberListsAvailable("production", "1"), true);

// Staging and PR previews are Vercel "preview" deployments: never, whatever
// their variables. Unknown values are refused too.
for (const optIn of [undefined, "", "0", "true", "1"]) {
  for (const vercelEnv of ["preview", "staging", "Production", " production"]) {
    assert.equal(
      memberListsAvailable(vercelEnv, optIn),
      false,
      `${vercelEnv} with opt-in ${String(optIn)} is refused`,
    );
  }
}

// Local development (no VERCEL_ENV, or `development` from `vercel env pull`):
// only with the opt-in, and only "1".
for (const vercelEnv of [undefined, "", "development"]) {
  for (const optIn of [undefined, "", "0", "true", "yes"]) {
    assert.equal(
      memberListsAvailable(vercelEnv, optIn),
      false,
      `local (${String(vercelEnv)}) with opt-in ${String(optIn)} is refused`,
    );
  }
  assert.equal(memberListsAvailable(vercelEnv, "1"), true);
}

// The defaults read the environment at each call.
const saved = {
  vercelEnv: process.env.VERCEL_ENV,
  optIn: process.env.ALLOW_MEMBER_LISTS_IN_DEVELOPMENT,
};
function setEnv(vercelEnv: string | undefined, optIn: string | undefined) {
  if (vercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = vercelEnv;
  if (optIn === undefined) delete process.env.ALLOW_MEMBER_LISTS_IN_DEVELOPMENT;
  else process.env.ALLOW_MEMBER_LISTS_IN_DEVELOPMENT = optIn;
}
setEnv(undefined, undefined);
assert.equal(memberListsAvailable(), false, "unset: refused");
setEnv(undefined, "1");
assert.equal(memberListsAvailable(), true, "local with the opt-in");
setEnv("preview", "1");
assert.equal(memberListsAvailable(), false, "a preview ignores the opt-in");
setEnv("production", undefined);
assert.equal(memberListsAvailable(), true, "production");
setEnv(saved.vercelEnv, saved.optIn);

// --- The refusal the routes answer ---

for (const message of [
  ROSTER_PRODUCTION_ONLY_MESSAGE,
  GROUPS_PRODUCTION_ONLY_MESSAGE,
]) {
  assert.match(message, /^Disponible uniquement en production : /);
  const response = productionOnlyResponse(message);
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    error: message,
    productionOnly: true,
  });
}

// --- How the admin's pages read it (hooks/useRosterSync.ts) ---

const originalFetch = globalThis.fetch;
let requests = 0;
function answer(response: () => Response) {
  globalThis.fetch = (async () => {
    requests++;
    return response();
  }) as typeof fetch;
}

try {
  // Outside production: a RosterUnavailableError, never retried.
  answer(() => productionOnlyResponse(ROSTER_PRODUCTION_ONLY_MESSAGE));
  await assert.rejects(fetchRosterReview(), (error: unknown) => {
    assert.ok(error instanceof RosterUnavailableError);
    assert.equal(error.message, ROSTER_PRODUCTION_ONLY_MESSAGE);
    assert.equal(retryRosterReview(0, error), false);
    return true;
  });

  // Any other failure stays a plain error, retried once as before: the admin
  // check's 403, a source that is not configured, a body that is not JSON.
  for (const failed of [
    () => Response.json({ error: "Accès refusé" }, { status: 403 }),
    () => Response.json({ error: "Pas configurée." }, { status: 503 }),
    () => new Response("<html>", { status: 500 }),
  ]) {
    answer(failed);
    await assert.rejects(fetchRosterReview(), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.ok(!(error instanceof RosterUnavailableError));
      assert.equal(retryRosterReview(0, error), true);
      assert.equal(retryRosterReview(1, error), false);
      return true;
    });
  }

  const review = { fingerprint: "f", rowCount: 0 };
  answer(() => Response.json(review));
  assert.deepEqual(await fetchRosterReview(), review);
  assert.equal(requests, 5);
} finally {
  globalThis.fetch = originalFetch;
}

console.log("memberLists.test.ts: production only, refusals not retried");
