// Run with: npx tsx lib/membres/membres.test.ts
// Fake names only: the repository is public.
import type { MemberRehearsal } from "@/lib/publicConcerts";
import assert from "node:assert/strict";
import {
  groupByLastName,
  hasVoice,
  lastNameOf,
  matchesSearch,
  type Member,
} from "./directory";
import {
  formatTimeRange,
  hasDirections,
  mapsUrl,
  placeLine,
  upcomingRehearsals,
  whenLabel,
} from "./rehearsals";
import {
  groupsForVoice,
  mainVoice,
  scoreFolderFor,
  voiceKeys,
  voicesLabel,
} from "./voices";

const member = (name: string, voice = "Alte"): Member => ({
  "NOM Prénom": name,
  "Adresse mail": "member@example.com",
  Voix: voice,
});

// Family names are the trailing capitals of « Prénom NOM ».
assert.equal(lastNameOf("Anne-Sophie KLEIN"), "KLEIN");
assert.equal(lastNameOf("Jean DE LA FONTAINE"), "DE LA FONTAINE");
assert.equal(lastNameOf("Claire Martin"), "Martin");

// Sorted and grouped by family name, accents ignored.
const groups = groupByLastName([
  member("Zoé ÉTIENNE"),
  member("Paul MEYER"),
  member("Claire MARTIN"),
  member("Hugo BAUER"),
]);
assert.deepEqual(
  groups.map((g) => [g.letter, g.members.map((m) => m["NOM Prénom"])]),
  [
    ["B", ["Hugo BAUER"]],
    ["E", ["Zoé ÉTIENNE"]],
    ["M", ["Claire MARTIN", "Paul MEYER"]],
  ],
);

// Voice filter matches whole words: « alte » is not found in « altesse ».
assert.ok(hasVoice(member("A B", "Jeune & ténor"), "tenor"));
assert.ok(!hasVoice(member("A B", "Altesse"), "alte"));

// Search ignores accents and case, across words.
assert.ok(matchesSearch(member("Élise SCHMITT"), "elise schm"));
assert.ok(!matchesSearch(member("Élise SCHMITT"), "weber"));
// Ligatures fold too: « loeb » finds « LŒB » and the other way round.
assert.ok(matchesSearch(member("Noé LŒB"), "loeb"));
assert.ok(matchesSearch(member("Noé LOEB"), "lœb"));

const rehearsal = (over: Partial<MemberRehearsal>): MemberRehearsal => ({
  id: "r",
  name: "Femmes",
  date: "2026-10-21",
  start_time: "20:00:00",
  end_time: "22:00:00",
  place: "Salle des fêtes",
  room: null,
  address: null,
  group_type: "Femmes",
  ...over,
});

// The place line carries the street address, and so does the map search.
const withAddress = rehearsal({ address: "1 rue de l'Exemple, 67000 Ville" });
assert.equal(
  placeLine(withAddress),
  "Salle des fêtes, 1 rue de l'Exemple, 67000 Ville",
);
assert.ok(
  mapsUrl(withAddress).endsWith(
    encodeURIComponent("Salle des fêtes, 1 rue de l'Exemple, 67000 Ville"),
  ),
);
assert.equal(
  placeLine(rehearsal({ place: "Conservatoire", room: "Salle 12" })),
  "Conservatoire, Salle 12",
);

// No itinerary for a place still to be confirmed.
assert.ok(hasDirections(withAddress));
assert.ok(!hasDirections(rehearsal({ place: "À confirmer" })));

// Times and countdown read in plain French.
assert.equal(formatTimeRange("09:30:00", "16:30:00"), "De 9 h 30 à 16 h 30");
const today = new Date(2026, 9, 11);
assert.equal(whenLabel(new Date(2026, 9, 11), today), "Aujourd’hui");
assert.equal(whenLabel(new Date(2026, 9, 12), today), "Demain");
assert.equal(whenLabel(new Date(2026, 9, 18), today), "Dans 7 jours");

// Past rehearsals are dropped, the rest sorted by day then time.
assert.deepEqual(
  upcomingRehearsals(
    [
      rehearsal({ id: "late", date: "2026-10-12", start_time: "20:00:00" }),
      rehearsal({ id: "past", date: "2026-10-10" }),
      rehearsal({ id: "early", date: "2026-10-12", start_time: "09:00:00" }),
    ],
    today,
  ).map((r) => r.id),
  ["early", "late"],
);

// Voices are free text: words are read whatever the case, accents or order,
// choir voices first.
assert.deepEqual(voiceKeys("Alte"), ["alte"]);
assert.deepEqual(voiceKeys("Orchestre & Ténor"), ["tenor", "orchestre"]);
assert.deepEqual(voiceKeys("jeune & basse"), ["basse", "jeune"]);
assert.deepEqual(voiceKeys("SOPRANO"), ["soprane"]);
assert.deepEqual(voiceKeys("Chef de chœur"), []);
assert.deepEqual(voiceKeys(null), []);
assert.equal(mainVoice("Orchestre & Alte"), "alte");
assert.equal(mainVoice("Orchestre"), "orchestre");
assert.equal(mainVoice(""), null);
assert.equal(voicesLabel("Orchestre & Alte"), "Altes · Orchestre");

// The groups that concern a member mirror the app's `groupsConcerning`.
const groupsOf = (voice: string | null) => {
  const set = groupsForVoice(voice);
  return set === null ? null : [...set].sort();
};
assert.deepEqual(groupsOf("Alte"), ["Choeur complet", "Femmes", "Tous"]);
assert.deepEqual(groupsOf("Basse"), ["Choeur complet", "Hommes", "Tous"]);
assert.deepEqual(groupsOf("Orchestre"), ["Orchestre", "Tous"]);
assert.deepEqual(groupsOf("Orchestre & Ténor"), [
  "Choeur complet",
  "Hommes",
  "Orchestre",
  "Tous",
]);
assert.deepEqual(groupsOf("jeune"), ["Jeunes/Enfants", "Tous"]);
// Unknown voice: every rehearsal concerns them.
assert.equal(groupsForVoice("Chef de chœur"), null);
assert.equal(groupsForVoice(null), null);

// The score folder the home opens.
assert.equal(scoreFolderFor("Soprane"), "adultes");
assert.equal(scoreFolderFor("Orchestre"), "orchestre");
assert.equal(scoreFolderFor("Orchestre & Basse"), "adultes");
assert.equal(scoreFolderFor("jeune & alte"), "jeunes");
assert.equal(scoreFolderFor(""), null);

console.log("membres helpers: all assertions passed");
