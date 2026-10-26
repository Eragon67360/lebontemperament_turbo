// Run with: npx tsx --tsconfig tsconfig.test.json utils/users/memberProfile.test.ts
import type { createAdminClient } from "@/utils/supabase/admin";
import assert from "node:assert/strict";
import {
  createMemberAccount,
  ensureMemberProfile,
  type ProfileClient,
} from "./memberProfile";

// Everyone here is fictional; nothing leaves the process.

type AdminClient = ReturnType<typeof createAdminClient>;
type Row = { id: string; email: string; role: string; display_name: string };

/**
 * A service-role client over an in-memory `profiles` table. `trigger: true`
 * is the database before the SEC-006 migration, which added a `user` row
 * with every new account; `trigger: false` is the database after it.
 */
function fakeAdmin({
  trigger,
  fail = {},
  rows = [],
}: {
  trigger: boolean;
  fail?: { upsert?: boolean; update?: boolean; delete?: "error" | "throw" };
  rows?: Row[];
}) {
  const profiles = new Map(rows.map((row) => [row.id, { ...row }]));
  const accounts = new Map<string, string>();
  const calls = {
    createUser: [] as unknown[],
    upserts: [] as Array<{ row: Row; options: unknown }>,
    updates: [] as Array<{ patch: Partial<Row>; id: string }>,
    deletes: [] as string[],
  };
  let next = 1;
  const client = {
    auth: {
      admin: {
        async createUser(attributes: {
          email: string;
          user_metadata?: { display_name?: string };
        }) {
          calls.createUser.push(attributes);
          if ([...accounts.values()].includes(attributes.email)) {
            return {
              data: { user: null },
              error: new Error(
                "A user with this email address has already been registered",
              ),
            };
          }
          const id = `u-${next++}`;
          accounts.set(id, attributes.email);
          if (trigger) {
            profiles.set(id, {
              id,
              email: attributes.email,
              role: "user",
              display_name:
                attributes.user_metadata?.display_name ??
                attributes.email.split("@")[0]!,
            });
          }
          return {
            data: { user: { id, email: attributes.email } },
            error: null,
          };
        },
        async deleteUser(id: string) {
          calls.deletes.push(id);
          if (fail.delete === "throw") throw new Error("network down");
          if (fail.delete) return { data: null, error: new Error("down") };
          accounts.delete(id);
          profiles.delete(id); // on delete cascade
          return { data: null, error: null };
        },
      },
    },
    from(table: string) {
      assert.equal(table, "profiles");
      return {
        async upsert(
          row: Row,
          options: { onConflict?: string; ignoreDuplicates?: boolean },
        ) {
          calls.upserts.push({ row, options });
          if (fail.upsert) return { error: { message: "write refused" } };
          const existing = profiles.get(row.id);
          if (existing && options.ignoreDuplicates) return { error: null };
          profiles.set(row.id, { ...existing, ...row });
          return { error: null };
        },
        update(patch: Partial<Row>) {
          return {
            async eq(column: string, id: string) {
              assert.equal(column, "id");
              calls.updates.push({ patch, id });
              if (fail.update) return { error: { message: "write refused" } };
              const existing = profiles.get(id);
              if (existing) profiles.set(id, { ...existing, ...patch });
              return { error: null };
            },
          };
        },
      };
    },
  };
  return {
    client: client as unknown as AdminClient & ProfileClient,
    profiles,
    accounts,
    calls,
  };
}

const NEW = {
  email: "new.member@example.com",
  password: "test".repeat(3),
  displayName: "Prénom NOM",
};

