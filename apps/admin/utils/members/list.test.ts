import type { User } from "@/types/user";
import type { RosterReview } from "@repo/domain/roster/types";
import assert from "node:assert/strict";
import {
  deletionBlocker,
  filterMembers,
  firstNameOf,
  formatDayFr,
  hasFilters,
  initialsOf,
  lastSeenLabel,
  memberCountLabel,
  memberName,
  memberStatus,
  memberVoices,
  NO_FILTERS,
  pendingSyncCount,
  pendingSyncSummary,
  roleChangeBlocker,
  rosterFlags,
  shownValue,
} from "./list";

const user = (over: Partial<User>): User => ({
  id: "id",
  email: "someone@example.org",
  display_name: null,
  role: "user",
  created_at: "2026-01-13T10:00:00Z",
  invite_status: "approuvé",
  ...over,
});

// --- Names and initials ---
assert.equal(initialsOf("Lucie BERNARD"), "LB");
assert.equal(initialsOf("Jean-Pierre MARTIN"), "JM");
assert.equal(initialsOf("Inès"), "I");
assert.equal(initialsOf("  ", "zoe@example.org"), "Z");
assert.equal(initialsOf(null, ""), "?");
assert.equal(
  memberName(user({ display_name: "Lucie BERNARD" })),
  "Lucie BERNARD",
);
assert.equal(memberName(user({ email: "zoe.n@example.org" })), "zoe.n");
assert.equal(firstNameOf(user({ display_name: "Lucie BERNARD" })), "Lucie");

// --- Status and voices ---
assert.equal(memberStatus(user({ invite_status: "approuvé" })), "active");
assert.equal(memberStatus(user({ invite_status: "en attente" })), "invited");
assert.deepEqual(memberVoices(user({ voice: "Soprane & Jeune" })), [
  "Soprane",
  "Jeune",
]);
assert.deepEqual(memberVoices(user({ voice: null })), []);

// --- Dates ---
const now = new Date("2026-10-07T20:00:00Z");
assert.equal(lastSeenLabel(null, now), "jamais");
assert.equal(lastSeenLabel("not a date", now), "jamais");
assert.equal(lastSeenLabel("2026-10-07T19:59:30Z", now), "à l’instant");
assert.equal(lastSeenLabel("2026-10-07T19:45:00Z", now), "il y a 15 minutes");
assert.equal(lastSeenLabel("2026-10-07T17:00:00Z", now), "il y a 3 heures");
assert.equal(lastSeenLabel("2026-10-06T20:00:00Z", now), "hier");
assert.equal(lastSeenLabel("2026-10-04T20:00:00Z", now), "il y a 3 jours");
assert.equal(lastSeenLabel("2026-09-23T20:00:00Z", now), "il y a 2 semaines");
assert.equal(lastSeenLabel("2026-07-01T20:00:00Z", now), "il y a 3 mois");
assert.equal(lastSeenLabel("2024-09-01T20:00:00Z", now), "il y a 2 ans");
assert.equal(formatDayFr("2026-01-13T10:00:00Z"), "13 janvier 2026");
assert.equal(formatDayFr(null), "");
assert.equal(memberCountLabel(1), "1 membre");
assert.equal(memberCountLabel(127), "127 membres");
assert.equal(shownValue(""), "(vide)");
assert.equal(shownValue("Alto"), "Alto");

