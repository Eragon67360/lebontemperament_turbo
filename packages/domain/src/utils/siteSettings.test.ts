import assert from "node:assert/strict";
import {
  DEFAULT_SITE_SETTINGS,
  JOINING_FACT_KEYS,
  parseSiteSetting,
  readSiteSettings,
  SITE_SETTING_KEYS,
  type SiteSettingKey,
} from "./siteSettings";

// The defaults are valid settings, unchanged by parsing.
for (const key of SITE_SETTING_KEYS) {
  const parsed = parseSiteSetting(key, DEFAULT_SITE_SETTINGS[key]);
  assert.ok(parsed.ok, `default ${key} is invalid`);
  assert.deepEqual(parsed.value, DEFAULT_SITE_SETTINGS[key]);
}

const error = (key: SiteSettingKey, raw: unknown) => {
  const parsed = parseSiteSetting(key, raw);
  assert.ok(!parsed.ok, `${key} accepted ${JSON.stringify(raw)}`);
  return parsed;
};

// Contact: trimmed, a real-looking address, a five-digit postal code.
const contact = DEFAULT_SITE_SETTINGS.contact;
const trimmed = parseSiteSetting("contact", {
  ...contact,
  email: "  bureau@example.org ",
});
assert.ok(trimmed.ok);
assert.equal(trimmed.value.email, "bureau@example.org");
assert.equal(error("contact", { ...contact, email: "nope" }).field, "email");
assert.equal(
  error("contact", { ...contact, email: "a@b.c<script>" }).field,
  "email",
);
assert.equal(
  error("contact", { ...contact, postalCode: "6770" }).field,
  "postalCode",
);
assert.equal(error("contact", { ...contact, city: "  " }).field, "city");
assert.equal(
  error("contact", { ...contact, phone: "0600000000" }).field,
  "phone",
);
error("contact", null);
error("contact", []);

// Social links: https on the network's own host, each network once.
const link = (network: string, url: string) => ({ links: [{ network, url }] });
assert.ok(
  parseSiteSetting("social_links", link("youtube", "https://youtube.com/@x"))
    .ok,
);
assert.ok(parseSiteSetting("social_links", { links: [] }).ok);
for (const bad of [
  "http://www.instagram.com/x",
  "https://www.instagram.com.evil.example/x",
  "https://evil.example/www.instagram.com",
  "https://user@www.instagram.com/x",
  "javascript:alert(1)",
  "instagram.com/x",
]) {
  assert.equal(
    error("social_links", link("instagram", bad)).field,
    "links.instagram",
    bad,
  );
}
error("social_links", link("myspace", "https://myspace.com/x"));
error("social_links", {
  links: [
    { network: "tiktok", url: "https://www.tiktok.com/@a" },
    { network: "tiktok", url: "https://www.tiktok.com/@b" },
  ],
});

// Donations: HelloAsso only, whole euros, no duplicates, a default that exists.
const donations = DEFAULT_SITE_SETTINGS.donations;
assert.equal(
  error("donations", { ...donations, helloassoUrl: "https://evil.example/" })
    .field,
  "helloassoUrl",
);
assert.equal(error("donations", { ...donations, tiers: [] }).field, "tiers");
assert.equal(
  error("donations", {
    ...donations,
    tiers: [{ ...donations.tiers[0], amount: 7.5 }],
    defaultAmount: 7.5,
  }).field,
  "tiers.0.amount",
);
assert.equal(
  error("donations", {
    ...donations,
    tiers: [donations.tiers[0], donations.tiers[0]],
  }).field,
  "tiers.1.amount",
);
assert.equal(
  error("donations", { ...donations, defaultAmount: 999 }).field,
  "defaultAmount",
);
assert.equal(
  error("donations", {
    ...donations,
    tiers: Array.from({ length: 11 }, (_, i) => ({
      amount: i + 1,
      emoji: "🎵",
      description: "x",
    })),
    defaultAmount: 1,
  }).field,
  "tiers",
);

// Joining: every fact present.
for (const key of JOINING_FACT_KEYS) {
  assert.equal(
    error("joining", { ...DEFAULT_SITE_SETTINGS.joining, [key]: "" }).field,
    key,
  );
}

// Legal notice: phone and SIRET shapes; an empty registry is null.
const legal = DEFAULT_SITE_SETTINGS.legal_notice;
const registry = parseSiteSetting("legal_notice", { ...legal, registry: " " });
assert.ok(registry.ok);
assert.equal(registry.value.registry, null);
assert.equal(
  error("legal_notice", { ...legal, publisherPhone: "appelez-nous" }).field,
  "publisherPhone",
);
assert.equal(
  error("legal_notice", { ...legal, siret: "499 664 654" }).field,
  "siret",
);

// Reading rows: each key falls back to its default on its own.
const read = readSiteSettings([
  { key: "social_links", value: { links: [] } },
  { key: "donations", value: { tiers: "broken" } },
  { key: "something_else", value: {} },
]);
assert.deepEqual(read.settings.social_links, { links: [] });
assert.deepEqual(read.settings.donations, DEFAULT_SITE_SETTINGS.donations);
assert.deepEqual(read.settings.contact, DEFAULT_SITE_SETTINGS.contact);
assert.deepEqual(read.invalid, ["donations"]);
assert.deepEqual(readSiteSettings([]).settings, DEFAULT_SITE_SETTINGS);

console.log("siteSettings: ok");
