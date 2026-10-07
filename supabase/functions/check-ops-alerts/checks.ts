// Pure logic of check-ops-alerts: turns what the database and the two sites
// report into findings, and a finding plus the stored state of its alert into
// what to notify. No I/O here, so every rule is covered by checks_test.ts.

/** Facts read from the database by `ops_alert_facts()` (service_role only). */
export interface DbFacts {
  /** Latest cron run of the rehearsal sync, or null if it never ran. */
  rehearsal_sync: {
    started_at: string;
    finished_at: string | null;
    status: "running" | "success" | "partial" | "failed";
    error_count: number;
  } | null;
  /** Latest cron run of the Drive index sync, or null if it never ran. */
  drive_sync: {
    started_at: string;
    finished_at: string | null;
    status: "running" | "success" | "error";
    error: string | null;
  } | null;
  /** pg_cron jobs with failed runs inside the window. */
  cron_failures: { jobname: string; failures: number }[];
  /** pg_net calls (edge functions called by cron jobs and triggers) that
   * answered 4xx/5xx or timed out inside the window. */
  http_failures: { count: number; codes: string[] };
}

/** Result of one HTTP check of a site (after its retry). */
export interface SiteProbe {
  url: string;
  /** HTTP status, or null when the request failed (timeout, DNS, TLS). */
  status: number | null;
  error?: string;
}

export type AlertKey =
  | "rehearsal_sync"
  | "drive_sync"
  | "cron_jobs"
  | "function_calls"
  | "website"
  | "admin";

export interface Finding {
  key: AlertKey;
  firing: boolean;
  /** Push title and body; only meaningful when firing. */
  title: string;
  body: string;
}

/** What `ops_alerts` remembers about one alert. */
export interface StoredAlert {
  key: string;
  status: "firing" | "ok";
  title: string;
  body: string;
  first_fired_at: string | null;
  last_notified_at: string | null;
  notified_count: number;
  resolved_at: string | null;
}

export type Notification = "fire" | "remind" | "resolve";

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

/** The rehearsal sync runs at 07:00 and 19:00 Europe/Paris (12 h apart);
 * 14 h leaves room for the DST change and a slow run. */
export const REHEARSAL_SYNC_MAX_AGE = 14 * HOUR;
/** The Drive sync runs nightly at 03:30 Europe/Paris. */
export const DRIVE_SYNC_MAX_AGE = 26 * HOUR;
/** A run still "running" after this long has died without closing its row. */
export const STUCK_AFTER = 30 * MINUTE;
/** pg_net failures below this count inside the window are ignored (one
 * transient error isn't worth waking anyone). */
export const HTTP_FAILURE_THRESHOLD = 2;
/** A firing alert is pushed again once a day until it resolves. */
export const REMIND_AFTER = 24 * HOUR;

const parisTime = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

/** "6 octobre à 19:00" in Europe/Paris time. */
export function formatParis(iso: string | Date): string {
  return parisTime.format(typeof iso === "string" ? new Date(iso) : iso);
}

function ageHours(iso: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / HOUR);
}

function ok(key: AlertKey): Finding {
  return { key, firing: false, title: "", body: "" };
}

function syncFinding(
  key: "rehearsal_sync" | "drive_sync",
  label: string,
  run: { started_at: string; status: string } | null,
  failed: boolean,
  failureDetail: string,
  maxAge: number,
  expected: string,
  now: Date,
): Finding {
  if (!run) {
    return {
      key,
      firing: true,
      title: `${label} : aucune exécution`,
      body: `Aucune synchronisation automatique n'est enregistrée (attendue ${expected}).`,
    };
  }
  const age = now.getTime() - new Date(run.started_at).getTime();
  const at = formatParis(run.started_at);
  if (run.status === "running" && age > STUCK_AFTER) {
    return {
      key,
      firing: true,
      title: `${label} bloquée`,
      body: `La synchronisation du ${at} n'est jamais allée au bout.`,
    };
  }
  if (failed) {
    return {
      key,
      firing: true,
      title: `${label} en échec`,
      body: `La synchronisation du ${at} ${failureDetail}.`,
    };
  }
  if (age > maxAge) {
    return {
      key,
      firing: true,
      title: `${label} en retard`,
      body: `Dernière synchronisation automatique il y a ${ageHours(run.started_at, now)} h (attendue ${expected}).`,
    };
  }
  return ok(key);
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n > 1 ? many : one}`;
}

/** Evaluates every check. Always returns one finding per key. */
export function evaluate(
  facts: DbFacts,
  sites: { website: SiteProbe; admin: SiteProbe },
  now: Date,
  windowMinutes: number,
): Finding[] {
  const findings: Finding[] = [];

  const rehearsal = facts.rehearsal_sync;
  findings.push(
    syncFinding(
      "rehearsal_sync",
      "Synchro des répétitions",
      rehearsal,
      rehearsal?.status === "failed" || rehearsal?.status === "partial",
      rehearsal?.status === "partial"
        ? `s'est terminée avec ${plural(rehearsal.error_count, "erreur", "erreurs")}`
        : "a échoué",
      REHEARSAL_SYNC_MAX_AGE,
      "deux fois par jour",
      now,
    ),
  );

  const drive = facts.drive_sync;
  findings.push(
    syncFinding(
      "drive_sync",
      "Synchro Drive",
      drive,
      drive?.status === "error",
      drive?.error ? `a échoué : ${drive.error.slice(0, 120)}` : "a échoué",
      DRIVE_SYNC_MAX_AGE,
      "chaque nuit",
      now,
    ),
  );

  if (facts.cron_failures.length > 0) {
    const jobs = facts.cron_failures
      .map((f) => `${f.jobname} (${plural(f.failures, "échec", "échecs")})`)
      .join(", ");
    findings.push({
      key: "cron_jobs",
      firing: true,
      title: "Tâche planifiée en échec",
      body: `En ${windowMinutes} min : ${jobs}.`,
    });
  } else {
    findings.push(ok("cron_jobs"));
  }

  if (facts.http_failures.count >= HTTP_FAILURE_THRESHOLD) {
    const codes = facts.http_failures.codes.join(", ");
    findings.push({
      key: "function_calls",
      firing: true,
      title: "Appels de fonctions en échec",
      body: `${plural(facts.http_failures.count, "appel", "appels")} en échec en ${windowMinutes} min (${codes}).`,
    });
  } else {
    findings.push(ok("function_calls"));
  }

  findings.push(siteFinding("website", "Site web", sites.website));
  findings.push(siteFinding("admin", "Admin", sites.admin));

  return findings;
}

