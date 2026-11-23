import { assertEquals } from "jsr:@std/assert@1";
import {
  audienceFromBody,
  eventGroupIds,
  groupPushTitle,
  planGroupPushes,
  pushCondition,
  rehearsalGroupTopic,
} from "./target.ts";

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

// --- Events reserved for member groups ---------------------------------------

const CA = "11111111-1111-4111-8111-111111111111";
const CONCERTS = "22222222-2222-4222-8222-222222222222";

Deno.test("the trigger's audience keeps well-formed ids only", () => {
  assertEquals(audienceFromBody([CA, "x", 3, null]), [CA]);
  assertEquals(audienceFromBody(undefined), []);
  assertEquals(audienceFromBody("not a list"), []);
});

Deno.test("an event with no group anywhere goes to the topics", () => {
  assertEquals(eventGroupIds([], []), []);
  assertEquals(eventGroupIds([], null), []);
});

Deno.test("either read is enough to keep a group event off the topics", () => {
  // INSERT: the audience is written after the row, the trigger saw none.
  assertEquals(eventGroupIds([], [CA]), [CA]);
  // DELETE: the rows went with the event, the trigger read them before.
  assertEquals(eventGroupIds([CA], null), [CA]);
  // The event moved from the CA to the CA and a commission.
  assertEquals(eventGroupIds([CA], [CONCERTS, CA]), [CA, CONCERTS].sort());
});

Deno.test("the title names the groups first", () => {
  assertEquals(
    groupPushTitle(["Conseil d'administration"], "Nouvel événement"),
    "Conseil d'administration · Nouvel événement",
  );
  assertEquals(
    groupPushTitle(["Commission concerts", "Bureau"], "Événement modifié"),
    "Bureau, Commission concerts · Événement modifié",
  );
  assertEquals(
    groupPushTitle([""], "Événement supprimé"),
    "Événement supprimé",
  );
});

Deno.test(
  "only the devices of the groups' members are pushed, once each",
  () => {
    const pushes = planGroupPushes({
      groupIds: [CA, CONCERTS],
      groupNames: {
        [CA]: "Conseil d'administration",
        [CONCERTS]: "Commission concerts",
      },
      memberships: [
        { group_id: CA, profile_id: "claire" },
        { group_id: CONCERTS, profile_id: "claire" },
        { group_id: CONCERTS, profile_id: "nadia" },
        // A group outside the audience gives nothing.
        {
          group_id: "33333333-3333-4333-8333-333333333333",
          profile_id: "marc",
        },
      ],
      devices: [
        { token: "t-claire-phone", user_id: "claire" },
        { token: "t-claire-tablet", user_id: "claire" },
        { token: "t-nadia", user_id: "nadia" },
        { token: "t-marc", user_id: "marc" },
        { token: "t-nadia", user_id: "nadia" },
      ],
      title: "Nouvel événement",
    });
    assertEquals(pushes, [
      {
        token: "t-claire-phone",
        title:
          "Commission concerts, Conseil d'administration · Nouvel événement",
      },
      {
        token: "t-claire-tablet",
        title:
          "Commission concerts, Conseil d'administration · Nouvel événement",
      },
      { token: "t-nadia", title: "Commission concerts · Nouvel événement" },
    ]);
  },
);

Deno.test("a group with no member's device pushes nobody", () => {
  assertEquals(
    planGroupPushes({
      groupIds: [CA],
      groupNames: { [CA]: "Conseil d'administration" },
      memberships: [{ group_id: CA, profile_id: "claire" }],
      devices: [{ token: "t-marc", user_id: "marc" }],
      title: "Nouvel événement",
    }),
    [],
  );
});
