import assert from "node:assert/strict";
import { rehearsalFormSchema } from "../formSchemas";
import {
  eventCountLabel,
  eventPeriodLabel,
  eventTypeLabel,
  formatLongDateFr,
  isUpcomingEvent,
  recurrenceDates,
  rehearsalCountLabel,
  splitEvents,
  splitRehearsals,
  timeRangeFr,
  todayIso,
  toEventPayload,
  toRehearsalPayloads,
} from "./schedule";

// --- todayIso is the concerts page's: the local day ---
assert.equal(todayIso(new Date(2026, 9, 4, 0, 30)), "2026-10-04");

// --- Rehearsals: today stays upcoming; soonest first, past most recent first ---
{
  const r = (id: string, date: string, start_time = "19:00:00") => ({
    id,
    date,
    start_time,
  });
  const { upcoming, past } = splitRehearsals(
    [
      r("late", "2026-12-01"),
      r("yesterday", "2026-10-03"),
      r("today-evening", "2026-10-04", "20:00:00"),
      r("today-morning", "2026-10-04", "10:00:00"),
      r("old", "2025-06-15"),
      r("soon", "2026-10-10"),
    ],
    "2026-10-04",
  );
  assert.deepEqual(
    upcoming.map((x) => x.id),
    ["today-morning", "today-evening", "soon", "late"],
  );
  assert.deepEqual(
    past.map((x) => x.id),
    ["yesterday", "old"],
  );
}

// --- Events: judged on the last day, like the previous page ---
{
  const today = "2026-10-04";
  assert.equal(
    isUpcomingEvent(
      { id: "e", date_from: "2026-10-01", date_to: "2026-10-04" },
      today,
    ),
    true,
    "an event ending today is still upcoming",
  );
  assert.equal(
    isUpcomingEvent(
      { id: "e", date_from: "2026-10-01", date_to: "2026-10-03" },
      today,
    ),
    false,
  );
  assert.equal(
    isUpcomingEvent({ id: "e", date_from: "2026-10-03", date_to: null }, today),
    false,
  );
  assert.equal(isUpcomingEvent({ id: "e", date_from: today }, today), true);

  const { upcoming, past } = splitEvents(
    [
      { id: "b", date_from: "2026-11-01", time: "10:00:00" },
      { id: "ongoing", date_from: "2026-09-28", date_to: "2026-10-06" },
      { id: "old", date_from: "2025-08-14", date_to: "2025-09-28" },
      { id: "a", date_from: "2026-10-20" },
      { id: "yesterday", date_from: "2026-10-03" },
    ],
    today,
  );
  assert.deepEqual(
    upcoming.map((e) => e.id),
    ["ongoing", "a", "b"],
  );
  assert.deepEqual(
    past.map((e) => e.id),
    ["yesterday", "old"],
  );
}

// --- Recurrence: first day included, last day included, nothing when inverted ---
{
  const dates = recurrenceDates(
    new Date(2026, 9, 6),
    1,
    new Date(2026, 9, 27, 23, 0),
  );
  assert.deepEqual(
    dates.map((d) => d.getDate()),
    [6, 13, 20, 27],
  );
  assert.equal(
    recurrenceDates(new Date(2026, 9, 6), 2, new Date(2026, 10, 3)).length,
    3,
    "every two weeks: 6, 20 oct., 3 nov.",
  );
  assert.deepEqual(
    recurrenceDates(new Date(2026, 9, 6), 1, new Date(2026, 9, 5)),
    [],
  );
  assert.deepEqual(
    recurrenceDates(new Date(2026, 9, 6), 0, new Date(2027, 0, 1)),
    [],
  );
}

