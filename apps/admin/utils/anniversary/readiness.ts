// Readiness of the 40 ans page, one row per section of the campaign, computed
// from counts the API gathers (app/api/anniversary/readiness/route.ts). Pure
// and unit-tested: the facts come in, the checklist comes out. The wording
// is what the admin reads on « Vue d'ensemble et publication ».
import RouteNames from "@/utils/routes";

export type ReadinessFacts = {
  hero: {
    exists: boolean;
    /** Headline fields filled (number, subtitle, button text). */
    complete: boolean;
    /** The button's target is one of the page's sections. */
    targetKnown: boolean;
  };
  heroStats: { total: number; visible: number };
  navigation: { total: number; visible: number; unknownTargets: number };
  timeline: { total: number; visible: number; withoutYear: number };
  videos: { total: number; visible: number };
  audio: { total: number; visible: number };
  photos: { total: number; visible: number };
  archives: { total: number; visible: number };
  form: { exists: boolean; enabled: boolean; complete: boolean };
  memories: { pending: number; approved: number };
};

export type ReadinessState = "ready" | "attention" | "empty";

export type ReadinessRow = {
  key: keyof Omit<ReadinessFacts, "hero"> | "hero";
  label: string;
  href: string;
  state: ReadinessState;
  /** One line: why it is in this state. */
  reason: string;
  /** The verb on the row's link, e.g. « Compléter ». */
  action: string;
};

export type Readiness = {
  rows: ReadinessRow[];
  ready: number;
  total: number;
  /** Nothing blocks a publication: every row is ready or merely has attention points. */
  publishable: boolean;
};

const ROUTES = RouteNames.DASHBOARD.ADMIN.ANNIVERSARY;

const plural = (count: number, one: string, many: string) =>
  `${count} ${count > 1 ? many : one}`;

function listRow(
  key: ReadinessRow["key"],
  label: string,
  href: string,
  counts: { total: number; visible: number },
  nouns: { one: string; many: string },
  extra?: { state: ReadinessState; reason: string; action: string } | null,
): ReadinessRow {
  if (counts.total === 0) {
    return {
      key,
      label,
      href,
      state: "empty",
      reason: "Rien n'a encore été ajouté.",
      action: "Ajouter",
    };
  }
  if (counts.visible === 0) {
    return {
      key,
      label,
      href,
      state: "attention",
      reason: `${plural(counts.total, nouns.one, nouns.many)}, mais tout est masqué.`,
      action: "Vérifier",
    };
  }
  if (extra) return { key, label, href, ...extra };
  const hidden = counts.total - counts.visible;
  return {
    key,
    label,
    href,
    state: "ready",
    reason:
      hidden > 0
        ? `${plural(counts.visible, nouns.one, nouns.many)} en ligne, ${plural(hidden, "masqué", "masqués")}.`
        : `${plural(counts.visible, nouns.one, nouns.many)} en ligne.`,
    action: "Ouvrir",
  };
}

