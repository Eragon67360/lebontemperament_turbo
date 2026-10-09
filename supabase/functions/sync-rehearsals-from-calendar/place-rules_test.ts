import { assertEquals } from "jsr:@std/assert@1";
import {
  applyPlaceRules,
  calendarLocation,
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
  assertEquals(
    wangenSunday?.address,
    "Salle des fêtes, 31A rue des Vignes, 67520 Wangen",
  );

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

Deno.test(
  "a « Dimanche BT » without a location is at the Wangen salle des fêtes",
  () => {
    const sunday = { ...base, summary: "Dimanche BT" };
    assertEquals(
      matchKnownPlace(sunday, "Choeur complet")?.address,
      "Salle des fêtes, 31A rue des Vignes, 67520 Wangen",
    );
    const result = applyPlaceRules(
      sunday,
      answer({
        name: "Dimanche BT",
        place: "À confirmer",
        group_type: "Choeur complet",
      }),
    );
    assertEquals(result.place, "Salle des fêtes, Wangen");
  },
);

Deno.test(
  "an elsewhere « Dimanche BT » and an extra rehearsal are left alone",
  () => {
    // Another named place, or a full address: the admin's choice stands.
    assertEquals(
      matchKnownPlace(
        { ...base, summary: "Dimanche BT", location: "Église Saint-Pierre" },
        "Choeur complet",
      ),
      null,
    );
    assertEquals(
      matchKnownPlace(
        {
          ...base,
          summary: "Dimanche BT",
          location: "Reinacker, 67440 Reutenbourg, France",
        },
        "Choeur complet",
      ),
      null,
    );
    // An extra rehearsal with no place stays « À confirmer » for the admins.
    assertEquals(
      matchKnownPlace(
        { ...base, summary: "Répétition extra" },
        "Choeur complet",
      ),
      null,
    );
  },
);

Deno.test(
  "the known place written back into the calendar is recognised again",
  () => {
    const written = {
      ...base,
      summary: "Répétition orchestre",
      location:
        "Conservatoire de Strasbourg, 1 place Dauphine, 67000 Strasbourg, Salle 12",
    };
    const settled = applyPlaceRules(
      written,
      answer({
        place: "Conservatoire",
        address: "1 place Dauphine",
        group_type: "Orchestre",
      }),
    );
    assertEquals(settled.place, "Conservatoire de Strasbourg");
    assertEquals(settled.room, "Salle 12");
    // Nothing left to write: the calendar already says it.
    assertEquals(calendarLocation(written, settled), null);
  },
);

Deno.test("the calendar location is only written for a known place", () => {
  const sunday = { ...base, summary: "Dimanche BT" };
  const settled = applyPlaceRules(
    sunday,
    answer({
      name: "Dimanche BT",
      place: "À confirmer",
      group_type: "Choeur complet",
    }),
  );
  assertEquals(
    calendarLocation(sunday, settled),
    "Salle des fêtes, 31A rue des Vignes, 67520 Wangen",
  );

  // Village only: the full address replaces it; the room comes along.
  const village = {
    ...base,
    location: "Nordheim",
    summary: "Répétition femmes",
  };
  assertEquals(
    calendarLocation(village, applyPlaceRules(village, answer())),
    "Salle des fêtes, place de la Mairie, 67520 Nordheim",
  );
  const withRoom = {
    ...base,
    location: "Conservatoire de Strasbourg, salle 12",
    summary: "Répétition orchestre",
  };
  assertEquals(
    calendarLocation(
      withRoom,
      applyPlaceRules(withRoom, answer({ group_type: "Orchestre" })),
    ),
    "Conservatoire de Strasbourg, 1 place Dauphine, 67000 Strasbourg, Salle 12",
  );

  // Never for an admin's own address, an unknown place, an extra with no
  // place, or something that is not a rehearsal.
  const own = { ...base, location: "3 rue des Lilas, 67520 Nordheim" };
  assertEquals(calendarLocation(own, applyPlaceRules(own, answer())), null);
  const extra = { ...base, summary: "Répétition extra" };
  assertEquals(
    calendarLocation(
      extra,
      applyPlaceRules(
        extra,
        answer({ place: "À confirmer", group_type: "Choeur complet" }),
      ),
    ),
    null,
  );
  assertEquals(calendarLocation(sunday, answer({ is_rehearsal: false })), null);
});

Deno.test(
  "a complete address of the admin's is not replaced by a known place the AI picked",
  () => {
    const reutenbourg = {
      ...base,
      summary: "Dimanche BT",
      location: "Reinacker, 67440 Reutenbourg, France",
    };
    // The AI read « Dimanche BT » in its prompt and answered the Wangen hall.
    const aiAnswer = answer({
      name: "Dimanche BT",
      place: "Salle des fêtes, Wangen",
      address: "Salle des fêtes, 31A rue des Vignes, 67520 Wangen",
      group_type: "Choeur complet",
    });
    const settled = applyPlaceRules(reutenbourg, aiAnswer);
    assertEquals(settled.place, "Reinacker, 67440 Reutenbourg, France");
    assertEquals(settled.address, "Reinacker, 67440 Reutenbourg, France");
    // And nothing is written into Google, even for the unsettled answer.
    assertEquals(calendarLocation(reutenbourg, aiAnswer), null);
    assertEquals(calendarLocation(reutenbourg, settled), null);
  },
);
