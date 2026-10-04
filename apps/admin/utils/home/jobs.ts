// « Que voulez-vous faire ? »: one card per job of the IA (the nav sections
// minus Accueil), each with its key links and a status line computed from
// what the home has already loaded. Pure; the page passes the facts.
import { describeCounts, plural } from "@/utils/driveSync";
import RouteNames from "@/utils/routes";
import type { DriveSyncAttention, ReadinessSummary } from "./tasks";
import { formatDayFr } from "./upcoming";

export type JobId =
  "campaign" | "public" | "season" | "members" | "association";

export const JOB_IDS: JobId[] = [
  "campaign",
  "public",
  "season",
  "members",
  "association",
];

export type JobLink = { label: string; href: string };

const ANNIVERSARY = RouteNames.DASHBOARD.ADMIN.ANNIVERSARY;

/** One or two entry points per job; labels are the nav's. */
export function jobLinks(id: JobId, isSuperAdmin: boolean): JobLink[] {
  switch (id) {
    case "campaign":
      return [
        { label: "Vue d’ensemble et publication", href: ANNIVERSARY.ROOT },
        { label: "Modération", href: ANNIVERSARY.MEMORIES },
      ];
    case "public":
      return [
        {
          label: "Concerts et tournées",
          href: RouteNames.DASHBOARD.PUBLIC.PROCHAINS_CONCERTS,
        },
        {
          label: "Histoires de concerts",
          href: RouteNames.DASHBOARD.PUBLIC.PROJETS.ROOT,
        },
      ];
    case "season":
      return [
        {
          label: "Partitions et documents",
          href: RouteNames.DASHBOARD.MEMBERS.TRAVAIL_ROOT,
        },
        {
          label: "Répétitions",
          href: RouteNames.DASHBOARD.MEMBERS.REPETITIONS,
        },
      ];
    case "members":
      return [
        { label: "Membres", href: RouteNames.DASHBOARD.ADMIN.USERS },
        {
          label: "Liste de diffusion",
          href: RouteNames.DASHBOARD.ADMIN.GOOGLE_GROUPS,
        },
      ];
    case "association":
      return [
        { label: "Comptes rendus du CA", href: RouteNames.DASHBOARD.ADMIN.CA },
        ...(isSuperAdmin
          ? [
              {
                label: "Signalements",
                href: RouteNames.DASHBOARD.ADMIN.BUG_REPORTS,
              },
            ]
          : []),
      ];
  }
}

export type StatusTone = "neutral" | "success" | "warning";
export type StatusLine = { tone: StatusTone; text: string };

export type JobFacts = {
  readiness?: ReadinessSummary;
  campaignPublished?: boolean;
  nextConcert?: { startsAt: Date } | null;
  driveSync?: DriveSyncAttention | null;
  lastDriveSync?: { when: string; counts: unknown } | null;
  nextRehearsal?: { startsAt: Date } | null;
  members?: { total: number; pendingInvitations: number };
  isSuperAdmin?: boolean;
  unreadReports?: number;
};

/**
 * Status lines per job, only from facts that are present: a source that is
 * still loading or failed leaves its line out instead of showing a guess.
 */
export function jobStatusLines(
  facts: JobFacts,
  now: Date = new Date(),
): Record<JobId, StatusLine[]> {
  const lines: Record<JobId, StatusLine[]> = {
    campaign: [],
    public: [],
    season: [],
    members: [],
    association: [],
  };

  if (facts.campaignPublished !== undefined) {
    lines.campaign.push({
      tone: facts.campaignPublished ? "success" : "neutral",
      text: facts.campaignPublished ? "Page publiée" : "Page masquée",
    });
  }
  if (facts.readiness) {
    const r = facts.readiness;
    lines.campaign.push({
      tone: r.ready === r.total ? "success" : "neutral",
      text: `${plural(r.ready, "section prête", "sections prêtes")} sur ${r.total}`,
    });
    if (r.pendingMemories > 0) {
      lines.campaign.push({
        tone: "warning",
        text: `${plural(r.pendingMemories, "témoignage", "témoignages")} à modérer`,
      });
    }
  }

  if (facts.nextConcert !== undefined) {
    lines.public.push(
      facts.nextConcert
        ? {
            tone: "neutral",
            text: `Prochain concert le ${formatDayFr(facts.nextConcert.startsAt, now).toLocaleLowerCase("fr-FR")}`,
          }
        : { tone: "neutral", text: "Aucun concert planifié" },
    );
  }

  if (facts.driveSync) {
    lines.season.push({
      tone: "warning",
      text:
        facts.driveSync.kind === "unreadable"
          ? `${plural(facts.driveSync.count, "dossier Drive illisible", "dossiers Drive illisibles")}`
          : facts.driveSync.kind === "failed"
            ? "Dernière synchronisation Drive en erreur"
            : "Dernière synchronisation Drive interrompue",
    });
  } else if (facts.lastDriveSync) {
    lines.season.push({
      tone: "success",
      text: `Drive synchronisé le ${facts.lastDriveSync.when} : ${describeCounts(
        normalizeCounts(facts.lastDriveSync.counts),
      )}`,
    });
  } else if (facts.lastDriveSync === null) {
    lines.season.push({
      tone: "neutral",
      text: "Aucune synchronisation Drive pour l'instant",
    });
  }
  if (facts.nextRehearsal !== undefined) {
    lines.season.push(
      facts.nextRehearsal
        ? {
            tone: "neutral",
            text: `Prochaine répétition le ${formatDayFr(facts.nextRehearsal.startsAt, now).toLocaleLowerCase("fr-FR")}`,
          }
        : { tone: "neutral", text: "Aucune répétition à venir" },
    );
  }

  if (facts.members) {
    const { total, pendingInvitations } = facts.members;
    lines.members.push({
      tone: "neutral",
      text:
        pendingInvitations > 0
          ? `${plural(total, "membre", "membres")}, ${plural(pendingInvitations, "invitation en cours", "invitations en cours")}`
          : `${plural(total, "membre", "membres")}`,
    });
  }

  if (facts.isSuperAdmin && facts.unreadReports !== undefined) {
    lines.association.push(
      facts.unreadReports > 0
        ? {
            tone: "warning",
            text: `${plural(facts.unreadReports, "signalement non lu", "signalements non lus")}`,
          }
        : { tone: "success", text: "Aucun signalement non lu" },
    );
  }

  return lines;
}

function normalizeCounts(counts: unknown) {
  const c = (counts && typeof counts === "object" ? counts : {}) as Record<
    string,
    unknown
  >;
  const n = (key: string) => (typeof c[key] === "number" ? c[key] : 0);
  return {
    added: n("added"),
    renamed: n("renamed"),
    moved: n("moved"),
    removed: n("removed"),
    unchanged: n("unchanged"),
    unreadable_roots: n("unreadable_roots"),
  };
}
