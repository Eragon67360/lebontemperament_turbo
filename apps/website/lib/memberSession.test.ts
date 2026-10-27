// Run with: npx tsx lib/memberSession.test.ts
import type { Database } from "@repo/domain/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
import {
  isAccountUser,
  keepMemberSession,
  signInMember,
} from "./memberSession";

// Everyone here is fictional; nothing leaves the process.

const MEMBER = "11111111-1111-4111-8111-111111111111";
const STRANGER = "22222222-2222-4222-8222-222222222222";
const PASSWORD = "test".repeat(3);

/** A Supabase client with a `profiles` table holding `members`. */
function fakeSupabase({
  members = [MEMBER],
  readFails = false,
  signOutFails = false,
  accounts = {},
}: {
  members?: string[];
  readFails?: boolean;
  signOutFails?: boolean;
  /** e-mail → account id, for signInWithPassword */
  accounts?: Record<string, string>;
} = {}) {
  const calls = { profileReads: 0, signOuts: [] as unknown[] };
  const client = {
    auth: {
      async signInWithPassword({
        email,
        password,
      }: {
        email: string;
        password: string;
      }) {
        const id = accounts[email];
        if (!id || password !== PASSWORD) {
          return {
            data: { user: null, session: null },
            error: new Error("Invalid login credentials"),
          };
        }
        return {
          data: { user: { id, is_anonymous: false }, session: {} },
          error: null,
        };
      },
      async signOut(options: unknown) {
        calls.signOuts.push(options);
        if (signOutFails) throw new Error("network down");
        return { error: null };
      },
    },
    from(table: string) {
      assert.equal(table, "profiles");
      return {
        select: () => ({
          eq: (column: string, id: string) => ({
            async maybeSingle() {
              assert.equal(column, "id");
              calls.profileReads++;
              if (readFails) return { data: null, error: { message: "down" } };
              return {
                data: members.includes(id) ? { id } : null,
                error: null,
              };
            },
          }),
        }),
      };
    },
  };
  return { supabase: client as unknown as SupabaseClient<Database>, calls };
}

const quietly = async <T>(run: () => Promise<T>): Promise<T> => {
  const logged = console.error;
  console.error = () => {};
  try {
    return await run();
  } finally {
    console.error = logged;
  }
};

async function main() {
  // --- isAccountUser: what checkAuthorization accepts -------------------------

  assert.equal(isAccountUser(null), false, "no session");
  assert.equal(isAccountUser(undefined), false, "no session");
  assert.equal(isAccountUser({ is_anonymous: true }), false, "anonymous");
  assert.equal(isAccountUser({ is_anonymous: false }), true, "an account");
  assert.equal(isAccountUser({}), true, "tokens without the claim");

  // --- keepMemberSession: the OAuth callback and the password sign-in ---------

  // A member keeps the session.
  {
    const { supabase, calls } = fakeSupabase();
    assert.equal(
      await keepMemberSession(supabase, { id: MEMBER, is_anonymous: false }),
      true,
    );
    assert.deepEqual(calls.signOuts, []);
  }

  // An account without a profile row is signed out, this session only.
  {
    const { supabase, calls } = fakeSupabase();
    assert.equal(
      await keepMemberSession(supabase, { id: STRANGER, is_anonymous: false }),
      false,
    );
    assert.deepEqual(calls.signOuts, [{ scope: "local" }]);
  }

  // An anonymous sign-in is signed out without looking further.
  {
    const { supabase, calls } = fakeSupabase({ members: [MEMBER] });
    assert.equal(
      await keepMemberSession(supabase, { id: MEMBER, is_anonymous: true }),
      false,
    );
    assert.equal(calls.profileReads, 0);
    assert.deepEqual(calls.signOuts, [{ scope: "local" }]);
  }

  // The profile can't be read: no session is kept (the member signs in again).
  {
    const { supabase, calls } = fakeSupabase({ readFails: true });
    assert.equal(
      await keepMemberSession(supabase, { id: MEMBER, is_anonymous: false }),
      false,
    );
    assert.deepEqual(calls.signOuts, [{ scope: "local" }]);
  }

  // A failing sign-out is logged, never thrown at the visitor.
  {
    const { supabase, calls } = fakeSupabase({ signOutFails: true });
    assert.equal(
      await quietly(() =>
        keepMemberSession(supabase, { id: STRANGER, is_anonymous: false }),
      ),
      false,
    );
    assert.equal(calls.signOuts.length, 1);
  }

  // --- signInMember: the e-mail and password form -----------------------------

  const accounts = {
    "member@example.com": MEMBER,
    "stranger@example.com": STRANGER,
  };

  // Wrong password: refused by Supabase, nothing else happens.
  {
    const { supabase, calls } = fakeSupabase({ accounts });
    assert.deepEqual(
      await signInMember(supabase, {
        email: "member@example.com",
        password: "wrong",
      }),
      { error: "INVALID_CREDENTIALS" },
    );
    assert.equal(calls.profileReads, 0);
    assert.deepEqual(calls.signOuts, []);
  }

  // A member signs in.
  {
    const { supabase, calls } = fakeSupabase({ accounts });
    assert.deepEqual(
      await signInMember(supabase, {
        email: "member@example.com",
        password: PASSWORD,
      }),
      { success: true },
    );
    assert.deepEqual(calls.signOuts, []);
  }

  // An account without a profile: PROFILE_NOT_FOUND, and no session is left.
  {
    const { supabase, calls } = fakeSupabase({ accounts });
    assert.deepEqual(
      await signInMember(supabase, {
        email: "stranger@example.com",
        password: PASSWORD,
      }),
      { error: "PROFILE_NOT_FOUND" },
    );
    assert.deepEqual(calls.signOuts, [{ scope: "local" }]);
  }

  // The profile read fails: same answer, same sign-out.
  {
    const { supabase, calls } = fakeSupabase({ accounts, readFails: true });
    assert.deepEqual(
      await signInMember(supabase, {
        email: "member@example.com",
        password: PASSWORD,
      }),
      { error: "PROFILE_NOT_FOUND" },
    );
    assert.deepEqual(calls.signOuts, [{ scope: "local" }]);
  }

  console.log("memberSession: ok");
}

main();
