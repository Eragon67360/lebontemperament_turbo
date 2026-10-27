// Run with: npx tsx lib/frameAncestors.test.ts
//
// Who may frame the website (next.config.js headers): the admin, whose story
// preview shows a concert page in a frame, and outside production builds an
// admin dev server on this machine (port 3002). A production build never
// allows a local origin, even when NEXT_PUBLIC_ADMIN_URL is missing.
import assert from "node:assert/strict";
import nextConfig from "../next.config.js";

const LOCAL_ORIGINS = [
  "http://localhost:3002",
  "https://localhost:3002",
  "http://127.0.0.1:3002",
  "https://127.0.0.1:3002",
];

type Env = { VERCEL_ENV?: string; NEXT_PUBLIC_ADMIN_URL?: string };

/** The frame-ancestors sources sent on every page, built with `env`. */
async function frameAncestors(env: Env): Promise<string[]> {
  const names = ["VERCEL_ENV", "NEXT_PUBLIC_ADMIN_URL"] as const;
  const saved = names.map((name) => process.env[name]);
  const apply = (name: (typeof names)[number], value: string | undefined) => {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  };
  for (const name of names) apply(name, env[name]);
  try {
    const rules = await nextConfig.headers();
    // The pages' rule (every path but the Drive file proxy, which sends its
    // own policy per file type).
    const csp = rules
      .flatMap((rule) => rule.headers)
      .find((header) => header.key === "Content-Security-Policy");
    assert.ok(csp, "every page sends a Content-Security-Policy");
    const match = csp.value.match(/^frame-ancestors ([^;]+);$/);
    assert.ok(match?.[1], `unexpected policy: ${csp.value}`);
    return match[1].split(" ");
  } finally {
    names.forEach((name, i) => apply(name, saved[i]));
  }
}

// Production: the site itself and the admin, nothing local.
assert.deepEqual(
  await frameAncestors({
    VERCEL_ENV: "production",
    NEXT_PUBLIC_ADMIN_URL: "https://admin.example.com/dashboard",
  }),
  ["'self'", "https://admin.example.com"],
);
assert.deepEqual(
  await frameAncestors({ VERCEL_ENV: "production" }),
  ["'self'", "https://admin.lebontemperament.com"],
  "without NEXT_PUBLIC_ADMIN_URL, production falls back to the real admin",
);

// Staging and previews: their admin, and an admin dev server on port 3002.
assert.deepEqual(
  await frameAncestors({
    VERCEL_ENV: "preview",
    NEXT_PUBLIC_ADMIN_URL: "https://admin-dev.example.com",
  }),
  ["'self'", "https://admin-dev.example.com", ...LOCAL_ORIGINS],
);

// A local build (no VERCEL_ENV): the admin dev server, listed once.
assert.deepEqual(await frameAncestors({}), ["'self'", ...LOCAL_ORIGINS]);
assert.deepEqual(
  await frameAncestors({ NEXT_PUBLIC_ADMIN_URL: "http://localhost:3001" }),
  ["'self'", "http://localhost:3001", ...LOCAL_ORIGINS],
);

console.log("✔ frame-ancestors: local origins only outside production");
