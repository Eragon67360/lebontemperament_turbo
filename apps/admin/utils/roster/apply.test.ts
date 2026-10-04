import type { RosterDiff, RosterReview } from "@repo/domain/roster/types";
import assert from "node:assert/strict";
import { sendInvitations, type InviteClient } from "../invitations";
import {
  applyRosterSync,
  invitationFailure,
  parseApplyRequest,
  ROSTER_CHANGED_MESSAGE,
  type ApplyDeps,
} from "./apply";
import type { BuiltReview } from "./review";

// Everyone here is fictional; nothing leaves the process.

const FINGERPRINT = "f".repeat(64);

const diff: RosterDiff = {
  nouveaux: [
    {
      rowId: "r4",
      email: "new@example.com",
      displayName: "Membre NOUVEAU",
      address: "",
      homePhone: "",
      voices: ["Ténor"],
    },
    {
      rowId: "r5",
      email: "taken@example.com",
      displayName: "Déjà INSCRIT",
      address: "",
      homePhone: "",
      voices: [],
    },
  ],
  modifies: [
    {
      rowId: "r1",
      profileId: "p-jean",
      email: "jean@example.com",
      displayName: "Jean DE LA FONTAINE",
      changes: [
        {
          field: "display_name",
          from: "DE LA FONTAINE Jean",
          to: "Jean DE LA FONTAINE",
        },
        { field: "voice", from: "Jeune", to: "Jeune & Soprane" },
      ],
    },
    {
      rowId: "r2",
      profileId: "p-marie",
      email: "marie@example.com",
      displayName: "Marie DUPONT",
      changes: [{ field: "address", from: "", to: "1 rue Test" }],
    },
  ],
  absents: [],
  aRegler: [],
  unchanged: 3,
};

const built = (
  fingerprint = FINGERPRINT,
  errors: RosterReview["validation"]["errors"] = [],
): BuiltReview => ({
  rows: [],
  diff,
  review: {
    fingerprint,
    rowCount: 7,
    validation: { errors, warnings: [] },
    groups: diff,
    unchanged: diff.unchanged,
  },
});

interface Calls {
  updates: Array<{ profileId: string; patch: Record<string, string> }>;
  invited: string[];
  loggedInvitations: string[];
  loggedUpdates: Array<{ profileId: string; fields: string[] }>;
}

const makeDeps = (
  review: BuiltReview,
  overrides: Partial<ApplyDeps> = {},
): { deps: ApplyDeps; calls: Calls } => {
  const calls: Calls = {
    updates: [],
    invited: [],
    loggedInvitations: [],
    loggedUpdates: [],
  };
  const deps: ApplyDeps = {
    buildReview: async () => review,
    updateProfile: async (profileId, patch) => {
      calls.updates.push({ profileId, patch: patch as Record<string, string> });
      return { ok: true };
    },
    sendInvitations: async (entries) => {
      calls.invited.push(...entries.map((e) => e.email));
      return entries.map(({ email }) =>
        email === "taken@example.com"
          ? {
              email,
              success: false,
              error:
                "A user with this email address has already been registered",
            }
          : { email, success: true, userId: `u-${email}` },
      );
    },
    logInvitation: async ({ email }) => {
      calls.loggedInvitations.push(email);
    },
    logUpdate: (entry) => {
      calls.loggedUpdates.push(entry);
    },
    ...overrides,
  };
  return { deps, calls };
};

// --- Request parsing -----------------------------------------------------------

