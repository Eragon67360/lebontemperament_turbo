// Run with: npx tsx lib/memberData.test.ts
//
// « Télécharger mes données » (#354) must never return someone else's data:
// every query the export runs is filtered on the signed-in member's id (or on
// the ids of their own reports), and nothing the export copies names another
// person.
import type { SupabaseClient, User } from "@supabase/supabase-js";
import assert from "node:assert/strict";
import { collectMemberData, exportFileName } from "./memberData";

const ME = "11111111-1111-4111-8111-111111111111";
const ADMIN = "22222222-2222-4222-8222-222222222222";
const MY_REPORT = "33333333-3333-4333-8333-333333333333";
const OTHER_REPORT = "44444444-4444-4444-8444-444444444444";

type Filter = { op: "eq" | "in"; column: string; value: unknown };
type Call = { table: string; columns: string; filters: Filter[] };

/** Rows each table returns, whatever the filters (the fake is dumb on purpose). */
const DATA: Record<string, Record<string, unknown>[]> = {
  profiles: [{ id: ME, display_name: "Alice MARTIN", voice: "Alto" }],
  bug_reports: [{ id: MY_REPORT, title: "Écran blanc" }],
  bug_messages: [
    { bug_report_id: MY_REPORT, sender_id: ME, message: "Bonjour" },
    { bug_report_id: MY_REPORT, sender_id: ADMIN, message: "Merci !" },
    { bug_report_id: OTHER_REPORT, sender_id: ME, message: "Réponse" },
  ],
  push_devices: [{ platform: "ios" }],
};

function fakeClient(calls: Call[], failing = new Set<string>()) {
  return {
    from(table: string) {
      const call: Call = { table, columns: "", filters: [] };
      calls.push(call);
      const result = () =>
        failing.has(table)
          ? { data: null, error: { message: "boom" } }
          : {
              data:
                table === "profiles" ? DATA.profiles![0] : (DATA[table] ?? []),
              error: null,
            };
      const builder = {
        select(columns: string) {
          call.columns = columns;
          return builder;
        },
        eq(column: string, value: unknown) {
          call.filters.push({ op: "eq", column, value });
          return builder;
        },
        in(column: string, value: unknown) {
          call.filters.push({ op: "in", column, value });
          return builder;
        },
        order() {
          return builder;
        },
        maybeSingle() {
          return builder;
        },
        then<T>(resolve: (value: ReturnType<typeof result>) => T) {
          return Promise.resolve(result()).then(resolve);
        },
      };
      return builder;
    },
  } as unknown as SupabaseClient;
}

const user = {
  id: ME,
  email: "alice@example.org",
  phone: "",
  created_at: "2025-01-01T00:00:00Z",
  last_sign_in_at: "2026-10-01T00:00:00Z",
  app_metadata: { providers: ["google"] },
  user_metadata: { full_name: "Alice Martin", avatar_url: "https://x/y.png" },
  aud: "authenticated",
} as unknown as User;

const now = new Date("2026-10-09T06:00:00Z");

{
  const calls: Call[] = [];
  const data = await collectMemberData(
    fakeClient(calls),
    user,
    "contact@example.org",
    now,
  );

  // Every query is filtered, and only on the member's id or their reports.
  assert.ok(
    calls.length >= 14,
    `expected every table to be read, got ${calls.length}`,
  );
  for (const call of calls) {
    assert.ok(
      call.filters.length > 0,
      `${call.table} is read without a filter`,
    );
    for (const filter of call.filters) {
      if (filter.op === "eq") {
        assert.equal(
          filter.value,
          ME,
          `${call.table}.${filter.column} filtered on another id`,
        );
      } else {
        assert.equal(
          filter.column,
          "bug_report_id",
          `${call.table} filtered with in() on ${filter.column}`,
        );
        assert.deepEqual(
          filter.value,
          [MY_REPORT],
          "the conversation is read for the member's own reports only",
        );
      }
    }
  }

  // The phone's notification token is never selected.
  const devices = calls.find((call) => call.table === "push_devices");
  assert.ok(
    devices && !devices.columns.includes("token"),
    "push token exported",
  );

  // The administrators who answered stay anonymous.
  const conversation = data.messages_des_signalements;
  assert.ok(Array.isArray(conversation));
  assert.ok(
    !JSON.stringify(data).includes(ADMIN),
    "an administrator's id is exported",
  );
  assert.deepEqual(
    conversation.map((message) => message.auteur),
    ["vous", "l’association", "vous"].slice(0, conversation.length),
  );

  // Messages the member wrote in someone else's report are listed apart.
  assert.deepEqual(data.messages_envoyes_dans_d_autres_signalements, [
    { bug_report_id: OTHER_REPORT, sender_id: ME, message: "Réponse" },
  ]);

  assert.equal(data.compte.email, "alice@example.org");
  assert.deepEqual(data.compte.modes_de_connexion, ["google"]);
  assert.equal(data.export.genere_le, "2026-10-09T06:00:00.000Z");
  assert.equal(data.export.contact, "contact@example.org");
  assert.equal(
    exportFileName(now),
    "mes-donnees-le-bon-temperament-2026-10-09.json",
  );
}

{
  // A table that fails says so instead of breaking the whole export.
  const calls: Call[] = [];
  const data = await collectMemberData(
    fakeClient(calls, new Set(["notifications", "profiles"])),
    user,
    "contact@example.org",
    now,
  );
  assert.deepEqual(data.notifications, { erreur: "Lecture impossible" });
  assert.equal(data.profil, null);
  assert.ok(Array.isArray(data.signalements));
}

console.log("memberData: ok");