// --- Roster review per account ---
const review: RosterReview = {
  fingerprint: "f",
  rowCount: 3,
  validation: { errors: [], warnings: [] },
  unchanged: 1,
  groups: {
    nouveaux: [
      {
        rowId: "r3",
        email: "new@example.org",
        displayName: "Zoé NOUVEAU",
        address: "",
        homePhone: "",
        voices: ["Alto"],
      },
    ],
    modifies: [
      {
        rowId: "r1",
        profileId: "lucie",
        email: "lucie@example.org",
        displayName: "Lucie BERNARD",
        changes: [{ field: "voice", from: "Soprane", to: "Alto" }],
      },
    ],
    absents: [
      {
        profileId: "arthur",
        email: "arthur@example.org",
        displayName: "Arthur LEROY",
        role: "user",
        status: "en attente",
      },
    ],
    aRegler: [],
  },
};
const flags = rosterFlags(review);
assert.deepEqual(flags.get("lucie"), {
  absent: false,
  changes: [{ field: "voice", from: "Soprane", to: "Alto" }],
});
assert.deepEqual(flags.get("arthur"), { absent: true, changes: [] });
assert.equal(flags.get("nobody"), undefined);
assert.equal(rosterFlags(undefined).size, 0);
assert.equal(pendingSyncCount(review), 3);
assert.equal(pendingSyncCount(undefined), 0);
assert.equal(
  pendingSyncSummary(review),
  "1 nouveau membre, 1 fiche à mettre à jour, 1 personne absente de la liste",
);

// --- Filters: search ignores case and accents, sorted by name ---
const lucie = user({
  id: "lucie",
  display_name: "Lucie BERNARD",
  email: "lucie@example.org",
  voice: "Soprane & Jeune",
});
const ines = user({
  id: "ines",
  display_name: "Inès GARCIA",
  email: "ines@example.org",
  voice: "Alto",
  role: "admin",
});
const arthur = user({
  id: "arthur",
  display_name: "Arthur LEROY",
  email: "arthur@example.org",
  invite_status: "en attente",
  role: "superadmin",
});
const all = [lucie, ines, arthur];
const names = (list: User[]) => list.map((u) => u.id);

assert.deepEqual(names(filterMembers(all, NO_FILTERS)), [
  "arthur",
  "ines",
  "lucie",
]);
assert.deepEqual(names(filterMembers(all, { ...NO_FILTERS, query: "INES" })), [
  "ines",
]);
assert.deepEqual(
  names(filterMembers(all, { ...NO_FILTERS, query: "lucie@" })),
  ["lucie"],
);
assert.deepEqual(names(filterMembers(all, { ...NO_FILTERS, voice: "Jeune" })), [
  "lucie",
]);
assert.deepEqual(
  names(filterMembers(all, { ...NO_FILTERS, status: "invited" })),
  ["arthur"],
);
assert.deepEqual(
  names(filterMembers(all, { ...NO_FILTERS, status: "active" })),
  ["ines", "lucie"],
);
// Administrators include super-administrators.
assert.deepEqual(names(filterMembers(all, { ...NO_FILTERS, role: "admin" })), [
  "arthur",
  "ines",
]);
assert.deepEqual(names(filterMembers(all, { ...NO_FILTERS, role: "user" })), [
  "lucie",
]);
assert.deepEqual(
  names(filterMembers(all, { ...NO_FILTERS, status: "differs" }, flags)),
  ["lucie"],
);
assert.deepEqual(
  names(filterMembers(all, { ...NO_FILTERS, status: "absent" }, flags)),
  ["arthur"],
);
assert.equal(hasFilters(NO_FILTERS), false);
assert.equal(hasFilters({ ...NO_FILTERS, query: "  " }), false);
assert.equal(hasFilters({ ...NO_FILTERS, voice: "Alto" }), true);

// --- Who may do what (the API enforces the same in utils/access.ts) ---
const me = { id: "me", role: "admin" as const };
const boss = { id: "boss", role: "superadmin" as const };
assert.match(
  roleChangeBlocker(me, { id: "me", role: "admin" }) ?? "",
  /propre/,
);
assert.match(
  roleChangeBlocker(me, { id: "x", role: "superadmin" }) ?? "",
  /super-administrateur/,
);
assert.equal(roleChangeBlocker(me, { id: "x", role: "user" }), null);
assert.equal(roleChangeBlocker(boss, { id: "x", role: "superadmin" }), null);
assert.equal(
  deletionBlocker(me, { id: "x" }),
  "Réservé aux super-administrateurs.",
);
assert.match(deletionBlocker(boss, { id: "boss" }) ?? "", /propre/);
assert.equal(deletionBlocker(boss, { id: "x" }), null);

console.log("members/list: ok");
