import assert from "node:assert/strict";
import { compareMailingList, mailingListKey } from "./mailingList";
import type { RosterRow } from "./types";

// Every person here is fictional (example.com and made-up Gmail addresses).

const row = (rowId: string, name: string, email: string): RosterRow => ({
  rowId,
  name,
  email,
  emailValid: email.includes("@"),
  address: "",
  homePhone: "",
  mobilePhone: "",
  voices: [],
});

// mailingListKey
{
  assert.equal(
    mailingListKey(" Jean.Dupont@Example.com "),
    "jean.dupont@example.com",
  );
  assert.equal(mailingListKey("jean.dupont@gmail.com"), "jeandupont@gmail.com");
  assert.equal(
    mailingListKey("Jean.Dupont+chorale@GoogleMail.com"),
    "jeandupont@gmail.com",
  );
  assert.equal(
    mailingListKey("jean.dupont+x@example.com"),
    "jean.dupont+x@example.com",
    "other providers are taken as written",
  );
  assert.equal(mailingListKey(""), "");
  assert.equal(mailingListKey(null), "");
  assert.equal(mailingListKey("pas-une-adresse"), "pas-une-adresse");
}

// Both differences, matched on the key
{
  const rows = [
    row("r1", "Lucie BERNARD", "lucie.bernard@gmail.com"),
    row("r2", "Paul MARTIN", "paul.martin@example.com"),
    row("r3", "Anne PETIT", "anne.petit@example.com"),
    row("r4", "Sans ADRESSE", ""),
    row("r5", "Mauvaise ADRESSE", "pas-une-adresse"),
  ];
  const list = [
    "LucieBernard@gmail.com",
    "paul.martin@example.com",
    "ancien.membre@example.com",
    "",
  ];
  const result = compareMailingList(rows, list);
  assert.deepEqual(result.missing, [
    { name: "Anne PETIT", email: "anne.petit@example.com" },
  ]);
  assert.deepEqual(result.extra, [{ email: "ancien.membre@example.com" }]);
  assert.deepEqual(result.kept, []);
  assert.equal(result.matched, 2);
  assert.equal(result.rosterWithoutEmail, 2);
}

// Exceptions on either side are kept, not reported
{
  const rows = [
    row("r1", "Paul MARTIN", "paul.martin@example.com"),
    row("r2", "Anne PETIT", "anne.petit@example.com"),
  ];
  const list = ["Chef.Choeur@gmail.com", "ancien.membre@example.com"];
  const result = compareMailingList(rows, list, [
    { email: "chefchoeur@gmail.com", note: "Chef de chœur" },
    { email: "anne.petit@example.com", note: null },
  ]);
  assert.deepEqual(result.missing, [
    { name: "Paul MARTIN", email: "paul.martin@example.com" },
  ]);
  assert.deepEqual(result.extra, [{ email: "ancien.membre@example.com" }]);
  assert.deepEqual(result.kept, [
    { email: "anne.petit@example.com", note: null, side: "roster" },
    { email: "chef.choeur@gmail.com", note: "Chef de chœur", side: "list" },
  ]);
  assert.equal(result.matched, 0);
}

// Duplicates count once; an exception that matches both sides is not "kept"
{
  const rows = [
    row("r1", "Paul MARTIN", "paul.martin@example.com"),
    row("r2", "Paul MARTIN", "Paul.Martin@example.com"),
  ];
  const result = compareMailingList(
    rows,
    ["paul.martin@example.com", "PAUL.MARTIN@example.com"],
    [{ email: "paul.martin@example.com", note: "x" }],
  );
  assert.equal(result.matched, 1);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.extra, []);
  assert.deepEqual(result.kept, []);
}

// Sorted by name, then address
{
  const result = compareMailingList(
    [
      row("r1", "Zoé ZED", "zoe@example.com"),
      row("r2", "Élise ÉTÉ", "elise@example.com"),
      row("r3", "Adam ALPHA", "adam@example.com"),
    ],
    ["z@example.com", "a@example.com"],
  );
  assert.deepEqual(
    result.missing.map((m) => m.name),
    ["Adam ALPHA", "Élise ÉTÉ", "Zoé ZED"],
  );
  assert.deepEqual(
    result.extra.map((e) => e.email),
    ["a@example.com", "z@example.com"],
  );
}

console.log("mailing list tests passed");
