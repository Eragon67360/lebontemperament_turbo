// Run: npx -y deno test --node-modules-dir=none --allow-env=INTERNAL_FUNCTION_SECRET supabase/functions/_shared/
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  requireInternalSecret,
  requireInternalSecretOrAdmin,
  requireSuperadmin,
  safeEqual,
} from "./caller-auth.ts";

const SECRET = "test-secret-" + "x".repeat(20);

function request(headers: Record<string, string> = {}) {
  return new Request("https://example.com/functions/v1/fn", {
    method: "POST",
    headers,
  });
}

/** A stand-in for the service-role client: one user per token, one role per user. */
function fakeAdmin(
  users: Record<string, { id: string; role: string }>,
): SupabaseClient {
  return {
    auth: {
      getUser: (token: string) =>
        Promise.resolve(
          users[token]
            ? { data: { user: { id: users[token].id } }, error: null }
            : { data: { user: null }, error: new Error("invalid JWT") },
        ),
    },
    from: () => ({
      select: () => ({
        eq: (_column: string, id: string) => ({
          single: () =>
            Promise.resolve({
              data: Object.values(users).find((u) => u.id === id) ?? null,
              error: null,
            }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

Deno.test("safeEqual compares exactly", () => {
  assert(safeEqual("abc", "abc"));
  assert(!safeEqual("abc", "abd"));
  assert(!safeEqual("abc", "abcd"));
  assert(!safeEqual("", "abc"));
});

Deno.test("internal secret: missing or wrong header is refused", () => {
  Deno.env.set("INTERNAL_FUNCTION_SECRET", SECRET);
  assertEquals(requireInternalSecret(request())?.status, 401);
  assertEquals(
    requireInternalSecret(request({ "x-internal-secret": "nope" }))?.status,
    401,
  );
  // A caller holding only the public key is refused.
  assertEquals(
    requireInternalSecret(request({ Authorization: "Bearer public-anon-key" }))
      ?.status,
    401,
  );
  assertEquals(
    requireInternalSecret(request({ "x-internal-secret": SECRET })),
    null,
  );
});

Deno.test("internal secret: fails closed when not configured", () => {
  Deno.env.delete("INTERNAL_FUNCTION_SECRET");
  assertEquals(
    requireInternalSecret(request({ "x-internal-secret": "" }))?.status,
    500,
  );
});

Deno.test("superadmin: only a signed-in superadmin passes", async () => {
  const admin = fakeAdmin({
    "token-super": { id: "u1", role: "superadmin" },
    "token-admin": { id: "u2", role: "admin" },
    "token-member": { id: "u3", role: "user" },
  });
  const status = async (headers: Record<string, string>) => {
    const result = await requireSuperadmin(request(headers), admin);
    return result instanceof Response ? result.status : 200;
  };
  assertEquals(await status({}), 401);
  assertEquals(await status({ Authorization: "Bearer public-anon-key" }), 401);
  assertEquals(await status({ Authorization: "Bearer token-member" }), 403);
  assertEquals(await status({ Authorization: "Bearer token-admin" }), 403);
  assertEquals(await status({ Authorization: "Bearer token-super" }), 200);
});

Deno.test(
  "internal secret or admin: cron secret, admin session, or nothing else",
  async () => {
    Deno.env.set("INTERNAL_FUNCTION_SECRET", SECRET);
    const admin = fakeAdmin({
      "token-super": { id: "u1", role: "superadmin" },
      "token-admin": { id: "u2", role: "admin" },
      "token-member": { id: "u3", role: "user" },
    });
    const call = async (headers: Record<string, string>) => {
      const result = await requireInternalSecretOrAdmin(
        request(headers),
        admin,
      );
      return result instanceof Response ? result.status : result;
    };

    // The cron: secret only (it also sends the anon key as bearer).
    assertEquals(await call({ "x-internal-secret": SECRET }), {
      kind: "internal",
    });
    assertEquals(
      await call({
        "x-internal-secret": SECRET,
        Authorization: "Bearer public-anon-key",
      }),
      { kind: "internal" },
    );
    // The admin app: the user's session, verified through Auth.
    assertEquals(await call({ Authorization: "Bearer token-admin" }), {
      kind: "admin",
      userId: "u2",
    });
    assertEquals(await call({ Authorization: "Bearer token-super" }), {
      kind: "admin",
      userId: "u1",
    });
    // Refusals.
    assertEquals(await call({}), 401);
    assertEquals(await call({ Authorization: "Bearer public-anon-key" }), 401);
    assertEquals(await call({ Authorization: "Bearer token-member" }), 403);
    assertEquals(await call({ "x-internal-secret": "nope" }), 401);
    // A wrong secret never falls back to the session.
    assertEquals(
      await call({
        "x-internal-secret": "nope",
        Authorization: "Bearer token-admin",
      }),
      401,
    );
  },
);

Deno.test(
  "internal secret or admin: fails closed when the secret isn't configured",
  async () => {
    Deno.env.delete("INTERNAL_FUNCTION_SECRET");
    const admin = fakeAdmin({ "token-admin": { id: "u2", role: "admin" } });
    const result = await requireInternalSecretOrAdmin(
      request({ "x-internal-secret": "anything" }),
      admin,
    );
    assertEquals(result instanceof Response ? result.status : 200, 500);
    // The session path still works without the secret configured.
    const viaSession = await requireInternalSecretOrAdmin(
      request({ Authorization: "Bearer token-admin" }),
      admin,
    );
    assertEquals(viaSession, { kind: "admin", userId: "u2" });
  },
);
