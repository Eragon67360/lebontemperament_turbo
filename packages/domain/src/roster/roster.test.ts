import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { diffRoster, fieldChanges } from "./diff";
import { rosterFingerprint } from "./fingerprint";
import {
  isValidEmail,
  joinVoices,
  mapHeaders,
  nameKey,
  normalizeHeader,
  normalizeName,
  normalizePhone,
  phoneKey,
  splitVoices,
} from "./normalize";
import type { ProfileForDiff, RosterRow } from "./types";
import { parseRoster } from "./validate";

// Every person here is fictional (example.com addresses, made-up names).

const sha256 = (input: string) =>
  createHash("sha256").update(input).digest("hex");

const HEADERS = [
  "NOM Prénom",
  "Adresse mail",
  "Adresse postale",
  "Domicile",
  "Portable",
  "Voix",
] as const;

type Cells = Partial<Record<(typeof HEADERS)[number], string>>;
const row = (cells: Cells): Record<string, string> => ({
  ...Object.fromEntries(HEADERS.map((h) => [h, ""])),
  ...cells,
});

const profile = (partial: Partial<ProfileForDiff> & { id: string }) => ({
  email: null,
  display_name: null,
  role: "user",
  address: null,
  home_phone: null,
  voice: null,
  status: "approuvé" as const,
  ...partial,
});

const codes = (issues: { code: string }[]) => issues.map((i) => i.code);

// --- Headers -----------------------------------------------------------------

assert.equal(
  normalizeHeader("﻿ NOM Prénom "),
  "nom prenom",
  "BOM, spaces, accents",
);
assert.equal(normalizeHeader("Adresse e-mail"), "adresse e mail");

{
  const mapping = mapHeaders([
    "﻿nom prénom",
    "ADRESSE E-MAIL ",
    "adresse postale",
    "Tél. domicile",
    "Portable",
    "voix",
  ]);
  assert.deepEqual(mapping.missing, []);
  assert.deepEqual(mapping.absent, []);
  assert.equal(mapping.columns.name, "﻿nom prénom");
  assert.equal(mapping.columns.email, "ADRESSE E-MAIL ");
  assert.equal(mapping.columns.homePhone, "Tél. domicile");
}
{
  const mapping = mapHeaders(["Nom complet", "Adresse postale", "Voix"]);
  assert.deepEqual(mapping.missing, ["email"]);
  assert.deepEqual(mapping.absent, ["homePhone", "mobilePhone"]);
}
{
  // The first matching header wins; a second candidate is left alone.
  const mapping = mapHeaders(["Mail", "Email"]);
  assert.equal(mapping.columns.email, "Mail");
}
{
  // Separate « Nom » and « Prénom » columns stand in for « NOM Prénom ».
  const mapping = mapHeaders(["Nom", "Prénom", "Adresse mail"]);
  assert.deepEqual(mapping.missing, []);
  assert.deepEqual(mapping.nameParts, { surname: "Nom", firstName: "Prénom" });
  assert.equal(mapping.surnameOnly, false);
  assert.equal(mapping.columns.name, undefined);
}
{
  // « Nom » alone is not a name column.
  const mapping = mapHeaders(["Nom", "Adresse mail"]);
  assert.deepEqual(mapping.missing, ["name"]);
  assert.equal(mapping.surnameOnly, true);
  assert.equal(mapping.nameParts, undefined);
}
{
  // The combined column wins over the pair when both exist.
  const mapping = mapHeaders(["NOM Prénom", "Prénom", "Adresse mail"]);
  assert.equal(mapping.columns.name, "NOM Prénom");
  assert.equal(mapping.nameParts, undefined);
}

// --- Values ------------------------------------------------------------------