export function computeReadiness(facts: ReadinessFacts): Readiness {
  const rows: ReadinessRow[] = [];

  rows.push(
    !facts.hero.exists
      ? {
          key: "hero",
          label: "En-tête de la page",
          href: ROUTES.HERO,
          state: "empty",
          reason: "L'en-tête n'a pas encore été renseigné.",
          action: "Renseigner",
        }
      : !facts.hero.complete
        ? {
            key: "hero",
            label: "En-tête de la page",
            href: ROUTES.HERO,
            state: "attention",
            reason:
              "Il manque le chiffre, le sous-titre ou le texte du bouton.",
            action: "Compléter",
          }
        : !facts.hero.targetKnown
          ? {
              key: "hero",
              label: "En-tête de la page",
              href: ROUTES.HERO,
              state: "attention",
              reason: "Le bouton ne mène à aucune section connue de la page.",
              action: "Corriger",
            }
          : {
              key: "hero",
              label: "En-tête de la page",
              href: ROUTES.HERO,
              state: "ready",
              reason: "Chiffre, sous-titre et bouton renseignés.",
              action: "Ouvrir",
            },
  );

  rows.push(
    listRow("heroStats", "Chiffres clés", ROUTES.HERO_STATS, facts.heroStats, {
      one: "chiffre",
      many: "chiffres",
    }),
  );

  rows.push(
    listRow(
      "navigation",
      "Cartes de navigation",
      ROUTES.NAVIGATION,
      facts.navigation,
      { one: "carte", many: "cartes" },
      facts.navigation.unknownTargets > 0
        ? {
            state: "attention",
            reason: `${plural(facts.navigation.unknownTargets, "carte mène", "cartes mènent")} à une section inconnue.`,
            action: "Corriger",
          }
        : null,
    ),
  );

  rows.push(
    listRow(
      "timeline",
      "Chronologie",
      ROUTES.TIMELINE,
      facts.timeline,
      { one: "événement", many: "événements" },
      facts.timeline.withoutYear > 0
        ? {
            state: "attention",
            reason: `${plural(facts.timeline.withoutYear, "événement", "événements")} sans année.`,
            action: "Compléter",
          }
        : null,
    ),
  );

  rows.push(
    listRow("videos", "Vidéos", ROUTES.VIDEOS, facts.videos, {
      one: "vidéo",
      many: "vidéos",
    }),
  );
  rows.push(
    listRow("audio", "Souvenirs audio", ROUTES.AUDIO, facts.audio, {
      one: "souvenir",
      many: "souvenirs",
    }),
  );
  rows.push(
    listRow("photos", "Photos", ROUTES.PHOTOS, facts.photos, {
      one: "photo",
      many: "photos",
    }),
  );
  rows.push(
    listRow("archives", "Archives", ROUTES.ARCHIVES, facts.archives, {
      one: "archive",
      many: "archives",
    }),
  );

  rows.push(
    !facts.form.exists
      ? {
          key: "form",
          label: "Formulaire",
          href: ROUTES.FORM,
          state: "empty",
          reason: "Le formulaire de témoignage n'est pas configuré.",
          action: "Configurer",
        }
      : !facts.form.complete
        ? {
            key: "form",
            label: "Formulaire",
            href: ROUTES.FORM,
            state: "attention",
            reason: "Il manque le titre ou la description de la section.",
            action: "Compléter",
          }
        : facts.form.enabled
          ? {
              key: "form",
              label: "Formulaire",
              href: ROUTES.FORM,
              state: "ready",
              reason: "Les visiteurs pourront envoyer un témoignage.",
              action: "Ouvrir",
            }
          : {
              key: "form",
              label: "Formulaire",
              href: ROUTES.FORM,
              state: "attention",
              reason:
                "Le formulaire est désactivé : personne ne pourra témoigner.",
              action: "Vérifier",
            },
  );

  rows.push(
    facts.memories.pending > 0
      ? {
          key: "memories",
          label: "Modération",
          href: ROUTES.MEMORIES,
          state: "attention",
          reason: `${plural(facts.memories.pending, "témoignage attend", "témoignages attendent")} votre avis.`,
          action: "Modérer",
        }
      : facts.memories.approved > 0
        ? {
            key: "memories",
            label: "Modération",
            href: ROUTES.MEMORIES,
            state: "ready",
            reason: `${plural(facts.memories.approved, "témoignage publié", "témoignages publiés")}, rien en attente.`,
            action: "Ouvrir",
          }
        : {
            key: "memories",
            label: "Modération",
            href: ROUTES.MEMORIES,
            state: "ready",
            reason: "Aucun témoignage reçu pour le moment.",
            action: "Ouvrir",
          },
  );

  const ready = rows.filter((row) => row.state === "ready").length;
  return {
    rows,
    ready,
    total: rows.length,
    publishable: rows.every((row) => row.state !== "empty"),
  };
}