/** 2xx and 3xx count as up (the admin redirects to its login page). */
export function isUp(status: number | null): boolean {
  return status !== null && status >= 200 && status < 400;
}

function siteFinding(key: AlertKey, label: string, probe: SiteProbe): Finding {
  if (isUp(probe.status)) return ok(key);
  const what =
    probe.status === null
      ? `ne répond pas (${probe.error ?? "erreur réseau"})`
      : `répond ${probe.status}`;
  return {
    key,
    firing: true,
    title: `${label} injoignable`,
    body: `${probe.url} ${what}.`,
  };
}

export interface Decision {
  /** What to push, if anything. */
  notify: Notification | null;
  /** The row to store, or null when nothing changes (an alert that never
   * fired and still doesn't). */
  next: StoredAlert | null;
}

/**
 * Decides what to push and what to store for one finding.
 *
 * - A new problem is pushed once; while it lasts, again once a day.
 * - Its end is pushed once, only if its start was (a problem that came and
 *   went while no phone was registered stays silent).
 * - A push that reached no phone leaves `last_notified_at` unset (the caller
 *   applies `markNotified` only on delivery), so the alert is retried at the
 *   next check, e.g. once the app has registered.
 */
export function decide(
  prev: StoredAlert | undefined,
  finding: Finding,
  now: Date,
): Decision {
  const nowIso = now.toISOString();

  if (finding.firing) {
    const startsNow = !prev || prev.status !== "firing";
    const next: StoredAlert = {
      key: finding.key,
      status: "firing",
      title: finding.title,
      body: finding.body,
      first_fired_at: startsNow ? nowIso : prev.first_fired_at,
      last_notified_at: startsNow ? null : prev.last_notified_at,
      notified_count: startsNow ? 0 : prev.notified_count,
      resolved_at: null,
    };
    if (next.last_notified_at === null) return { notify: "fire", next };
    const since = now.getTime() - new Date(next.last_notified_at).getTime();
    return { notify: since >= REMIND_AFTER ? "remind" : null, next };
  }

  if (prev?.status === "firing") {
    return {
      notify: prev.last_notified_at ? "resolve" : null,
      next: { ...prev, status: "ok", resolved_at: nowIso },
    };
  }

  return { notify: null, next: null };
}

/** The stored row after a push reached at least one phone. */
export function markNotified(
  alert: StoredAlert,
  notify: Notification,
  now: Date,
): StoredAlert {
  if (notify === "resolve") return alert;
  return {
    ...alert,
    last_notified_at: now.toISOString(),
    notified_count: alert.notified_count + 1,
  };
}

/** Title and body of the push for a decision. */
export function message(
  alert: StoredAlert,
  notify: Notification,
  now: Date,
): { title: string; body: string } {
  switch (notify) {
    case "fire":
      return { title: alert.title, body: alert.body };
    case "remind":
      return {
        title: `Toujours en cours : ${alert.title}`,
        body: `Depuis le ${formatParis(alert.first_fired_at ?? now)}. ${alert.body}`,
      };
    case "resolve":
      return {
        title: `Rétabli : ${alert.title}`,
        body: `Revenu à la normale le ${formatParis(now)}.`,
      };
  }
}