async function main() {
  // --- ensureMemberProfile ------------------------------------------------------

  // A missing row is written with the given role and name.
  {
    const { client, profiles, calls } = fakeAdmin({ trigger: false });
    await ensureMemberProfile(client, {
      id: "u-9",
      email: "member@example.com",
      role: "user",
      displayName: "Prénom NOM",
    });
    assert.deepEqual(profiles.get("u-9"), {
      id: "u-9",
      email: "member@example.com",
      role: "user",
      display_name: "Prénom NOM",
    });
    assert.deepEqual(calls.upserts[0]?.options, {
      onConflict: "id",
      ignoreDuplicates: true,
    });
  }

  // An existing row is never changed: an admin stays an admin.
  {
    const admin: Row = {
      id: "u-9",
      email: "admin@example.com",
      role: "admin",
      display_name: "Admin NOM",
    };
    const { client, profiles } = fakeAdmin({ trigger: false, rows: [admin] });
    await ensureMemberProfile(client, {
      id: "u-9",
      email: "admin@example.com",
      role: "user",
      displayName: "Autre NOM",
    });
    assert.deepEqual(profiles.get("u-9"), admin);
  }

  // A refused write is an error, not a silent success.
  {
    const { client } = fakeAdmin({ trigger: false, fail: { upsert: true } });
    await assert.rejects(
      ensureMemberProfile(client, {
        id: "u-9",
        email: "member@example.com",
        role: "user",
        displayName: "Prénom NOM",
      }),
      /write refused/,
    );
  }

  // --- createMemberAccount: « Créer un compte » ----------------------------------

  // After the migration (no row from the database): the account and its
  // profile, with the role the admin chose.
  for (const role of ["user", "admin", "superadmin"] as const) {
    const { client, profiles, calls } = fakeAdmin({ trigger: false });
    const user = await createMemberAccount(client, { ...NEW, role });
    assert.deepEqual(calls.createUser, [
      {
        email: NEW.email,
        password: NEW.password,
        email_confirm: true,
        user_metadata: { display_name: NEW.displayName },
      },
    ]);
    assert.deepEqual(profiles.get(user.id), {
      id: user.id,
      email: NEW.email,
      role,
      display_name: NEW.displayName,
    });
    assert.equal(calls.upserts.length, 1, "the profile is written by the code");
    assert.deepEqual(calls.deletes, []);
  }

  // Before the migration (the database already added a `user` row): the
  // chosen role and name still win.
  {
    const { client, profiles } = fakeAdmin({ trigger: true });
    const user = await createMemberAccount(client, { ...NEW, role: "admin" });
    assert.deepEqual(profiles.get(user.id), {
      id: user.id,
      email: NEW.email,
      role: "admin",
      display_name: NEW.displayName,
    });
  }

  // The profile can't be written: the new account is deleted again, so none
  // is left without a profile and the admin can retry with the same e-mail.
  for (const fail of [{ upsert: true }, { update: true }]) {
    const { client, profiles, accounts, calls } = fakeAdmin({
      trigger: false,
      fail,
    });
    await assert.rejects(
      createMemberAccount(client, { ...NEW, role: "user" }),
      /write refused/,
    );
    assert.deepEqual(calls.deletes, ["u-1"]);
    assert.equal(accounts.size, 0);
    assert.equal(profiles.size, 0);
  }

  // Even when the clean-up fails, the caller hears about the profile failure.
  for (const failure of ["error", "throw"] as const) {
    const { client, calls } = fakeAdmin({
      trigger: false,
      fail: { upsert: true, delete: failure },
    });
    const logged = console.error;
    console.error = () => {};
    try {
      await assert.rejects(
        createMemberAccount(client, { ...NEW, role: "user" }),
        /write refused/,
      );
    } finally {
      console.error = logged;
    }
    assert.deepEqual(calls.deletes, ["u-1"]);
  }

  // Auth refuses the account (e-mail taken): no profile is touched.
  {
    const existing: Row = {
      id: "u-old",
      email: NEW.email,
      role: "admin",
      display_name: "Ancien NOM",
    };
    const { client, profiles, accounts, calls } = fakeAdmin({
      trigger: false,
      rows: [existing],
    });
    accounts.set("u-old", NEW.email);
    await assert.rejects(
      createMemberAccount(client, { ...NEW, role: "user" }),
      /already been registered/,
    );
    assert.equal(calls.upserts.length, 0);
    assert.equal(calls.updates.length, 0);
    assert.deepEqual(calls.deletes, []);
    assert.deepEqual(profiles.get("u-old"), existing);
  }

  console.log("memberProfile: all assertions passed");
}

main();