assert.equal(normalizeName("DUPONT Marie"), "Marie DUPONT");
assert.equal(normalizeName("DE LA FONTAINE Jean"), "Jean DE LA FONTAINE");
assert.equal(
  normalizeName("MARTIN-DUPONT Anne-Marie"),
  "Anne-Marie MARTIN-DUPONT",
);
assert.equal(normalizeName("O'NEILL Sean"), "Sean O'NEILL");
assert.equal(
  normalizeName("  LEROY   Zoé "),
  "Zoé LEROY",
  "whitespace collapsed",
);
assert.equal(
  normalizeName("Marie DUPONT"),
  "Marie DUPONT",
  "already Prénom NOM",
);
assert.equal(
  normalizeName("Marie Dupont"),
  "Marie Dupont",
  "no upper-case run: kept",
);
assert.equal(
  normalizeName("DUPONT MARIE"),
  "DUPONT MARIE",
  "all upper: never a two-token split",
);
assert.equal(normalizeName(""), "");
assert.equal(normalizeName(null), "");

assert.equal(nameKey("Jean DE LA FONTAINE"), nameKey("de la Fontaine Jean"));
assert.equal(nameKey("Zoé LEROY"), nameKey("zoe leroy"));
assert.notEqual(nameKey("Marie DUPONT"), nameKey("Marie DURAND"));

assert.equal(normalizePhone("06 12 34 56 78"), "06 12 34 56 78");
assert.equal(normalizePhone("0612345678"), "06 12 34 56 78");
assert.equal(normalizePhone("+33 6 12 34 56 78"), "06 12 34 56 78");
assert.equal(normalizePhone("+33612345678"), "06 12 34 56 78");
assert.equal(normalizePhone("0033612345678"), "06 12 34 56 78");
assert.equal(normalizePhone("03.88.12.34.56"), "03 88 12 34 56");
assert.equal(normalizePhone("+33 (0)6 12 34 56 78"), "06 12 34 56 78");
assert.equal(normalizePhone("0033 (0)6 12 34 56 78"), "06 12 34 56 78");
assert.equal(normalizePhone("+33(0)612345678"), "06 12 34 56 78");
assert.equal(
  normalizePhone("+41  79 123 45 67"),
  "+41 79 123 45 67",
  "foreign number: kept as written, single spaces",
);
assert.equal(phoneKey("+41 79 123 45 67"), "+41791234567");
assert.notEqual(phoneKey("+41 79 123 45 67"), phoneKey("041 79 123 45 67"));
assert.equal(
  normalizePhone("0612345678 / 0698765432"),
  "0612345678 / 0698765432",
  "two numbers: kept as written",
);
assert.equal(
  normalizePhone("06 12 34 56 78, 06 98 76 54 32"),
  "06 12 34 56 78, 06 98 76 54 32",
);
assert.equal(
  normalizePhone("0612345678 ; 0698765432"),
  "0612345678 ; 0698765432",
);
assert.equal(
  normalizePhone("0612345678 ou  0698765432"),
  "0612345678 ou 0698765432",
);
assert.equal(
  phoneKey("0612345678 / 0698765432"),
  "0612345678 / 0698765432",
  "two numbers compare as written, never as concatenated digits",
);
assert.notEqual(
  phoneKey("0612345678 / 0698765432"),
  phoneKey("06123456780698765432"),
);
assert.equal(
  normalizePhone("06 12 34 56"),
  "06 12 34 56",
  "odd length: as written",
);
assert.equal(normalizePhone("n/a"), "n/a", "no digit: text kept for the admin");
assert.equal(normalizePhone(""), "");
assert.equal(phoneKey("+33 6 12 34 56 78"), phoneKey("06.12.34.56.78"));

assert.equal(isValidEmail("marie.dupont@example.com"), true);
assert.equal(isValidEmail("marie.dupont@example"), false);
assert.equal(isValidEmail("marie dupont@example.com"), false);
assert.equal(isValidEmail("@example.com"), false);

assert.deepEqual(splitVoices("Jeune, Soprane"), ["Jeune", "Soprane"]);
assert.deepEqual(
  splitVoices("jeune / soprane"),
  ["Jeune", "Soprane"],
  "known casing restored",
);
assert.deepEqual(splitVoices("Jeune + Orchestre"), ["Jeune", "Orchestre"]);
assert.deepEqual(splitVoices("Ténor et Basse"), ["Ténor", "Basse"]);
assert.deepEqual(
  splitVoices("tenor & basse"),
  ["Ténor", "Basse"],
  "accent-insensitive",
);
assert.deepEqual(splitVoices("Alto, alto, ALTO"), ["Alto"], "de-duplicated");
assert.deepEqual(
  splitVoices("Soprano"),
  ["Soprano"],
  "unknown value kept as written",
);
assert.deepEqual(splitVoices(""), []);
assert.deepEqual(splitVoices(null), []);
assert.equal(joinVoices(["Jeune", "Soprane"]), "Jeune & Soprane");

