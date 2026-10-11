import type { UserRole } from "@/utils/access";
import type { AbsentMember, RosterDiff } from "@repo/domain/roster/types";
import assert from "node:assert/strict";
import { ROSTER_CHANGED_MESSAGE } from "./apply";
import {
  MAX_BULK_DELETIONS,
  deleteAbsentMembers,
  parseBulkDeleteRequest,
  type BulkDeleteDeps,
} from "./bulkDelete";
import type { BuiltReview } from "./review";

// Everyone here is fictional; nothing leaves the process.

const FINGERPRINT = "f".repeat(64);

const absent = (
  id: string,
  displayName: string,
  role = "user",
): AbsentMember => ({
  profileId: id,
  email: `${id}@example.com`,
  displayName,
  role,
  status: "approuvé",
});

const diff: RosterDiff = {
  nouveaux: [],
  modifies: [],
  absents: [
    absent("p-anna", "Anna ANCIENNE"),
    absent("p-boris", "Boris BOUDÉ"),
    absent("p-admin", "Cécile ADMIN", "admin"),
    absent("p-me", "Moi MÊME", "superadmin"),
  ],
  aRegler: [],
  unchanged: 5,
};

const built = (
  fingerprint = FINGERPRINT,
  errors: BuiltReview["review"]["validation"]["errors"] = [],
): BuiltReview => ({
  rows: [],
  diff,
  review: {
    fingerprint,
    rowCount: 9,
    validation: { errors, warnings: [] },
    groups: diff,
    unchanged: diff.unchanged,
  },
});

function setup(
  options: {
    role?: UserRole;
    review?: BuiltReview;
    failing?: string[];
  } = {},
) {
  const deleted: string[] = [];
  const logged: string[] = [];
  const deps: BulkDeleteDeps = {
    actor: { id: "p-me", role: options.role ?? "superadmin" },
    buildReview: async () => options.review ?? built(),
    deleteAccount: async (id) => {
      if (options.failing?.includes(id)) throw new Error("boom");
      deleted.push(id);
    },
    logDeletion: ({ profileId }) => logged.push(profileId),
  };
  return { deps, deleted, logged };
}

const request = (ids: string[], fingerprint = FINGERPRINT) => ({
  fingerprint,
  ids,
});

async function main() {
  // --- parseBulkDeleteRequest ---
  assert.deepEqual(
    parseBulkDeleteRequest({ fingerprint: "x", ids: ["a", "a", "b"] }),
    {
      ok: true,
      request: { fingerprint: "x", ids: ["a", "b"] },
    },
  );
  for (const body of [
    null,
    "x",
    { ids: ["a"] },
    { fingerprint: "", ids: ["a"] },
    { fingerprint: "x" },
    { fingerprint: "x", ids: [] },
    { fingerprint: "x", ids: ["a", ""] },
    { fingerprint: "x", ids: ["a", 3] },
    {
      fingerprint: "x",
      ids: Array.from({ length: MAX_BULK_DELETIONS + 1 }, (_, i) => `p${i}`),
    },
  ]) {
    assert.equal(parseBulkDeleteRequest(body).ok, false, JSON.stringify(body));
  }

  // --- a superadmin deletes absent accounts, one result each ---
  {
    const { deps, deleted, logged } = setup();
    const outcome = await deleteAbsentMembers(
      request(["p-anna", "p-admin"]),
      deps,
    );
    assert.equal(outcome.status, 200);
    assert.deepEqual(deleted, ["p-anna", "p-admin"]);
    assert.deepEqual(logged, ["p-anna", "p-admin"]);
    if (outcome.status === 200) {
      assert.deepEqual(outcome.body.summary, { done: 2, failed: 0 });
      assert.equal(
        outcome.body.results[0]?.label,
        "Anna ANCIENNE (p-anna@example.com)",
      );
    }
  }

  // --- an admin who is not a superadmin deletes nothing, and the roster is not even read ---
  {
    let read = false;
    const { deps, deleted } = setup({ role: "admin" });
    deps.buildReview = async () => {
      read = true;
      return built();
    };
    const outcome = await deleteAbsentMembers(request(["p-anna"]), deps);
    assert.equal(outcome.status, 403);
    assert.deepEqual(deleted, []);
    assert.equal(read, false);
  }

  // --- the actor's own account is refused, the others go on ---
  {
    const { deps, deleted } = setup();
    const outcome = await deleteAbsentMembers(
      request(["p-me", "p-boris"]),
      deps,
    );
    assert.deepEqual(deleted, ["p-boris"]);
    if (outcome.status === 200) {
      assert.deepEqual(outcome.body.summary, { done: 1, failed: 1 });
      assert.equal(outcome.body.results[0]?.status, "failed");
      assert.match(outcome.body.results[0]?.reason ?? "", /propre compte/);
    }
  }

  // --- an account that is in the roster (not absent) or unknown is never deleted ---
  {
    const { deps, deleted } = setup();
    const outcome = await deleteAbsentMembers(
      request(["p-listed", "p-anna"]),
      deps,
    );
    assert.deepEqual(deleted, ["p-anna"]);
    if (outcome.status === 200) {
      assert.equal(outcome.body.results[0]?.id, "p-listed");
      assert.equal(outcome.body.results[0]?.status, "failed");
    }
  }

  // --- one failure does not stop the others, and is reported ---
  {
    const { deps, deleted, logged } = setup({ failing: ["p-anna"] });
    const outcome = await deleteAbsentMembers(
      request(["p-anna", "p-boris"]),
      deps,
    );
    assert.deepEqual(deleted, ["p-boris"]);
    assert.deepEqual(logged, ["p-boris"]);
    if (outcome.status === 200) {
      assert.deepEqual(outcome.body.summary, { done: 1, failed: 1 });
      assert.match(outcome.body.results[0]?.reason ?? "", /conservé/);
    }
  }

  // --- the roster changed since the review: nothing is deleted ---
  {
    const { deps, deleted } = setup({ review: built("0".repeat(64)) });
    const outcome = await deleteAbsentMembers(request(["p-anna"]), deps);
    assert.equal(outcome.status, 409);
    assert.deepEqual(outcome.body, { error: ROSTER_CHANGED_MESSAGE });
    assert.deepEqual(deleted, []);
  }

  // --- a roster that fails validation: nothing is deleted ---
  {
    const { deps, deleted } = setup({
      review: built(FINGERPRINT, [
        { code: "empty", message: "Le tableau est vide." },
      ]),
    });
    const outcome = await deleteAbsentMembers(request(["p-anna"]), deps);
    assert.equal(outcome.status, 409);
    assert.deepEqual(outcome.body, { error: "Le tableau est vide." });
    assert.deepEqual(deleted, []);
  }

  console.log("bulkDelete: ok");
}

void main();
