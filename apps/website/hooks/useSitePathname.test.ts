// Run with: npx tsx hooks/useSitePathname.test.ts
import assert from "node:assert/strict";
import { sitePathname } from "./useSitePathname";

// Vercel renders the cached home as "/index"; the browser reads "/". Both
// must give the home, or the header and « Accueil » differ between the server
// HTML and the hydrating render (audit UI-V-002).
assert.equal(sitePathname("/index"), "/");
assert.equal(sitePathname("/"), "/");

// Every other pathname is left as it is, an "index" deeper in the path too.
assert.equal(sitePathname("/concerts"), "/concerts");
assert.equal(sitePathname("/concerts/index"), "/concerts/index");
assert.equal(sitePathname("/indexation"), "/indexation");
assert.equal(sitePathname("/membres"), "/membres");

console.log("useSitePathname.test.ts: ok");