assert.deepEqual(parseApplyRequest(null), {
  ok: false,
  error: "Requête invalide.",
});
assert.equal(
  parseApplyRequest({ invite: ["r1"] }).ok,
  false,
  "fingerprint required",
);
assert.equal(
  parseApplyRequest({ fingerprint: FINGERPRINT }).ok,
  false,
  "nothing to apply",
);
assert.equal(
  parseApplyRequest({ fingerprint: FINGERPRINT, invite: [1] }).ok,
  false,
  "row ids are strings",
);
assert.equal(
  parseApplyRequest({
    fingerprint: FINGERPRINT,
    update: [{ profileId: "p", fields: ["mobile_phone"] }],
  }).ok,
  false,
  "member-owned fields are refused",
);
assert.equal(
  parseApplyRequest({
    fingerprint: FINGERPRINT,
    update: [{ profileId: "p", fields: [] }],
  }).ok,
  false,
  "an update names at least one field",
);
{
  const parsed = parseApplyRequest({
    fingerprint: FINGERPRINT,
    invite: ["r4", "r4"],
    update: [
      { profileId: "p-jean", fields: ["voice", "voice", "display_name"] },
    ],
  });
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.request, {
    fingerprint: FINGERPRINT,
    invite: ["r4"],
    update: [{ profileId: "p-jean", fields: ["voice", "display_name"] }],
  });
}
{
  // Two entries for one profile: the first one wins.
  const parsed = parseApplyRequest({
    fingerprint: FINGERPRINT,
    update: [
      { profileId: "p-jean", fields: ["voice"] },
      { profileId: "p-jean", fields: ["address"] },
    ],
  });
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.request.update, [
    { profileId: "p-jean", fields: ["voice"] },
  ]);
}
{
  // Invitations are capped at 100 per apply, with a French message.
  const tooMany = parseApplyRequest({
    fingerprint: FINGERPRINT,
    invite: Array.from({ length: 101 }, (_, i) => `r${i}`),
  });
  assert.deepEqual(tooMany, {
    ok: false,
    error: "Au plus 100 invitations par envoi : appliquez, puis recommencez.",
  });
  assert.ok(
    parseApplyRequest({
      fingerprint: FINGERPRINT,
      invite: Array.from({ length: 100 }, (_, i) => `r${i}`),
    }).ok,
    "100 is accepted",
  );
  // Updates are capped at 500.
  const update = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      profileId: `p${i}`,
      fields: ["voice"],
    }));
  assert.ok(
    parseApplyRequest({ fingerprint: FINGERPRINT, update: update(500) }).ok,
  );
  assert.deepEqual(
    parseApplyRequest({ fingerprint: FINGERPRINT, update: update(501) }),
    { ok: false, error: "Au plus 500 mises à jour par application." },
  );
}

// --- Fingerprint check -----------------------------------------------------------

{
  const { deps, calls } = makeDeps(built("0".repeat(64)));
  const outcome = await applyRosterSync(
    { fingerprint: FINGERPRINT, invite: ["r4"], update: [] },
    deps,
  );
  assert.equal(outcome.status, 409);
  assert.deepEqual(outcome.body, { error: ROSTER_CHANGED_MESSAGE });
  assert.deepEqual(
    calls.invited,
    [],
    "nothing is sent when the roster changed",
  );
  assert.deepEqual(calls.updates, []);
}
{
  // A roster that no longer validates is refused too, with its reason.
  const { deps } = makeDeps(
    built(FINGERPRINT, [
      { code: "too_few_rows", message: "Trop peu de lignes." },
    ]),
  );
  const outcome = await applyRosterSync(
    { fingerprint: FINGERPRINT, invite: ["r4"], update: [] },
    deps,
  );
  assert.equal(outcome.status, 409);
  assert.deepEqual(outcome.body, { error: "Trop peu de lignes." });
}

// --- Per-item results --------------------------------------------------------------

{
  const { deps, calls } = makeDeps(built());
  const outcome = await applyRosterSync(
    {
      fingerprint: FINGERPRINT,
      invite: ["r4", "r5", "r9"],
      update: [
        { profileId: "p-jean", fields: ["voice"] }, // one of two changes
        { profileId: "p-marie", fields: ["voice"] }, // not a pending change
        { profileId: "p-ghost", fields: ["address"] }, // not in the diff
      ],
    },
    deps,
  );
  assert.equal(outcome.status, 200);
  if (outcome.status !== 200) throw new Error("unreachable");

  // Values come from the server's diff, never from the client.
  assert.deepEqual(calls.updates, [
    { profileId: "p-jean", patch: { voice: "Jeune & Soprane" } },
  ]);
  assert.deepEqual(calls.loggedUpdates, [
    { profileId: "p-jean", fields: ["voice"] },
  ]);
  assert.deepEqual(calls.invited, ["new@example.com", "taken@example.com"]);
  assert.deepEqual(calls.loggedInvitations, ["new@example.com"]);

  const byId = Object.fromEntries(outcome.body.results.map((r) => [r.id, r]));
  assert.deepEqual(byId["p-jean"], {
    kind: "update",
    id: "p-jean",
    label: "Jean DE LA FONTAINE (jean@example.com)",
    status: "done",
    fields: ["voice"],
  });
  assert.equal(byId["p-marie"]?.status, "failed");
  assert.match(byId["p-marie"]?.reason ?? "", /ne diffèrent plus/);
  assert.equal(byId["p-ghost"]?.status, "failed");
  assert.match(
    byId["p-ghost"]?.reason ?? "",
    /plus de modification en attente/,
  );
  assert.deepEqual(byId["r4"], {
    kind: "invite",
    id: "r4",
    label: "Membre NOUVEAU (new@example.com)",
    status: "done",
  });
  assert.equal(byId["r5"]?.status, "failed");
  assert.equal(byId["r5"]?.reason, "Un compte existe déjà avec cet email.");
  assert.equal(byId["r9"]?.status, "failed");
  assert.match(byId["r9"]?.reason ?? "", /plus un nouveau membre/);

  assert.deepEqual(outcome.body.summary, {
    done: 2,
    failed: 4,
    invited: 1,
    updated: 1,
  });
}
{
  // A database refusal is reported on that item and the others go on.
  const { deps, calls } = makeDeps(built(), {
    updateProfile: async (profileId) =>
      profileId === "p-jean"
        ? { ok: false, reason: "La base de données a refusé la mise à jour." }
        : { ok: true },
  });
  const outcome = await applyRosterSync(
    {
      fingerprint: FINGERPRINT,
      invite: [],
      update: [
        { profileId: "p-jean", fields: ["display_name", "voice"] },
        { profileId: "p-marie", fields: ["address"] },
      ],
    },
    deps,
  );
  assert.equal(outcome.status, 200);
  if (outcome.status !== 200) throw new Error("unreachable");
  assert.deepEqual(
    outcome.body.results.map((r) => [r.id, r.status]),
    [
      ["p-jean", "failed"],
      ["p-marie", "done"],
    ],
  );
  assert.deepEqual(calls.loggedUpdates, [
    { profileId: "p-marie", fields: ["address"] },
  ]);
  assert.deepEqual(calls.invited, [], "no invitation requested, none sent");
}