// --- Payloads: exactly the fields the previous forms sent ---
{
  const values = rehearsalFormSchema.parse({
    name: "Répétition générale",
    group_type: "Tous",
    date: new Date(2026, 9, 6),
    place: "Salle des fêtes",
    start_time: "19:00",
    end_time: "21:30",
    repeat: false,
    repeat_interval: "1",
    repeat_until: undefined,
  });
  assert.deepEqual(toRehearsalPayloads(values), [
    {
      name: "Répétition générale",
      place: "Salle des fêtes",
      start_time: "19:00",
      end_time: "21:30",
      group_type: "Tous",
      date: "2026-10-06",
    },
  ]);
  const repeated = toRehearsalPayloads({
    ...values,
    repeat: true,
    repeat_interval: 2,
    repeat_until: new Date(2026, 10, 3),
  });
  assert.deepEqual(
    repeated.map((r) => r.date),
    ["2026-10-06", "2026-10-20", "2026-11-03"],
  );
  assert.deepEqual(Object.keys(repeated[0]!).sort(), [
    "date",
    "end_time",
    "group_type",
    "name",
    "place",
    "start_time",
  ]);
}
{
  const base = {
    title: "Week-end chantant",
    date_from: new Date(2026, 9, 10),
    date_to: undefined,
    time: "09:30",
    location: "Mittelbergheim",
    responsible_name: "Anne",
    responsible_email: "",
    event_type: "sejour" as const,
    link: "",
    description: "",
    is_public: false,
  };
  assert.deepEqual(toEventPayload(base), {
    title: "Week-end chantant",
    date_from: "2026-10-10",
    date_to: null,
    time: "09:30",
    location: "Mittelbergheim",
    responsible_name: "Anne",
    responsible_email: null,
    event_type: "sejour",
    description: null,
    link: null,
    is_public: false,
  });
  const edited = toEventPayload(
    {
      ...base,
      date_to: new Date(2026, 9, 11),
      responsible_email: "anne@example.org",
      link: "https://example.org",
      description: "Apportez vos partitions.",
      is_public: true,
    },
    "evt-1",
  );
  assert.equal(edited.id, "evt-1");
  assert.equal(edited.date_to, "2026-10-11");
  assert.equal(edited.responsible_email, "anne@example.org");
  assert.equal(edited.link, "https://example.org");
  assert.equal(edited.description, "Apportez vos partitions.");
  assert.equal(edited.is_public, true);
}

// --- The rehearsal schema: the two added rules ---
{
  const valid = {
    name: "Pupitres",
    group_type: "Femmes",
    date: new Date(2026, 9, 6),
    place: "Salle",
    start_time: "19:00",
    end_time: "21:00",
    repeat: false,
    repeat_interval: "1",
  };
  assert.ok(rehearsalFormSchema.safeParse(valid).success);
  const errorsOf = (input: unknown) => {
    const result = rehearsalFormSchema.safeParse(input);
    assert.ok(!result.success, "expected a validation error");
    return Object.fromEntries(
      result.error.issues.map((i) => [i.path.join("."), i.message]),
    );
  };
  assert.equal(
    errorsOf({ ...valid, end_time: "18:00" }).end_time,
    "La fin doit être après le début",
  );
  assert.equal(
    errorsOf({ ...valid, repeat: true }).repeat_until,
    "Indiquez jusqu'à quand répéter la séance",
  );
  assert.match(
    errorsOf({ ...valid, repeat: true, repeat_until: new Date(2026, 9, 5) })
      .repeat_until!,
    /première séance/,
  );
  assert.ok(
    rehearsalFormSchema.safeParse({
      ...valid,
      repeat: true,
      repeat_until: new Date(2026, 9, 6, 12),
    }).success,
    "the first day itself is a valid end",
  );
  assert.equal(
    errorsOf({ ...valid, repeat: true, repeat_interval: "0" }).repeat_interval,
    "Au moins une semaine",
  );
  assert.equal(
    rehearsalFormSchema.parse({ ...valid, repeat_interval: "3" })
      .repeat_interval,
    3,
  );
  assert.equal(errorsOf({ ...valid, name: "" }).name, "L'intitulé est requis");
  assert.equal(
    errorsOf({ ...valid, group_type: "Solistes" }).group_type,
    "Le groupe est requis",
  );
}

// --- Wording ---
assert.equal(eventTypeLabel("sejour"), "Séjour");
assert.equal(eventTypeLabel(null), "Autre");
assert.equal(formatLongDateFr("2026-10-06"), "Mardi 6 octobre 2026");
assert.equal(timeRangeFr("19:00:00", "21:30:00"), "19 h – 21 h 30");
assert.equal(timeRangeFr("19:00:00", ""), "19 h");
assert.equal(
  eventPeriodLabel({ date_from: "2026-08-14" }),
  "Vendredi 14 août 2026",
);
assert.equal(
  eventPeriodLabel({ date_from: "2026-08-14", date_to: "2026-08-14" }),
  "Vendredi 14 août 2026",
);
assert.equal(
  eventPeriodLabel({ date_from: "2026-08-14", date_to: "2026-08-16" }),
  "Du 14 au 16 août 2026",
);
assert.equal(
  eventPeriodLabel({ date_from: "2026-08-30", date_to: "2026-09-02" }),
  "Du 30 août au 2 septembre 2026",
);
assert.equal(
  eventPeriodLabel({ date_from: "2026-12-30", date_to: "2027-01-02" }),
  "Du 30 déc. 2026 au 2 janv. 2027",
);
assert.equal(rehearsalCountLabel(0), "Aucune répétition");
assert.equal(rehearsalCountLabel(1), "1 répétition");
assert.equal(rehearsalCountLabel(4), "4 répétitions");
assert.equal(eventCountLabel(0), "Aucun événement");
assert.equal(eventCountLabel(2), "2 événements");

console.log("season/schedule: all assertions passed");