// --- parseRoster: errors -----------------------------------------------------

{
  const parsed = parseRoster([], { activeProfilesCount: 10 });
  assert.deepEqual(codes(parsed.errors), ["empty"]);
}
{
  // The email column is missing: blocking, with the headers that were read.
  const parsed = parseRoster([{ "NOM Prénom": "DUPONT Marie", Voix: "Alto" }], {
    activeProfilesCount: 1,
  });
  assert.deepEqual(codes(parsed.errors), ["missing_header"]);
  assert.match(parsed.errors[0]!.message, /« Adresse mail » introuvable/);
  assert.match(parsed.errors[0]!.message, /« NOM Prénom », « Voix »/);
  assert.equal(parsed.rows.length, 0, "nothing is compared on a bad roster");
}
{
  // « Nom » + « Prénom » are combined as « Prénom NOM ».
  const parsed = parseRoster(
    [
      {
        Nom: "de la Fontaine",
        Prénom: "Jean",
        "Adresse mail": "j@example.com",
      },
      { Nom: "DUPONT", Prénom: "", "Adresse mail": "d@example.com" },
    ],
    { activeProfilesCount: 0 },
  );
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.rows[0]!.name, "Jean DE LA FONTAINE");
  assert.equal(parsed.rows[1]!.name, "DUPONT");
}
{
  // « Nom » without « Prénom »: blocking, and it says what is expected.
  const parsed = parseRoster(
    [{ Nom: "DUPONT Marie", "Adresse mail": "m@example.com" }],
    { activeProfilesCount: 0 },
  );
  assert.deepEqual(codes(parsed.errors), ["missing_header"]);
  assert.match(parsed.errors[0]!.message, /« Prénom » introuvable/);
  assert.match(
    parsed.errors[0]!.message,
    /« NOM Prénom ».*ou deux colonnes « Nom » et « Prénom »/,
  );
  assert.equal(parsed.rows.length, 0);
}
{
  // A truncated download: 3 rows for 20 accounts.
  const parsed = parseRoster(
    ["a", "b", "c"].map((n) =>
      row({ "NOM Prénom": `TEST ${n}`, "Adresse mail": `${n}@example.com` }),
    ),
    { activeProfilesCount: 20 },
  );
  assert.deepEqual(codes(parsed.errors), ["too_few_rows"]);
  assert.match(parsed.errors[0]!.message, /3 lignes pour 20 comptes/);
}
{
  // Exactly half is accepted; no floor when the admin has no profile yet.
  const two = ["a", "b"].map((n) =>
    row({ "NOM Prénom": `TEST ${n}`, "Adresse mail": `${n}@example.com` }),
  );
  assert.deepEqual(parseRoster(two, { activeProfilesCount: 4 }).errors, []);
  assert.deepEqual(parseRoster(two, { activeProfilesCount: 0 }).errors, []);
}

// --- parseRoster: normalisation and warnings ---------------------------------

// A CSV-style export: the first header carries a BOM, on every row.
const BOM_NAME = "\uFEFFNOM Prénom";
const bomRow = (cells: Cells): Record<string, string> => {
  const { "NOM Prénom": name, ...rest } = row(cells);
  return { [BOM_NAME]: name ?? "", ...rest };
};

