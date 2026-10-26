// Run with: npx tsx lib/memberDirectory.test.ts
import type { Database } from "@repo/domain/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
import { loadMemberDirectory } from "./memberDirectory";

type Client = SupabaseClient<Database>;
type RpcResult = {
  data: unknown;
  error: { code?: string; message: string } | null;
};

const missing = { code: "PGRST202", message: "Could not find the function" };
const GOOGLE = "https://lh3.googleusercontent.com/a/fake-avatar=s96-c";

function callerClient(results: Record<string, RpcResult>) {
  const called: string[] = [];
  const client = {
    rpc: async (name: string) => {
      called.push(name);
      return results[name] ?? { data: null, error: missing };
    },
  } as unknown as Client;
  return { client, called };
}

function adminClient(users: { id: string; avatar?: unknown }[]) {
  const calls = { listUsers: 0 };
  const client = {
    auth: {
      admin: {
        listUsers: async () => {
          calls.listUsers++;
          return {
            data: {
              users:
                calls.listUsers === 1
                  ? users.map((u) => ({
                      id: u.id,
                      user_metadata: { avatar_url: u.avatar },
                    }))
                  : [],
            },
            error: null,
          };
        },
      },
    },
  } as unknown as Client;
  return { client, calls };
}

const base = {
  display_name: "A",
  email: "a@example.com",
  voice: "Alto",
  profile_picture_url: null,
};

async function main() {
  // New function present: a single call, no Auth admin API. Only Google
  // account pictures are kept, even before the function filters them itself.
  {
    const rows = [
      { id: "1", ...base, auth_avatar_url: GOOGLE },
      { id: "2", ...base, auth_avatar_url: "https://other.example/x.gif" },
      { id: "3", ...base, auth_avatar_url: null },
    ];
    const caller = callerClient({
      member_directory_with_avatars: { data: rows, error: null },
    });
    const admin = adminClient([]);
    const result = await loadMemberDirectory(caller.client, admin.client);
    assert.deepEqual(result, {
      rows: [rows[0], { ...rows[1], auth_avatar_url: null }, rows[2]],
      error: null,
    });
    assert.deepEqual(caller.called, ["member_directory_with_avatars"]);
    assert.equal(admin.calls.listUsers, 0);
  }

  // Migration not applied: member_directory() plus the Auth admin API.
  {
    const caller = callerClient({
      member_directory: {
        data: [
          { id: "1", ...base },
          { id: "2", ...base, display_name: "B" },
          { id: "3", ...base, display_name: "C" },
        ],
        error: null,
      },
    });
    const admin = adminClient([
      { id: "1", avatar: GOOGLE },
      { id: "2", avatar: 42 }, // not a string: ignored
      { id: "3", avatar: "https://other.example/x.gif" }, // not Google: ignored
    ]);
    const result = await loadMemberDirectory(caller.client, admin.client);
    assert.equal(result.error, null);
    assert.deepEqual(
      result.rows.map((r) => [r.id, r.auth_avatar_url]),
      [
        ["1", GOOGLE],
        ["2", null],
        ["3", null],
      ],
    );
    assert.deepEqual(caller.called, [
      "member_directory_with_avatars",
      "member_directory",
    ]);
  }

  // Any other error is reported, not papered over by the fallback.
  {
    const denied = { code: "42501", message: "permission denied" };
    const caller = callerClient({
      member_directory_with_avatars: { data: null, error: denied },
    });
    const result = await loadMemberDirectory(
      caller.client,
      adminClient([]).client,
    );
    assert.deepEqual(result, { rows: [], error: denied });
    assert.deepEqual(caller.called, ["member_directory_with_avatars"]);
  }

  console.log("memberDirectory: all assertions passed");
}

main();
