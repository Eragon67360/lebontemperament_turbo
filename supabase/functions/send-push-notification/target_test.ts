import { assertEquals } from "jsr:@std/assert@1";
import { pushCondition, rehearsalGroupTopic } from "./target.ts";

Deno.test("a rehearsal reaches its group and the older apps", () => {
  assertEquals(
    pushCondition("rehearsals", { group_type: "Femmes" }),
    "'all_users' in topics || 'rehearsals_femmes' in topics",
  );
});

Deno.test("every group has a topic named after the app's enum", () => {
  assertEquals(
    [
      "Orchestre",
      "Hommes",
      "Femmes",
      "Jeunes/Enfants",
      "Choeur complet",
      "Tous",
    ].map(rehearsalGroupTopic),
    [
      "rehearsals_orchestre",
      "rehearsals_hommes",
      "rehearsals_femmes",
      "rehearsals_jeunesEnfants",
      "rehearsals_choeurComplet",
      "rehearsals_tous",
    ],
  );
});

Deno.test("a change of group also reaches the former group", () => {
  assertEquals(
    pushCondition(
      "rehearsals",
      { group_type: "Choeur complet" },
      { group_type: "Femmes" },
    ),
    "'all_users' in topics || 'rehearsals_choeurComplet' in topics || 'rehearsals_femmes' in topics",
  );
});

Deno.test("an unchanged group is named once", () => {
  assertEquals(
    pushCondition(
      "rehearsals",
      { group_type: "Hommes" },
      { group_type: "Hommes" },
    ),
    "'all_users' in topics || 'rehearsals_hommes' in topics",
  );
});

Deno.test("a rehearsal without a known group reaches every member", () => {
  for (const record of [{}, { group_type: null }, { group_type: "Autre" }]) {
    assertEquals(
      pushCondition("rehearsals", record),
      "'all_users' in topics || 'members' in topics",
    );
  }
});

Deno.test("events and concerts reach every member", () => {
  for (const table of ["events", "concerts"]) {
    assertEquals(
      pushCondition(table, { group_type: "Femmes" }),
      "'all_users' in topics || 'members' in topics",
    );
  }
});
