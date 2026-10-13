// Run with: npx tsx lib/contact.test.ts
//
// The association's contact details have one source, the site settings the
// admin manages (#329, #621); their built-in defaults (the fallback) are
// derived once in lib/contact.ts. No phone number on the website except the
// publisher's on the legal notice (required there), which only the legal
// notice page may read; the developer's address never on it; the mailbox
// literal written nowhere else. llms.txt reads the same settings as the
// pages (#334).
import {
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
} from "@repo/domain/utils/siteSettings";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONTACT_EMAIL } from "./contact";
import { JOINING_FACTS } from "./joining";
import { buildLlmsTxt } from "./llms";

const websiteRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name) ? [full] : [];
  });

const files = ["app", "components", "lib", "hooks"].flatMap((dir) =>
  sourceFiles(path.join(websiteRoot, dir)),
);
const relative = (file: string) => path.relative(websiteRoot, file);

// A French phone number written as a literal: +33 or 0X followed by four
// pairs of digits, with spaces, dots or dashes, or a tel: link to a literal.
const PHONE_LITERAL =
  /(\+33|\(\+33\))[\s.-]?\(?0?\)?[1-9]([\s.-]?\d{2}){4}|\b0[1-9]([\s.-]\d{2}){4}\b|tel:\+?\d/;

// The legal notice names the publisher's phone, as the LCEN requires. The
// number lives in the settings' defaults (packages/domain), no longer here.
const LEGAL_NOTICE_PAGE = path.join("app", "mentions-legales", "page.tsx");
const ALLOWED_PHONE_LITERALS = new Set([LEGAL_NOTICE_PAGE]);

for (const file of files) {
  const source = readFileSync(file, "utf8");
  assert.ok(
    ALLOWED_PHONE_LITERALS.has(relative(file)) || !PHONE_LITERAL.test(source),
    `${relative(file)} contains a phone number: the site shows none (#329)`,
  );
  assert.ok(
    !/orange\.fr|thomas-moser@/i.test(source),
    `${relative(file)} contains the developer's address (#329)`,
  );
  // Only the legal notice reads the publisher's phone setting: any other
  // page, or a client component, would spread it over the site.
  assert.ok(
    relative(file) === LEGAL_NOTICE_PAGE || !source.includes("publisherPhone"),
    `${relative(file)} reads the publisher's phone: only ${LEGAL_NOTICE_PAGE} may (#329)`,
  );
  // Client components get the public settings from SiteSettingsProvider.
  // lib/siteSettings.ts is server-only, and the built-in defaults (the whole
  // site's text, the publisher's phone) would ship in the browser bundle:
  // measured, a client import of lib/contact, lib/joining or
  // DEFAULT_SITE_SETTINGS keeps them there even if only a constant is used.
  if (/^\s*["']use client["'];?\s*$/m.test(source)) {
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    assert.ok(
      !/from\s+["']@\/lib\/siteSettings["']/.test(code),
      `${relative(file)} is a client component reading lib/siteSettings.ts: use useSiteSettings()`,
    );
    assert.ok(
      !/from\s+["'](?:@\/lib|(?:\.\.?\/)+lib)\/(?:contact|joining|llms)["']/.test(
        code,
      ) && !code.includes("DEFAULT_SITE_SETTINGS"),
      `${relative(file)} is a client component importing the built-in defaults: use useSiteSettings()`,
    );
  }
}

// The mailbox literal lives in the settings' defaults (and lib/contact.ts
// derives CONTACT_EMAIL from them). The members' calendar embeds the
// association's Google calendar, whose id happens to be the same address.
const ALLOWED_EMAIL_LITERALS = new Set([
  path.join("lib", "contact.ts"),
  path.join("app", "membres", "calendrier", "page.tsx"),
]);
for (const file of files) {
  if (ALLOWED_EMAIL_LITERALS.has(relative(file))) continue;
  assert.ok(
    !readFileSync(file, "utf8").includes(CONTACT_EMAIL),
    `${relative(file)} writes the mailbox as a literal: read the site settings`,
  );
}

// llms.txt: one email, no phone, the joining facts, absolute links.
const llms = buildLlmsTxt("https://www.lebontemperament.com");
assert.equal(
  llms,
  buildLlmsTxt("https://www.lebontemperament.com", DEFAULT_SITE_SETTINGS),
  "llms.txt shows the defaults when no settings are given",
);
assert.ok(llms.startsWith("# Le Bon Tempérament\n"));
assert.ok(llms.includes(`Email : ${CONTACT_EMAIL}`));
assert.ok(
  llms.includes("Siège : 3 Rue Clemenceau, 67700 Saverne, France"),
  "llms.txt misses the registered office",
);
assert.ok(!PHONE_LITERAL.test(llms));
for (const fact of Object.values(JOINING_FACTS)) {
  assert.ok(llms.includes(fact), `llms.txt misses: ${fact.slice(0, 40)}…`);
}
assert.ok(llms.includes("(https://www.lebontemperament.com/rejoindre)"));
assert.ok(!llms.includes("/membres/"), "llms.txt links no members-only page");

// The settings the admin saves reach llms.txt: mailbox, address, joining
// facts; the publisher's phone still never does.
const edited: SiteSettings = {
  ...DEFAULT_SITE_SETTINGS,
  contact: {
    email: "contact@example.org",
    street: "1 Place du Marché",
    postalCode: "67000",
    city: "Strasbourg",
  },
  joining: {
    ...DEFAULT_SITE_SETTINGS.joining,
    fee: "La cotisation est de 50 €.",
  },
  legal_notice: {
    ...DEFAULT_SITE_SETTINGS.legal_notice,
    publisherPhone: "+33 6 12 34 56 78",
  },
};
const editedLlms = buildLlmsTxt("https://www.lebontemperament.com", edited);
assert.ok(editedLlms.includes("Email : contact@example.org"));
assert.ok(
  editedLlms.includes("Siège : 1 Place du Marché, 67000 Strasbourg, France"),
);
assert.ok(editedLlms.includes("- Cotisation : La cotisation est de 50 €."));
assert.ok(
  !editedLlms.includes(CONTACT_EMAIL),
  "llms.txt keeps the old mailbox",
);
assert.ok(
  !editedLlms.includes(JOINING_FACTS.fee),
  "llms.txt keeps the old fee",
);
assert.ok(
  !PHONE_LITERAL.test(editedLlms),
  "llms.txt shows the publisher's phone",
);

console.log(`contact: ${files.length} files checked, llms.txt ok`);
