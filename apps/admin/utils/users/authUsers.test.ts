// Run with: npx tsx utils/users/authUsers.test.ts
import type { createAdminClient } from "@/utils/supabase/admin";
import type { User } from "@supabase/supabase-js";
import assert from "node:assert/strict";
import {
  inviteStatusOf,
  listAuthSummaries,
  summaryOf,
  type AuthSummary,
} from "./authUsers";

type AdminClient = ReturnType<typeof createAdminClient>;

const summary: AuthSummary = {
  id: "u1",
  invited_at: null,
  confirmed_at: null,
  email_confirmed_at: "2026-01-01T00:00:00Z",
  last_sign_in_at: null,
  avatar_url: "https://example.com/a.png",
};

const authUser = {
  id: "u2",
  invited_at: "2026-02-01T00:00:00Z",
  confirmed_at: undefined,
  email_confirmed_at: undefined,
  last_sign_in_at: "2026-03-01T00:00:00Z",
  user_metadata: { avatar_url: "https://example.com/b.png" },
} as unknown as User;

function fakeClient(
  rpcResult: { data: AuthSummary[] | null; error: { code?: string } | null },
  users: User[] = [],
) {
  const calls = { rpc: 0, listUsers: 0 };
  const client = {
    rpc: async () => {
      calls.rpc++;
      return rpcResult;
    },
    auth: {
      admin: {
        listUsers: async () => {
          calls.listUsers++;
          return {
            data: { users: calls.listUsers === 1 ? users : [] },
            error: null,
          };
        },
      },
    },
  } as unknown as AdminClient;
  return { client, calls };
}

async function main() {
  // The function exists: one call, no Auth API paging.
  {
    const { client, calls } = fakeClient({ data: [summary], error: null });
    assert.deepEqual(await listAuthSummaries(client), [summary]);
    assert.equal(calls.listUsers, 0);
  }
  // Migration not applied yet: fall back to the Auth admin API.
  for (const code of ["PGRST202", "42883"]) {
    const { client, calls } = fakeClient({ data: null, error: { code } }, [
      authUser,
    ]);
    assert.deepEqual(await listAuthSummaries(client), [summaryOf(authUser)]);
    assert.equal(calls.rpc, 1);
    assert.equal(calls.listUsers, 1);
  }
  // Any other error is a real failure, not a reason to fall back.
  {
    const { client, calls } = fakeClient({
      data: null,
      error: { code: "42501" },
    });
    await assert.rejects(() => listAuthSummaries(client));
    assert.equal(calls.listUsers, 0);
  }

  assert.deepEqual(summaryOf(authUser), {
    id: "u2",
    invited_at: "2026-02-01T00:00:00Z",
    confirmed_at: null,
    email_confirmed_at: null,
    last_sign_in_at: "2026-03-01T00:00:00Z",
    avatar_url: "https://example.com/b.png",
  });

  assert.equal(inviteStatusOf(undefined), "en attente");
  assert.equal(inviteStatusOf(summary), "approuvé");
  assert.equal(
    inviteStatusOf({ ...summary, email_confirmed_at: null }),
    "en attente",
  );
  assert.equal(
    inviteStatusOf({
      ...summary,
      email_confirmed_at: null,
      invited_at: "2026-02-01T00:00:00Z",
      confirmed_at: "2026-02-02T00:00:00Z",
    }),
    "approuvé",
  );

  console.log("authUsers: all assertions passed");
}

main();
