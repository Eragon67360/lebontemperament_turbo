// Run with: npx tsx lib/contact.test.ts
//
// The association's contact details have one source, lib/contact.ts (#329):
// no phone number on the website except the publisher's on the legal notice
// (required there), the developer's address never on it, and the mailbox
// literal written only once. llms.txt reads the same
// constants as the pages (#334).
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

// The legal notice names the publisher's phone, as the LCEN requires.
const ALLOWED_PHONE_LITERALS = new Set([
  path.join("app", "mentions-legales", "page.tsx"),
]);

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
}

// The mailbox literal lives in lib/contact.ts. The members' calendar embeds
// the association's Google calendar, whose id happens to be the same address.
const ALLOWED_EMAIL_LITERALS = new Set([
  path.join("lib", "contact.ts"),
  path.join("app", "membres", "calendrier", "page.tsx"),
]);
for (const file of files) {
  if (ALLOWED_EMAIL_LITERALS.has(relative(file))) continue;
  assert.ok(
    !readFileSync(file, "utf8").includes(CONTACT_EMAIL),
    `${relative(file)} writes the mailbox as a literal: import CONTACT_EMAIL`,
  );
}

// llms.txt: one email, no phone, the joining facts, absolute links.
const llms = buildLlmsTxt("https://www.lebontemperament.com");
assert.ok(llms.startsWith("# Le Bon Tempérament\n"));
assert.ok(llms.includes(`Email : ${CONTACT_EMAIL}`));
assert.ok(!PHONE_LITERAL.test(llms));
for (const fact of Object.values(JOINING_FACTS)) {
  assert.ok(llms.includes(fact), `llms.txt misses: ${fact.slice(0, 40)}…`);
}
assert.ok(llms.includes("(https://www.lebontemperament.com/rejoindre)"));
assert.ok(!llms.includes("/membres/"), "llms.txt links no members-only page");

console.log(`contact: ${files.length} files checked, llms.txt ok`);
