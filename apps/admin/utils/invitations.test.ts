import assert from "node:assert/strict";
import {
  type InviteClient,
  PROFILE_NOT_CREATED,
  sendInvitations,
} from "./invitations";

// Everyone here is fictional; nothing leaves the process.

type Row = { id: string; email: string; role: string; display_name: string };

/**
 * A service-role client over an in-memory `profiles` table. `trigger: true`
 * is the database before the SEC-006 migration, which added a `user` row
 * with every new account; `trigger: false` is the database after it.
 */
function fakeClient({
  trigger = false,
  rows = [],
  failUpsert = false,
  noUserFor = "",
}: {
  trigger?: boolean;
  rows?: Row[];
  failUpsert?: boolean;
  noUserFor?: string;
} = {}) {
  const profiles = new Map(rows.map((row) => [row.id, { ...row }]));
  const sent: { email: string; name: unknown }[] = [];
  const upserts: Array<{ row: Row; options: unknown }> = [];
  const client: InviteClient = {
    auth: {
      admin: {
        async inviteUserByEmail(email, options) {
          sent.push({ email, name: options.data?.display_name });
          if (email.startsWith("refused")) {
            return { data: { user: null }, error: { message: "boom" } };
          }
          if (email === noUserFor) {
            return { data: { user: null }, error: null };
          }
          const id = `id-${email}`;
          if (trigger && !profiles.has(id)) {
            profiles.set(id, {
              id,
              email,
              role: "user",
              display_name: String(options.data?.display_name ?? ""),
            });
          }
          return { data: { user: { id, email } }, error: null };
        },
      },
    },
    from(table) {
      assert.equal(table, "profiles");
      return {
        async upsert(row, options) {
          upserts.push({ row, options });
          if (failUpsert) return { error: { message: "write refused" } };
          if (!(profiles.has(row.id) && options.ignoreDuplicates)) {
            profiles.set(row.id, { ...row });
          }
          return { error: null };
        },
      };
    },
  };
  return { client, profiles, sent, upserts };
}

const OPTIONS = {
  invitedBy: "admin@example.com",
  redirectTo: "https://example.com",
  sleep: async () => {},
};

// Every invitation stores the name as « Prénom NOM », however it was typed or
// imported (the CSV's « NOM Prénom » column included).
{
  const { client, sent } = fakeClient();
  const results = await sendInvitations(
    client,
    [
      { email: "a@example.com", displayName: "BERNARD Lucie" },
      { email: "b@example.com", displayName: "DE LA FONTAINE Jean  Marie" },
      { email: "c@example.com", displayName: "Paul MARTIN" },
      { email: "d@example.com", displayName: "Claire Dubois" },
    ],
    OPTIONS,
  );

  assert.deepEqual(
    sent.map((s) => s.name),
    [
      "Lucie BERNARD",
      "Jean Marie DE LA FONTAINE",
      "Paul MARTIN",
      "Claire Dubois",
    ],
  );
  assert.deepEqual(
    results.map((r) => r.displayName),
    [
      "Lucie BERNARD",
      "Jean Marie DE LA FONTAINE",
      "Paul MARTIN",
      "Claire Dubois",
    ],
  );
}

// Each invited account gets its member profile, as `user`, from this code:
// the database no longer adds it.
{
  const { client, profiles, upserts } = fakeClient();
  const results = await sendInvitations(
    client,
    [
      { email: "a@example.com", displayName: "BERNARD Lucie" },
      { email: "refused@example.com", displayName: "Refus NOM" },
    ],
    OPTIONS,
  );
  assert.deepEqual(
    results.map((r) => [r.email, r.success, r.userId ?? r.error]),
    [
      ["a@example.com", true, "id-a@example.com"],
      ["refused@example.com", false, "boom"],
    ],
  );
  assert.deepEqual(Object.fromEntries(profiles), {
    "id-a@example.com": {
      id: "id-a@example.com",
      email: "a@example.com",
      role: "user",
      display_name: "Lucie BERNARD",
    },
  });
  assert.deepEqual(
    upserts.map((u) => u.options),
    [{ onConflict: "id", ignoreDuplicates: true }],
    "one write, only for the invitation that went out, never overwriting",
  );
}

// Before the migration the database already added the row: same result.
{
  const { client, profiles } = fakeClient({ trigger: true });
  const [result] = await sendInvitations(
    client,
    [{ email: "a@example.com", displayName: "BERNARD Lucie" }],
    OPTIONS,
  );
  assert.equal(result?.success, true);
  assert.deepEqual(profiles.get("id-a@example.com"), {
    id: "id-a@example.com",
    email: "a@example.com",
    role: "user",
    display_name: "Lucie BERNARD",
  });
}

// Inviting someone again never changes the profile they have (an admin
// stays an admin, their name stays theirs).
{
  const admin: Row = {
    id: "id-a@example.com",
    email: "a@example.com",
    role: "admin",
    display_name: "Lucie BERNARD-MARTIN",
  };
  const { client, profiles } = fakeClient({ rows: [admin] });
  const [result] = await sendInvitations(
    client,
    [{ email: "a@example.com", displayName: "BERNARD Lucie" }],
    OPTIONS,
  );
  assert.equal(result?.success, true);
  assert.deepEqual(profiles.get("id-a@example.com"), admin);
}

// The e-mail went out but the profile could not be written: a failure the
// admin can act on (sending the invitation again writes the profile).
{
  const { client, profiles } = fakeClient({ failUpsert: true });
  const logged = console.error;
  console.error = () => {};
  try {
    const [result] = await sendInvitations(
      client,
      [{ email: "a@example.com", displayName: "BERNARD Lucie" }],
      OPTIONS,
    );
    assert.equal(result?.success, false);
    assert.equal(result?.error, PROFILE_NOT_CREATED);
    assert.equal(result?.userId, "id-a@example.com");
    assert.equal(profiles.size, 0);
  } finally {
    console.error = logged;
  }
}

// No account in Supabase's answer: no profile can be written, so it is a failure.
{
  const { client, upserts } = fakeClient({ noUserFor: "a@example.com" });
  const logged = console.error;
  console.error = () => {};
  try {
    const [result] = await sendInvitations(
      client,
      [{ email: "a@example.com", displayName: "BERNARD Lucie" }],
      OPTIONS,
    );
    assert.equal(result?.success, false);
    assert.equal(result?.error, PROFILE_NOT_CREATED);
    assert.equal(upserts.length, 0);
  } finally {
    console.error = logged;
  }
}

console.log(
  "invitations: names stored as « Prénom NOM », one profile per invited account",
);