const RAW_ROWS = [
  bomRow({
    "NOM Prénom": "DE LA FONTAINE Jean",
    "Adresse mail": " Jean.Fontaine@Example.com ",
    "Adresse postale": "  3 rue des  Lilas, 67000 Strasbourg ",
    Domicile: "+33 3 88 12 34 56",
    Portable: "0612345678",
    Voix: "Jeune + Soprane",
  }),
  bomRow({
    "NOM Prénom": "DUPONT Marie",
    "Adresse mail": "marie@example.com",
    Voix: "Soprano",
  }),
  bomRow({
    "NOM Prénom": "DURAND Paul",
    "Adresse mail": "marie@example.com", // shares Marie's address
    Voix: "Basse",
  }),
  bomRow({ "NOM Prénom": "LEROY Zoé", Voix: "Alto" }), // no email
  bomRow({ "Adresse mail": "anonymous@example.com" }), // no name
  bomRow({ "NOM Prénom": "PETIT Luc", "Adresse mail": "luc@example" }), // invalid
  bomRow({ "Adresse postale": "only an address" }), // skipped
];

const parsed = parseRoster(RAW_ROWS, { activeProfilesCount: 5 });
assert.deepEqual(parsed.errors, []);
assert.equal(parsed.rows.length, 6, "the address-only row is skipped");
assert.deepEqual(codes(parsed.warnings).sort(), [
  "duplicate_email",
  "invalid_email",
  "no_email",
  "no_name",
  "skipped_rows",
  "unknown_voice",
]);

const jean = parsed.rows[0]!;
assert.equal(jean.rowId, "r1");
assert.equal(jean.name, "Jean DE LA FONTAINE");
assert.equal(jean.email, "jean.fontaine@example.com");
assert.equal(jean.emailValid, true);
assert.equal(jean.address, "3 rue des Lilas, 67000 Strasbourg");
assert.equal(jean.homePhone, "03 88 12 34 56");
assert.equal(jean.mobilePhone, "06 12 34 56 78");
assert.deepEqual(jean.voices, ["Jeune", "Soprane"]);

{
  const dup = parsed.warnings.find((w) => w.code === "duplicate_email")!;
  assert.deepEqual(dup.rowIds, ["r2", "r3"]);
  assert.match(dup.message, /marie@example.com/);
  const voice = parsed.warnings.find((w) => w.code === "unknown_voice")!;
  assert.match(voice.message, /« Soprano »/);
  assert.match(voice.message, /Soprane, Alto, Ténor, Basse, Jeune, Orchestre/);
  assert.deepEqual(voice.rowIds, ["r2"]);
  assert.deepEqual(parsed.warnings.find((w) => w.code === "no_email")!.rowIds, [
    "r4",
  ]);
  assert.deepEqual(parsed.warnings.find((w) => w.code === "no_name")!.rowIds, [
    "r5",
  ]);
  assert.deepEqual(
    parsed.warnings.find((w) => w.code === "invalid_email")!.rowIds,
    ["r6"],
  );
}
{
  // A custom voice list replaces the default one.
  const custom = parseRoster(
    [
      row({
        "NOM Prénom": "A B",
        "Adresse mail": "a@example.com",
        Voix: "Mezzo",
      }),
    ],
    { activeProfilesCount: 0, knownVoices: ["Mezzo"] },
  );
  assert.deepEqual(custom.warnings, []);
  assert.deepEqual(custom.rows[0]!.voices, ["Mezzo"]);
}

// --- fieldChanges ------------------------------------------------------------

const rosterRow = (
  partial: Partial<RosterRow> & { rowId: string },
): RosterRow => ({
  name: "",
  email: "",
  emailValid: true,
  address: "",
  homePhone: "",
  mobilePhone: "",
  voices: [],
  ...partial,
});