{
  // A warning from the writer (auth metadata not updated) is reported on a done item.
  const { deps } = makeDeps(built(), {
    updateProfile: async () => ({
      ok: true,
      warning:
        "Fiche mise à jour, mais le nom affiché à la connexion n'a pas pu l'être.",
    }),
  });
  const outcome = await applyRosterSync(
    {
      fingerprint: FINGERPRINT,
      invite: [],
      update: [{ profileId: "p-jean", fields: ["display_name"] }],
    },
    deps,
  );
  assert.equal(outcome.status, 200);
  if (outcome.status !== 200) throw new Error("unreachable");
  assert.equal(outcome.body.results[0]?.status, "done");
  assert.match(
    outcome.body.results[0]?.warning ?? "",
    /nom affiché à la connexion/,
  );
  assert.deepEqual(outcome.body.summary, {
    done: 1,
    failed: 0,
    invited: 0,
    updated: 1,
  });
}

assert.equal(
  invitationFailure("Rate limit exceeded"),
  "Limite d'envoi atteinte : réessayez dans quelques minutes.",
);
assert.equal(
  invitationFailure(undefined),
  "L'invitation n'a pas pu être envoyée.",
);

// --- The shared sender: batches, pauses, per-entry results ---------------------

{
  const sentTo: string[] = [];
  const pauses: number[] = [];
  const client: InviteClient = {
    auth: {
      admin: {
        inviteUserByEmail: async (email, options) => {
          sentTo.push(email);
          assert.equal(
            options.redirectTo,
            "https://example.com/create-profile",
          );
          assert.equal(options.data?.invited_by, "admin@example.com");
          if (email === "fail@example.com") {
            return { data: { user: null }, error: { message: "boom" } };
          }
          return { data: { user: { id: `u-${email}` } }, error: null };
        },
      },
    },
  };
  const results = await sendInvitations(
    client,
    [
      { email: "a@example.com", displayName: "A" },
      { email: "fail@example.com", displayName: "F" },
      { email: "c@example.com", displayName: "C" },
    ],
    {
      invitedBy: "admin@example.com",
      redirectTo: "https://example.com/create-profile",
      batchSize: 2,
      delayMs: 250,
      sleep: async (ms) => {
        pauses.push(ms);
      },
    },
  );
  assert.deepEqual(sentTo, [
    "a@example.com",
    "fail@example.com",
    "c@example.com",
  ]);
  assert.deepEqual(pauses, [250], "one pause between two batches");
  assert.deepEqual(
    results.map((r) => [r.email, r.success, r.userId ?? r.error]),
    [
      ["a@example.com", true, "u-a@example.com"],
      ["fail@example.com", false, "boom"],
      ["c@example.com", true, "u-c@example.com"],
    ],
  );
  assert.deepEqual(results[2]?.progress, {
    current: 3,
    total: 3,
    percentage: 100,
  });
}

console.log("roster apply tests passed");
