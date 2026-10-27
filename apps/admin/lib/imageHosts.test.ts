// The admin's next/image hosts (next.config.js), checked with Next's own
// matcher: the optimizer serves the posters and thumbnails the admin shows
// (Supabase Storage of the production and staging projects, the custom
// domain older rows point at, Cloudinary) and refuses any other host.
import type { RemotePattern } from "next/dist/shared/lib/image-config";
import { hasRemoteMatch } from "next/dist/shared/lib/match-remote-pattern";
import assert from "node:assert/strict";
import nextConfig from "../next.config.js";

const patterns = nextConfig.images.remotePatterns as RemotePattern[];
const allowed = (href: string) => hasRemoteMatch([], patterns, new URL(href));

const POSTER =
  "/storage/v1/object/public/concert-posters/00000000-0000-4000-8000-000000000000.jpg";

for (const host of [
  "fsklunxplbbtzgurwqmc.supabase.co",
  "cevuqyhwtzjujxsocxkb.supabase.co",
  "api.lebontemperament.com",
]) {
  assert.ok(allowed(`https://${host}${POSTER}`), `${host}: posters load`);
  assert.ok(!allowed(`http://${host}${POSTER}`), `${host}: https only`);
  assert.ok(
    !allowed(`https://${host}/storage/v1/object/sign/x/y.jpg`),
    `${host}: public objects only`,
  );
}

assert.ok(
  allowed(
    "https://res.cloudinary.com/ci-placeholder/image/upload/c_fill,w_400,h_225,g_auto/staging/fake-photo",
  ),
  "Cloudinary thumbnails load",
);

for (const href of [
  `https://example-project.supabase.co${POSTER}`,
  `https://supabase.co${POSTER}`,
  `https://www.lebontemperament.com${POSTER}`,
  `https://admin.lebontemperament.com${POSTER}`,
  `https://example.com${POSTER}`,
]) {
  assert.ok(!allowed(href), `${new URL(href).host} is refused`);
}

console.log("✔ image hosts: the two Supabase projects, api., Cloudinary only");
