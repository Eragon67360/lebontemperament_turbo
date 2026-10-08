// Run: npx -y deno test --node-modules-dir=none supabase/functions/notify-bug-report/
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  CHANNEL_ID,
  personName,
  planNewMessage,
  planNewReport,
  shortTitle,
  type Person,
  type Report,
} from "./plan.ts";

const AUTHOR = "aaaaaaaa-0000-0000-0000-000000000001";
const SUPER = "dddddddd-0000-0000-0000-000000000004";

const report: Report = {
  id: "11111111-0000-0000-0000-000000000001",
  title: "Le lecteur s'arrête",
  reported_by: AUTHOR,
};
const alice: Person = {
  id: AUTHOR,
  display_name: "Alice Test",
  email: "alice@example.com",
};
const sam: Person = {
  id: SUPER,
  display_name: "Sam Test",
  email: "sam@example.com",
};

Deno.test("a new report goes to the superadmins, not its author", () => {
  const p = planNewReport(report, alice);
  assertEquals(p.audience, { kind: "superadmins", except: AUTHOR });
  assertEquals(p.message.title, "Nouveau signalement");
  assertEquals(p.message.body, "Alice Test : Le lecteur s'arrête");
  assertEquals(p.message.data, { type: "report", id: report.id });
  assertEquals(p.message.channelId, CHANNEL_ID);
});

Deno.test("a superadmin's answer goes to the author, as its own push", () => {
  const p = planNewMessage(
    report,
    { id: "m1", bug_report_id: report.id, sender_id: SUPER },
    sam,
  );
  assertEquals(p.audience, { kind: "member", userId: AUTHOR });
  assertEquals(p.message.title, "Réponse à votre signalement");
  assertEquals(
    p.message.body,
    "Sam Test vous a répondu sur « Le lecteur s'arrête »",
  );
  assertEquals(p.message.data, { type: "report", id: report.id });
  // Not the same tag as the report's own push, so it never replaces it.
  assertEquals(p.message.tag, `report-reply-${report.id}`);
});

Deno.test("the author's answer goes back to the superadmins", () => {
  const p = planNewMessage(
    report,
    { id: "m2", bug_report_id: report.id, sender_id: AUTHOR },
    alice,
  );
  assertEquals(p.audience, { kind: "superadmins", except: AUTHOR });
  assertEquals(p.message.title, "Nouveau message sur un signalement");
  assertEquals(
    p.message.body,
    "Alice Test a répondu sur « Le lecteur s'arrête »",
  );
});

Deno.test("names fall back to the e-mail, then « Un membre »", () => {
  assertEquals(personName(alice), "Alice Test");
  assertEquals(
    personName({ id: "x", display_name: "  ", email: "bob@example.com" }),
    "bob",
  );
  assertEquals(
    personName({ id: "x", display_name: null, email: null }),
    "Un membre",
  );
  assertEquals(personName(null), "Un membre");
});

Deno.test("long titles are cut to 80 characters with an ellipsis", () => {
  const t = shortTitle("a".repeat(120));
  assertEquals(t.length, 80);
  assert(t.endsWith("…"));
  assertEquals(shortTitle("  deux   mots \n"), "deux mots");
});
