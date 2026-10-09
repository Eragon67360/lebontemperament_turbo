// Run: npx -y deno test --node-modules-dir=none --allow-env=SUPABASE_SECRET_KEYS,SUPABASE_SERVICE_ROLE_KEY supabase/functions/_shared/supabase-keys_test.ts
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { findServiceKey, requireServiceKey } from "./supabase-keys.ts";

function withEnv(env: Record<string, string | undefined>, fn: () => void) {
  const names = ["SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY"];
  const saved = names.map((n) => Deno.env.get(n));
  try {
    for (const n of names) {
      const v = env[n];
      if (v === undefined) Deno.env.delete(n);
      else Deno.env.set(n, v);
    }
    fn();
  } finally {
    names.forEach((n, i) => {
      if (saved[i] === undefined) Deno.env.delete(n);
      else Deno.env.set(n, saved[i]!);
    });
  }
}

Deno.test("the default secret key wins over the legacy key", () => {
  withEnv(
    {
      SUPABASE_SECRET_KEYS: JSON.stringify({
        default: "sb_secret_default",
        other: "sb_secret_other",
      }),
      SUPABASE_SERVICE_ROLE_KEY: "legacy.jwt.key",
    },
    () => assertEquals(requireServiceKey(), "sb_secret_default"),
  );
});

Deno.test("the legacy key is used until the project has secret keys", () => {
  withEnv({ SUPABASE_SERVICE_ROLE_KEY: "legacy.jwt.key" }, () =>
    assertEquals(requireServiceKey(), "legacy.jwt.key"),
  );
  withEnv(
    {
      SUPABASE_SECRET_KEYS: "{}",
      SUPABASE_SERVICE_ROLE_KEY: "legacy.jwt.key",
    },
    () => assertEquals(requireServiceKey(), "legacy.jwt.key"),
  );
  withEnv(
    {
      SUPABASE_SECRET_KEYS: "not json",
      SUPABASE_SERVICE_ROLE_KEY: "legacy.jwt.key",
    },
    () => assertEquals(requireServiceKey(), "legacy.jwt.key"),
  );
});

Deno.test("no key at all", () => {
  withEnv({}, () => {
    assertEquals(findServiceKey(), undefined);
    assertThrows(() => requireServiceKey());
  });
  withEnv({ SUPABASE_SERVICE_ROLE_KEY: "" }, () =>
    assertEquals(findServiceKey(), undefined),
  );
});
