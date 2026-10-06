// Run: npx -y deno test --node-modules-dir=none supabase/functions/check-ops-alerts/
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  decide,
  evaluate,
  markNotified,
  message,
  type DbFacts,
  type Finding,
  type SiteProbe,
  type StoredAlert,
} from "./checks.ts";

const NOW = new Date("2026-10-07T08:07:00Z");
const hoursAgo = (h: number) =>
  new Date(NOW.getTime() - h * 3_600_000).toISOString();
const minutesAgo = (m: number) =>
  new Date(NOW.getTime() - m * 60_000).toISOString();

const healthyFacts = (): DbFacts => ({
  rehearsal_sync: {
    started_at: hoursAgo(3),
    finished_at: hoursAgo(3),
    status: "success",
    error_count: 0,
  },
  drive_sync: {
    started_at: hoursAgo(6),
    finished_at: hoursAgo(6),
    status: "success",
    error: null,
  },
  cron_failures: [],
  http_failures: { count: 0, codes: [] },
});

const up = (url: string): SiteProbe => ({ url, status: 200 });
const healthySites = () => ({
  website: up("https://www.lebontemperament.com/"),
  admin: up("https://admin.lebontemperament.com/auth/login"),
});

function find(findings: Finding[], key: string): Finding {
  const f = findings.find((x) => x.key === key);
  assert(f, `no finding for ${key}`);
  return f;
}

Deno.test("healthy production: one finding per check, none firing", () => {
  const findings = evaluate(healthyFacts(), healthySites(), NOW, 30);
  assertEquals(findings.map((f) => f.key).sort(), [
    "admin",
    "cron_jobs",
    "drive_sync",
    "function_calls",
    "rehearsal_sync",
    "website",
  ]);
  assertEquals(
    findings.filter((f) => f.firing),
    [],
  );
});

Deno.test("rehearsal sync: failed, partial, stale, stuck, never ran", () => {
  const facts = healthyFacts();
  facts.rehearsal_sync!.status = "failed";
  let f = find(evaluate(facts, healthySites(), NOW, 30), "rehearsal_sync");
  assert(f.firing);
  assertEquals(f.title, "Synchro des répétitions en échec");

  facts.rehearsal_sync!.status = "partial";
  facts.rehearsal_sync!.error_count = 2;
  f = find(evaluate(facts, healthySites(), NOW, 30), "rehearsal_sync");
  assert(f.firing);
  assert(f.body.includes("2 erreurs"), f.body);

  facts.rehearsal_sync = {
    started_at: hoursAgo(15),
    finished_at: hoursAgo(15),
    status: "success",
    error_count: 0,
  };
  f = find(evaluate(facts, healthySites(), NOW, 30), "rehearsal_sync");
  assert(f.firing);
  assertEquals(f.title, "Synchro des répétitions en retard");
  assert(f.body.includes("15 h"), f.body);

  facts.rehearsal_sync = {
    started_at: minutesAgo(45),
    finished_at: null,
    status: "running",
    error_count: 0,
  };
  f = find(evaluate(facts, healthySites(), NOW, 30), "rehearsal_sync");
  assertEquals(f.title, "Synchro des répétitions bloquée");

  facts.rehearsal_sync = null;
  f = find(evaluate(facts, healthySites(), NOW, 30), "rehearsal_sync");
  assertEquals(f.title, "Synchro des répétitions : aucune exécution");
});

Deno.test("a run that just started is not stuck", () => {
  const facts = healthyFacts();
  facts.rehearsal_sync = {
    started_at: minutesAgo(5),
    finished_at: null,
    status: "running",
    error_count: 0,
  };
  const f = find(evaluate(facts, healthySites(), NOW, 30), "rehearsal_sync");
  assertEquals(f.firing, false);
});

Deno.test(
  "rehearsal sync 13 h old is still on time (runs every 12 h, DST margin)",
  () => {
    const facts = healthyFacts();
    facts.rehearsal_sync!.started_at = hoursAgo(13);
    const f = find(evaluate(facts, healthySites(), NOW, 30), "rehearsal_sync");
    assertEquals(f.firing, false);
  },
);

Deno.test("drive sync: error with its message, 25 h ok, 27 h stale", () => {
  const facts = healthyFacts();
  facts.drive_sync!.status = "error";
  facts.drive_sync!.error =
    "Trop de retraits pour une synchronisation automatique";
  let f = find(evaluate(facts, healthySites(), NOW, 30), "drive_sync");
  assert(f.firing);
  assert(f.body.includes("Trop de retraits"), f.body);

  facts.drive_sync = {
    started_at: hoursAgo(25),
    finished_at: hoursAgo(25),
    status: "success",
    error: null,
  };
  f = find(evaluate(facts, healthySites(), NOW, 30), "drive_sync");
  assertEquals(f.firing, false);

  facts.drive_sync.started_at = hoursAgo(27);
  f = find(evaluate(facts, healthySites(), NOW, 30), "drive_sync");
  assertEquals(f.title, "Synchro Drive en retard");
});

