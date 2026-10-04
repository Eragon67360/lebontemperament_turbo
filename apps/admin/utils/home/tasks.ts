// « À faire » on the home: what waits for an admin, in the order it should be
// looked at. Pure: the page gathers the facts from its queries, this file
// decides the rows and their wording.
import type { Readiness } from "@/utils/anniversary/readiness";
import { formatRunDate, plural, STALE_RUN_MS } from "@/utils/driveSync";
import RouteNames from "@/utils/routes";

export type HomeTaskKey =
  "drive-sync" | "memories" | "messages" | "campaign-sections";

export type HomeTaskTone = "accent" | "warning" | "neutral";

export type HomeTaskAction =
  | { kind: "link"; label: string; href: string }
  | { kind: "messages"; label: string };

export type HomeTask = {
  key: HomeTaskKey;
  tone: HomeTaskTone;
  /** One line, with the count. */
  title: string;
  /** One line: where it comes from and why it matters. */
  explanation: string;
  action: HomeTaskAction;
};

/** What the campaign's readiness means for the home. */
export type ReadinessSummary = {
  ready: number;
  total: number;
  pendingMemories: number;
  /** Sections that are empty or need a check, moderation left out (its own task). */
  sectionsToComplete: number;
  /** Their labels, in page order. */
  sectionLabels: string[];
};

export function summarizeReadiness(
  readiness: Readiness & { facts?: { memories?: { pending: number } } },
): ReadinessSummary {
  const toComplete = readiness.rows.filter(
    (row) => row.state !== "ready" && row.key !== "memories",
  );
  return {
    ready: readiness.ready,
    total: readiness.total,
    pendingMemories: readiness.facts?.memories?.pending ?? 0,
    sectionsToComplete: toComplete.length,
    sectionLabels: toComplete.map((row) => row.label),
  };
}

/** The slice of a drive_sync_runs row the home reads. */
export type DriveSyncRunLike = {
  status: string;
  started_at: string;
  finished_at?: string | null;
  error?: string | null;
  counts: unknown;
};

export type DriveSyncAttention =
  | { kind: "failed"; when: string; error: string | null }
  | { kind: "interrupted"; when: string }
  | { kind: "unreadable"; when: string; count: number };

function unreadableRoots(counts: unknown): number {
  if (!counts || typeof counts !== "object") return 0;
  const value = (counts as Record<string, unknown>).unreadable_roots;
  return typeof value === "number" && value > 0 ? value : 0;
}

/**
 * Whether the last Drive sync needs someone: it failed, it never finished, or
 * it could not read some folders. A run still running is left alone; a later
 * successful run clears an older failure. Null means nothing to do.
 */
export function driveSyncAttention(
  runs: DriveSyncRunLike[] | undefined,
  now: number = Date.now(),
): DriveSyncAttention | null {
  const last = runs?.[0];
  if (!last) return null;
  const when = formatRunDate(last.finished_at || last.started_at);
  if (last.status === "running") {
    const startedAt = new Date(last.started_at).getTime();
    return now - startedAt > STALE_RUN_MS
      ? { kind: "interrupted", when }
      : null;
  }
  if (last.status === "error") {
    return { kind: "failed", when, error: last.error || null };
  }
  const count = unreadableRoots(last.counts);
  return count > 0 ? { kind: "unreadable", when, count } : null;
}

export type HomeTaskFacts = {
  /** undefined when the source could not be read: the row is simply absent. */
  memoriesPending?: number;
  unreadMessages?: number;
  driveSync?: DriveSyncAttention | null;
  sectionsToComplete?: number;
};

const CAMPAIGN = RouteNames.DASHBOARD.ADMIN.ANNIVERSARY;

function driveSyncTask(attention: DriveSyncAttention): HomeTask {
  const action: HomeTaskAction = {
    kind: "link",
    label: "Voir le détail",
    href: RouteNames.DASHBOARD.MEMBERS.TRAVAIL_ROOT,
  };
  switch (attention.kind) {
    case "failed":
      return {
        key: "drive-sync",
        tone: "warning",
        title: "La synchronisation Drive a échoué",
        explanation: `Saison des membres · ${attention.when}. ${
          attention.error ||
          "Les partitions et documents des membres n'ont peut-être pas été mis à jour."
        }`,
        action,
      };
    case "interrupted":
      return {
        key: "drive-sync",
        tone: "warning",
        title: "La dernière synchronisation Drive a été interrompue",
        explanation: `Saison des membres · ${attention.when}. Elle n'est jamais allée au bout : relancez-la pour vérifier les documents.`,
        action,
      };
    case "unreadable":
      return {
        key: "drive-sync",
        tone: "warning",
        title: `Synchronisation Drive : ${plural(attention.count, "dossier illisible", "dossiers illisibles")}`,
        explanation: `Saison des membres · ${attention.when}. Ces dossiers n'ont pas été importés : vérifiez qu'ils sont bien partagés avec le compte de service.`,
        action,
      };
  }
}

/**
 * The rows of « À faire », most pressing first: a broken sync (members may
 * miss documents), then people waiting on you (visitors' memories, replies to
 * your reports), then the long-running campaign work.
 */
export function buildHomeTasks(facts: HomeTaskFacts): HomeTask[] {
  const tasks: HomeTask[] = [];

  if (facts.driveSync) tasks.push(driveSyncTask(facts.driveSync));

  if (facts.memoriesPending && facts.memoriesPending > 0) {
    const n = facts.memoriesPending;
    tasks.push({
      key: "memories",
      tone: "accent",
      title: `${plural(n, "témoignage attend", "témoignages attendent")} votre avis`,
      explanation:
        "Campagne 40 ans · envoyés par des visiteurs du site. Ils ne seront visibles qu'après votre validation.",
      action: { kind: "link", label: "Modérer", href: CAMPAIGN.MEMORIES },
    });
  }

  if (facts.unreadMessages && facts.unreadMessages > 0) {
    const n = facts.unreadMessages;
    tasks.push({
      key: "messages",
      tone: "neutral",
      title: `${plural(n, "message non lu", "messages non lus")}`,
      explanation:
        "Réponses à vos signalements, aussi dans le menu de votre compte.",
      action: { kind: "messages", label: "Lire" },
    });
  }

  if (facts.sectionsToComplete && facts.sectionsToComplete > 0) {
    const n = facts.sectionsToComplete;
    tasks.push({
      key: "campaign-sections",
      tone: "accent",
      title: `${plural(n, "section", "sections")} de la page des 40 ans à compléter`,
      explanation:
        "Campagne 40 ans · la page reste masquée tant que vous ne la publiez pas ; chaque section dit ce qu'il lui manque.",
      action: {
        kind: "link",
        label: "Voir les sections",
        href: CAMPAIGN.ROOT,
      },
    });
  }

  return tasks;
}
