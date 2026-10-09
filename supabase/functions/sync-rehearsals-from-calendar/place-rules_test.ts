import { assertEquals } from "jsr:@std/assert@1";
import {
  applyPlaceRules,
  findRoom,
  matchKnownPlace,
  removeRoom,
} from "./place-rules.ts";
import type { GoogleCalendarEvent, LlmExtraction } from "./types.ts";

const base: GoogleCalendarEvent = {
  id: "evt",
  updated: "2026-10-01T10:00:00.000Z",
  summary: "Répétition",
};

const answer = (over: Partial<LlmExtraction> = {}): LlmExtraction => ({
  is_rehearsal: true,
  name: "Répétition",
  place: "Nordheim",
  address: "",
  room: "",
  group_type: "Femmes",
  ...over,
});

Deno.test("the three fixed places", () => {
  const nordheim = matchKnownPlace({ ...base, location: "Nordheim" }, "Femmes");
  assertEquals(nordheim?.place, "Salle des fêtes, Nordheim");

  const wangenSunday = matchKnownPlace(
    { ...base, location: "Wangen" },
    "Choeur complet",
  );
  assertEquals(wangenSunday?.place, "Salle des fêtes, Wangen");

  const wangenSaturday = matchKnownPlace(
    { ...base, summary: "Répétition hommes à Wangen" },
    "Hommes",
  );
  assertEquals(wangenSaturday?.place, "Freihof, Wangen");
});

Deno.test("other groups in the same village are left alone", () => {
  assertEquals(
    matchKnownPlace({ ...base, location: "Nordheim" }, "Hommes"),
    null,
  );
  assertEquals(
    matchKnownPlace({ ...base, location: "Wangen" }, "Femmes"),
    null,
  );
});

Deno.test("an admin's complete address is never overridden", () => {
  const event = { ...base, location: "3 rue des Lilas, 67520 Nordheim" };
  assertEquals(matchKnownPlace(event, "Femmes"), null);
  const result = applyPlaceRules(
    event,
    answer({ place: "Nordheim", address: "3 rue des Lilas, 67520 Nordheim" }),
  );
  assertEquals(result.address, "3 rue des Lilas, 67520 Nordheim");
});

Deno.test("accents and case do not matter", () => {
  const known = matchKnownPlace(
    { ...base, location: "CONSERVATOIRE de Strasbourg" },
    "Orchestre",
  );
  assertEquals(known?.address.includes("1 place Dauphine"), true);
});

Deno.test("rooms are found and removed", () => {
  assertEquals(findRoom("Conservatoire, salle 12"), "Salle 12");
  assertEquals(findRoom("Salle n° 104"), "Salle 104");
  assertEquals(findRoom("salle b12"), "Salle B12");
  assertEquals(findRoom("Salle des fêtes"), null);
  assertEquals(findRoom("Salle Sainte-Cécile"), null);
  assertEquals(findRoom(undefined, "rien"), null);
  assertEquals(
    removeRoom("Conservatoire de Strasbourg, salle 12"),
    "Conservatoire de Strasbourg",
  );
  assertEquals(
    removeRoom("Conservatoire de Strasbourg (Salle 12)"),
    "Conservatoire de Strasbourg",
  );
  assertEquals(removeRoom("Salle 12 - Conservatoire"), "Conservatoire");
  assertEquals(removeRoom("Salle des fêtes"), "Salle des fêtes");
});

Deno.test("the Conservatoire keeps its room out of place and address", () => {
  const event: GoogleCalendarEvent = {
    ...base,
    summary: "Répétition orchestre",
    location: "Conservatoire de Strasbourg, salle 12",
  };
  const result = applyPlaceRules(
    event,
    answer({
      place: "Conservatoire de Strasbourg, salle 12",
      address: "1 place Dauphine, 67000 Strasbourg, salle 12",
      group_type: "Orchestre",
    }),
  );
  assertEquals(result.room, "Salle 12");
  assertEquals(result.place, "Conservatoire de Strasbourg");
  assertEquals(
    result.address,
    "Conservatoire de Strasbourg, 1 place Dauphine, 67000 Strasbourg",
  );
});

Deno.test("the AI's room is kept when the text has no numbered room", () => {
  const result = applyPlaceRules(
    { ...base, location: "Église Saint-Pierre" },
    answer({ place: "Église Saint-Pierre", room: "Salle B104" }),
  );
  assertEquals(result.room, "Salle B104");
  assertEquals(result.address, "");
});

Deno.test("a concert is returned untouched", () => {
  const concert = answer({ is_rehearsal: false });
  assertEquals(
    applyPlaceRules({ ...base, location: "Nordheim" }, concert),
    concert,
  );
});