Deno.test(
  "cron failures list the jobs; one pg_net failure is ignored, two fire",
  () => {
    const facts = healthyFacts();
    facts.cron_failures = [{ jobname: "sync-drive-index", failures: 2 }];
    facts.http_failures = { count: 1, codes: ["500"] };
    let findings = evaluate(facts, healthySites(), NOW, 30);
    assertEquals(
      find(findings, "cron_jobs").body,
      "En 30 min : sync-drive-index (2 échecs).",
    );
    assertEquals(find(findings, "function_calls").firing, false);

    facts.http_failures = { count: 3, codes: ["500", "timeout"] };
    findings = evaluate(facts, healthySites(), NOW, 30);
    assertEquals(
      find(findings, "function_calls").body,
      "3 appels en échec en 30 min (500, timeout).",
    );
  },
);

Deno.test("sites: 3xx is up, 5xx and network errors are down", () => {
  const sites = healthySites();
  sites.admin = { url: sites.admin.url, status: 307 };
  sites.website = { url: sites.website.url, status: 503 };
  let findings = evaluate(healthyFacts(), sites, NOW, 30);
  assertEquals(find(findings, "admin").firing, false);
  assertEquals(
    find(findings, "website").body,
    "https://www.lebontemperament.com/ répond 503.",
  );

  sites.website = {
    url: sites.website.url,
    status: null,
    error: "délai dépassé",
  };
  findings = evaluate(healthyFacts(), sites, NOW, 30);
  assertEquals(find(findings, "website").title, "Site web injoignable");
  assert(find(findings, "website").body.includes("délai dépassé"));
});

// --- Notification decisions ------------------------------------------------

const firing: Finding = {
  key: "website",
  firing: true,
  title: "Site web injoignable",
  body: "https://www.lebontemperament.com/ répond 503.",
};
const okFinding: Finding = {
  key: "website",
  firing: false,
  title: "",
  body: "",
};

Deno.test("nothing stored and nothing wrong: no row, no push", () => {
  assertEquals(decide(undefined, okFinding, NOW), { notify: null, next: null });
});

Deno.test(
  "a new problem fires once, then stays quiet, then reminds after 24 h",
  () => {
    const first = decide(undefined, firing, NOW);
    assertEquals(first.notify, "fire");
    assertEquals(first.next?.first_fired_at, NOW.toISOString());
    const stored = markNotified(first.next!, "fire", NOW);
    assertEquals(stored.notified_count, 1);

    const later = new Date(NOW.getTime() + 15 * 60_000);
    assertEquals(decide(stored, firing, later).notify, null);

    const nextDay = new Date(NOW.getTime() + 24 * 3_600_000);
    const reminder = decide(stored, firing, nextDay);
    assertEquals(reminder.notify, "remind");
    assertEquals(reminder.next?.first_fired_at, NOW.toISOString());
  },
);

Deno.test("a push that reached no phone is retried at the next check", () => {
  const first = decide(undefined, firing, NOW);
  // Not delivered: the caller stores first.next as is.
  const later = new Date(NOW.getTime() + 15 * 60_000);
  const retry = decide(first.next!, firing, later);
  assertEquals(retry.notify, "fire");
  assertEquals(retry.next?.first_fired_at, NOW.toISOString());
});

Deno.test(
  "the end of a pushed problem is pushed; an unpushed one ends silently",
  () => {
    const pushed = markNotified(
      decide(undefined, firing, NOW).next!,
      "fire",
      NOW,
    );
    const later = new Date(NOW.getTime() + 30 * 60_000);
    const resolved = decide(pushed, okFinding, later);
    assertEquals(resolved.notify, "resolve");
    assertEquals(resolved.next?.status, "ok");
    assertEquals(resolved.next?.resolved_at, later.toISOString());

    const unpushed = decide(undefined, firing, NOW).next!;
    const silent = decide(unpushed, okFinding, later);
    assertEquals(silent.notify, null);
    assertEquals(silent.next?.status, "ok");
  },
);

Deno.test(
  "a problem that comes back after resolving starts a new alert",
  () => {
    const resolved: StoredAlert = {
      key: "website",
      status: "ok",
      title: "Site web injoignable",
      body: "…",
      first_fired_at: hoursAgo(5),
      last_notified_at: hoursAgo(5),
      notified_count: 1,
      resolved_at: hoursAgo(4),
    };
    const again = decide(resolved, firing, NOW);
    assertEquals(again.notify, "fire");
    assertEquals(again.next?.first_fired_at, NOW.toISOString());
    assertEquals(again.next?.notified_count, 0);
    assertEquals(again.next?.resolved_at, null);
  },
);

Deno.test("messages: fire as found, reminder and end name the problem", () => {
  const stored = markNotified(
    decide(undefined, firing, NOW).next!,
    "fire",
    NOW,
  );
  assertEquals(message(stored, "fire", NOW), {
    title: "Site web injoignable",
    body: "https://www.lebontemperament.com/ répond 503.",
  });
  const remind = message(stored, "remind", NOW);
  assertEquals(remind.title, "Toujours en cours : Site web injoignable");
  assert(remind.body.startsWith("Depuis le 7 octobre à 10:07."), remind.body);
  assertEquals(
    message(stored, "resolve", NOW).title,
    "Rétabli : Site web injoignable",
  );
});