{
  // Differences that vanish after normalisation are not changes.
  const changes = fieldChanges(
    rosterRow({
      rowId: "r1",
      name: "Marie DUPONT",
      address: "1 rue Test",
      homePhone: "03 88 12 34 56",
      voices: ["Jeune", "Soprane"],
    }),
    profile({
      id: "p1",
      display_name: "Marie  DUPONT ",
      address: " 1 rue Test",
      home_phone: "+33388123456",
      voice: "soprane & jeune",
    }),
  );
  assert.deepEqual(changes, []);
}
{
  const changes = fieldChanges(
    rosterRow({
      rowId: "r1",
      name: "Marie DUPONT",
      address: "2 rue Neuve",
      homePhone: "03 88 00 00 00",
      voices: ["Alto"],
    }),
    profile({
      id: "p1",
      display_name: "DUPONT Marie", // stored by the old sync, re-synced to Prénom NOM
      address: "1 rue Test",
      home_phone: "0388123456",
      voice: "Soprane",
    }),
  );
  assert.deepEqual(changes, [
    { field: "display_name", from: "DUPONT Marie", to: "Marie DUPONT" },
    { field: "address", from: "1 rue Test", to: "2 rue Neuve" },
    { field: "home_phone", from: "03 88 12 34 56", to: "03 88 00 00 00" },
    { field: "voice", from: "Soprane", to: "Alto" },
  ]);
}
{
  // An empty roster cell never clears a stored value; mobile phone is member-owned.
  const changes = fieldChanges(
    rosterRow({ rowId: "r1", mobilePhone: "06 00 00 00 00" }),
    profile({
      id: "p1",
      display_name: "Marie DUPONT",
      address: "1 rue Test",
      home_phone: "0388123456",
      voice: "Alto",
    }),
  );
  assert.deepEqual(changes, []);
}

// --- diffRoster --------------------------------------------------------------

const PROFILES: ProfileForDiff[] = [
  profile({
    id: "p-jean",
    email: "jean.fontaine@example.com",
    display_name: "DE LA FONTAINE Jean",
    voice: "Jeune",
    status: "approuvé",
  }),
  profile({
    id: "p-marie",
    email: "marie@example.com",
    display_name: "Marie DUPONT",
    voice: "Alto",
  }),
  profile({
    id: "p-left",
    email: "left@example.com",
    display_name: "Ancien MEMBRE",
    status: "approuvé",
  }),
  profile({
    id: "p-pending",
    email: "pending@example.com",
    display_name: "Attente INVITÉ",
    status: "en attente",
  }),
  profile({
    id: "p-admin",
    email: "admin@example.com",
    display_name: "Admin SITE",
    role: "admin",
  }),
  profile({
    id: "p-renamed",
    email: "old.address@example.com",
    display_name: "Zoé LEROY",
  }),
];

const rowsForDiff = parseRoster(
  [
    row({
      "NOM Prénom": "DE LA FONTAINE Jean",
      "Adresse mail": "jean.fontaine@example.com",
      Voix: "Jeune, Soprane",
    }),
    row({
      "NOM Prénom": "DUPONT Marie",
      "Adresse mail": "marie@example.com",
      Voix: "Alto",
    }),
    row({
      "NOM Prénom": "DURAND Paul",
      "Adresse mail": "MARIE@example.com",
      Voix: "Basse",
    }),
    row({
      "NOM Prénom": "NOUVEAU Membre",
      "Adresse mail": "new@example.com",
      Voix: "Ténor",
    }),
    row({
      "NOM Prénom": "LEROY Zoé",
      "Adresse mail": "zoe.new@example.com",
      Voix: "Alto",
    }),
    row({ "NOM Prénom": "SANS Email" }),
    row({ "Adresse mail": "noname@example.com" }),
    row({ "NOM Prénom": "MAL Formé", "Adresse mail": "broken@example" }),
  ],
  { activeProfilesCount: PROFILES.length },
).rows;

const diff = diffRoster(rowsForDiff, PROFILES);

// nouveaux: the row with no account, not Zoé (name match) nor Paul (duplicate).
assert.deepEqual(
  diff.nouveaux.map((n) => [n.rowId, n.email, n.displayName, n.voices]),
  [["r4", "new@example.com", "Membre NOUVEAU", ["Ténor"]]],
);

// modifiés: Jean's name re-synced and his second voice; Marie is unchanged.
assert.equal(diff.modifies.length, 1);
assert.equal(diff.modifies[0]!.profileId, "p-jean");
assert.deepEqual(diff.modifies[0]!.changes, [
  {
    field: "display_name",
    from: "DE LA FONTAINE Jean",
    to: "Jean DE LA FONTAINE",
  },
  { field: "voice", from: "Jeune", to: "Jeune & Soprane" },
]);
assert.equal(
  diff.unchanged,
  0,
  "Marie shares her email with Paul: not compared",
);

// absents: every status, including approuvé and admins; not Zoé (suggested).
assert.deepEqual(
  diff.absents.map((a) => [a.profileId, a.status]),
  [
    ["p-admin", "approuvé"],
    ["p-left", "approuvé"],
    ["p-pending", "en attente"],
  ],
);

// à régler
const kinds = diff.aRegler.map((item) => item.kind).sort();
assert.deepEqual(kinds, [
  "duplicate_email",
  "email_changed",
  "invalid_email",
  "no_email",
  "no_name",
]);
{
  const dup = diff.aRegler.find((i) => i.kind === "duplicate_email")!;
  assert.deepEqual(
    dup.rows.map((r) => r.rowId),
    ["r2", "r3"],
  );
  assert.match(dup.message, /le compte existant n'est pas modifié/);

  const renamed = diff.aRegler.find((i) => i.kind === "email_changed")!;
  assert.deepEqual(
    renamed.rows.map((r) => r.email),
    ["zoe.new@example.com"],
  );
  assert.equal(renamed.profile?.profileId, "p-renamed");
  assert.match(renamed.message, /Peut-être la même personne/);

  assert.deepEqual(
    diff.aRegler.find((i) => i.kind === "no_email")!.rows.map((r) => r.name),
    ["Email SANS"],
  );
  assert.deepEqual(
    diff.aRegler.find((i) => i.kind === "no_name")!.rows.map((r) => r.email),
    ["noname@example.com"],
  );
  assert.deepEqual(
    diff.aRegler
      .find((i) => i.kind === "invalid_email")!
      .rows.map((r) => r.rowId),
    ["r8"],
  );
}
{
  // Two unmatched accounts with the same name: no suggestion, the row is new.
  const twins = diffRoster(
    [rosterRow({ rowId: "r1", name: "Jean MARTIN", email: "jm@example.com" })],
    [
      profile({ id: "a", email: "a@example.com", display_name: "Jean MARTIN" }),
      profile({ id: "b", email: "b@example.com", display_name: "MARTIN Jean" }),
    ],
  );
  assert.equal(twins.nouveaux.length, 1);
  assert.equal(twins.absents.length, 2);
  assert.deepEqual(twins.aRegler, []);
}
{
  // An unchanged member is counted.
  const same = diffRoster(
    [
      rosterRow({
        rowId: "r1",
        name: "Marie DUPONT",
        email: "marie@example.com",
        voices: ["Alto"],
      }),
    ],
    [
      profile({
        id: "p",
        email: "marie@example.com",
        display_name: "Marie DUPONT",
        voice: "alto",
      }),
    ],
  );
  assert.deepEqual(same, {
    nouveaux: [],
    modifies: [],
    absents: [],
    aRegler: [],
    unchanged: 1,
  });
}

// --- fingerprint -------------------------------------------------------------

{
  const a = rosterFingerprint(rowsForDiff, sha256);
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.equal(rosterFingerprint(rowsForDiff, sha256), a, "stable");

  const mobileOnly = rowsForDiff.map((r, i) =>
    i === 0 ? { ...r, mobilePhone: "07 00 00 00 00" } : r,
  );
  assert.equal(
    rosterFingerprint(mobileOnly, sha256),
    a,
    "mobile phone is not synced",
  );

  const voiceOrder = rowsForDiff.map((r, i) =>
    i === 0 ? { ...r, voices: [...r.voices].reverse() } : r,
  );
  assert.equal(
    rosterFingerprint(voiceOrder, sha256),
    a,
    "voice order does not count",
  );

  const edited = rowsForDiff.map((r, i) =>
    i === 1 ? { ...r, address: "9 rue Neuve" } : r,
  );
  assert.notEqual(
    rosterFingerprint(edited, sha256),
    a,
    "an edited cell changes it",
  );

  const reordered = [...rowsForDiff].reverse();
  assert.notEqual(
    rosterFingerprint(reordered, sha256),
    a,
    "rowIds are positional",
  );
}

console.log("roster tests passed");
