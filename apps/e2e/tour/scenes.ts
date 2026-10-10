import type { Director } from "./lib/recorder.ts";

// What each scene of script-fr.md shows. `route` loads before the take starts
// (no route: the scene continues where the previous one stopped). `cue` waits
// for a phrase of that scene's « Voix », so clicks land on the words that
// describe them. Nothing here saves: every dialog is closed with « Annuler »
// or Escape, so a render leaves staging as it found it.
export type Shot = {
  route?: string;
  /** Runs before the take, off camera. */
  setup?: (d: Director) => Promise<void>;
  run: (d: Director) => Promise<void>;
};

const more = /^Plus d.actions pour/;

export const shots: Record<string, Shot> = {
  "0.1": {
    route: "/auth/login",
    run: async (d) => {
      const { page } = d;
      await d.pause(600);
      await d.type(
        page.locator("#email"),
        process.env.TOUR_EMAIL ?? "",
        "e-mail field",
      );
      await d.type(
        page.locator("#password"),
        process.env.TOUR_PASSWORD ?? "",
        "password field",
      );
      await d.cue("Je vous fais faire le tour");
      await d.click(
        page.getByRole("button", { name: "Se connecter" }),
        "« Se connecter »",
      );
      await page.waitForURL("**/dashboard", { timeout: 20_000 }).catch(() => {
        throw new Error(
          `Sign-in failed on ${new URL(page.url()).host}: check TOUR_EMAIL / TOUR_PASSWORD (or E2E_USER_* for staging).`,
        );
      });
      await page.waitForLoadState("networkidle").catch(() => {});
    },
  },

  "1.1": {
    route: "/dashboard",
    run: async (d) => {
      const { page } = d;
      await d.hover(
        page.getByRole("heading", { name: /^(Bonjour|Bonsoir)/ }),
        "greeting",
      );
      await d.cue("combien de jours");
      await d.hover(
        page.getByRole("region", { name: "Prochain concert" }),
        "« Prochain concert »",
      );
      await d.cue("Juste en dessous");
      await d.hover(
        page.getByRole("heading", { name: "À faire" }),
        "« À faire »",
      );
    },
  },

  "1.2": {
    run: async (d) => {
      const { page } = d;
      await d.scrollTo(
        page.getByRole("heading", { name: "Que voulez-vous faire ?" }),
      );
      await d.cue("Et « Activité");
      await d.scrollTo(page.getByRole("heading", { name: "Activité récente" }));
      await d.cue("Rassurez-vous");
      await d.scrollBy(-4000);
    },
  },

  "1.3": {
    route: "/dashboard",
    run: async (d) => {
      const { page } = d;
      const nav = page.getByRole("navigation", {
        name: "Navigation principale",
      });
      const label = (name: string) => nav.getByText(name, { exact: true });
      await d.cue("les concerts et le site public");
      await d.hover(label("Concerts et site public"), undefined, 300);
      await d.cue("la saison des membres");
      await d.hover(label("Saison des membres"), undefined, 300);
      await d.cue("les membres et les accès");
      await d.hover(label("Membres et accès"), undefined, 300);
      await d.cue("l'association");
      await d.hover(label("Association"), undefined, 300);
      await d.cue("les projets");
      await d.hover(
        nav.getByText("Campagne 40 ans", { exact: true }),
        undefined,
        300,
      );
      await d.cue("cliquez sur « Comment");
      await d.click(
        page.getByText("Comment ça marche ?").first(),
        "« Comment ça marche ? »",
      );
    },
  },

  "1.4": {
    route: "/dashboard",
    run: async (d) => {
      const { page } = d;
      await d.cue("Cliquez sur « Rechercher »");
      await d.click(
        page.getByRole("button", { name: /Rechercher/ }),
        "« Rechercher »",
      );
      await d.cue("Tapez quelques lettres");
      await page.keyboard.type("concert", { delay: 110 });
      await d.cue("Entrée, et vous");
      await d.press("Enter");
    },
  },

  "1.5": {
    route: "/dashboard",
    run: async (d) => {
      const { page } = d;
      await d.click(
        page.getByRole("button", { name: /^Compte de/ }),
        "account menu",
      );
      await d.cue("le thème");
      await d.hover(page.getByText("Thème", { exact: true }), "« Thème »");
      await d.cue("la densité");
      await d.hover(
        page.getByText("Densité des listes", { exact: true }),
        "« Densité des listes »",
      );
      await d.cue("« Signaler un problème »");
      await d.hover(
        page.getByRole("menuitem", { name: /Signaler un problème/ }),
        "« Signaler un problème »",
      );
      await d.cue("« Messages »");
      await d.hover(
        page.getByRole("menuitem", { name: /Messages/ }),
        "« Messages »",
      );
      await d.cue("Une idée");
      await d.press("Escape");
    },
  },

  "2.1": {
    route: "/dashboard/public/concerts/prochains-concerts",
    run: async (d) => {
      const { page } = d;
      await d.cue("« Ajouter un concert »");
      await d.hover(
        page.getByRole("button", { name: "Ajouter un concert" }),
        "« Ajouter un concert »",
        300,
      );
      // A concert's « Modifier », not a tour's: only concerts have the preview.
      await d.click(
        page
          .getByRole("region", { name: "Concerts à venir" })
          .getByRole("button", { name: /^Modifier/ }),
        "a concert's « Modifier »",
      );
      await d.cue("l'aperçu");
      await d.hover(
        page
          .getByRole("dialog")
          .getByRole("heading", { name: "Aperçu sur le site public" }),
        "« Aperçu sur le site public »",
      );
      await d.cue("Attention");
      await d.cancel();
      await d.cue("Les tournées");
      // Only when a tour is coming up; otherwise its empty state.
      await d.hover(
        page
          .getByRole("button", { name: /^Gérer les concerts/ })
          .or(page.getByRole("button", { name: "Créer une tournée" })),
        "« Gérer les concerts »",
      );
    },
  },

  "2.2": {
    route: "/dashboard/public/concerts/prochains-concerts",
    run: async (d) => {
      const { page } = d;
      await d.cue("elle est rangée");
      await d.click(page.getByRole("button", { name: more }), "row « ⋯ »");
      await d.hover(
        page.getByRole("menuitem", { name: /Supprimer/ }),
        "« Supprimer… »",
        400,
      );
      await d.click(
        page.getByRole("menuitem", { name: /Supprimer/ }),
        "« Supprimer… »",
      );
      await d.cue("Impossible");
      await d.cancel();
    },
  },

  "2.3": {
    route: "/dashboard/public/concerts/projets",
    run: async (d) => {
      const { page } = d;
      await d.cue("« Prévisualiser »");
      await d.hover(
        page
          .getByRole("link", { name: /Prévisualiser/ })
          .or(page.getByRole("button", { name: /Prévisualiser/ })),
        "« Prévisualiser »",
      );
      await d.cue("Dans « Vidéos »");
      await d.goto("/dashboard/public/gallery/videos");
      await d.hover(
        page.getByRole("button", { name: "Ajouter une vidéo" }),
        "« Ajouter une vidéo »",
      );
    },
  },

  "2.4": {
    route: "/dashboard/public/annonces",
    run: async (d) => {
      const { page } = d;
      await d.cue("sous le titre");
      await d.hover(
        page.getByRole("heading", { name: /Accueil/ }),
        "« Accueil »",
      );
      await d.cue("la campagne de dons");
      await d.hover(
        page.getByRole("heading", { name: /Campagne de dons/ }),
        "« Campagne de dons »",
      );
      await d.cue("Le badge");
      await d.hover(
        page.getByText(/^(Sur le site|Programmée|Brouillon)$/),
        "status badge",
      );
    },
  },

  "2.5": {
    route: "/dashboard/public/rejoindre-faq",
    run: async (d) => {
      const { page } = d;
      await d.hover(
        page.getByRole("heading", { name: "Horaires des répétitions" }),
      );
      await d.cue("et les questions");
      await d.scrollTo(
        page.getByRole("heading", { name: "Questions fréquentes" }),
      );
      await d.cue("Ajoutez-la ici");
      await d.hover(
        page.getByRole("button", { name: "Ajouter une question" }),
        "« Ajouter une question »",
      );
    },
  },

  "3.1": {
    route: "/dashboard/members/travail",
    run: async (d) => {
      const { page } = d;
      await d.cue("lancer vous-même");
      await d.hover(
        page.getByRole("button", { name: /Synchroniser depuis Drive/ }),
        "« Synchroniser depuis Drive »",
      );
      await d.cue("L'outil vous montre");
      await d.scrollTo(page.getByText("Synchronisation avec Drive"));
      await d.cue("le Drive lui-même");
      await d.scrollTo(page.getByText("Programmes", { exact: true }));
    },
  },

  "3.2": {
    route: "/dashboard/members/repetitions",
    run: async (d) => {
      const { page } = d;
      await d.cue("Vous pouvez filtrer");
      await d.click(
        page.getByRole("combobox").filter({ hasText: /Tous les groupes/ }),
        "group filter",
      );
      await d.pause(900);
      await d.press("Escape");
      await d.cue("ajouter une séance");
      await d.hover(
        page.getByRole("button", { name: "Ajouter une répétition" }),
        "« Ajouter une répétition »",
      );
      await d.cue("Pour une répétition venue de Google");
      await d.hover(
        page.getByText("Google Agenda", { exact: true }),
        "« Google Agenda » badge",
      );
    },
  },

  "3.3": {
    route: "/dashboard/members/evenements",
    run: async (d) => {
      const { page } = d;
      await d.hover(
        page.getByText(/^(Séjour|Vente|Autre|Concert)$/),
        "event type badge",
      );
      await d.cue("vous choisissez");
      await d.hover(
        page.getByText(/^(Public|Membres)$/),
        "« Public » / « Membres » badge",
      );
    },
  },

  "4.1": {
    route: "/dashboard/admin/users",
    run: async (d) => {
      const { page } = d;
      await d.cue("tapez son nom");
      await d.type(
        page.getByPlaceholder("Nom ou e-mail"),
        "mar",
        "member search",
      );
      await d.cue("Les filtres");
      await page.getByPlaceholder("Nom ou e-mail").fill("");
      await d.hover(
        page.getByRole("combobox").filter({ hasText: "Toutes les voix" }),
        "voice filter",
      );
      await d.hover(
        page.getByRole("combobox").filter({ hasText: "Tous les statuts" }),
        "status filter",
      );
      await d.cue("La colonne");
      await d.hover(
        page.getByRole("columnheader", { name: /Dernière connexion/ }),
        "« Dernière connexion »",
      );
    },
  },

  "4.2": {
    route: "/dashboard/admin/users",
    run: async (d) => {
      const { page } = d;
      await d.click(page.getByRole("button", { name: more }), "row « ⋯ »");
      await d.click(
        page.getByRole("menuitem", { name: "Voir la fiche" }),
        "« Voir la fiche »",
      );
      await d.cue("Les coordonnées viennent");
      await d.hover(
        page.getByRole("heading", { name: "Coordonnées" }),
        "« Coordonnées »",
      );
      await d.cue("Si le compte");
      await d.scrollTo(page.getByRole("heading", { name: "Accès" }));
    },
  },

  "4.3": {
    route: "/dashboard/admin/users",
    run: async (d) => {
      const { page } = d;
      await d.click(
        page
          .getByRole("button", { name: /Synchroniser avec la liste/ })
          .or(page.getByRole("link", { name: /Synchroniser avec la liste/ })),
        "« Synchroniser avec la liste »",
      );
      await d.cue("les nouveaux, ceux");
      // The group headings carry their count: « Nouveaux 3 ».
      await d.hover(
        page.getByRole("heading", { name: /^Nouveaux/ }),
        "« Nouveaux »",
      );
      await d.hover(
        page.getByRole("heading", { name: /^Modifiés/ }),
        "« Modifiés »",
      );
      await d.cue("Vous cochez");
      await d.hover(
        page.getByRole("button", { name: /^Appliquer/ }),
        "« Appliquer »",
      );
    },
  },

  "4.4": {
    route: "/dashboard/admin/google-groups",
    run: async (d) => {
      const { page } = d;
      await d.hover(
        page.getByText("Adresses inscrites"),
        "« Adresses inscrites »",
      );
      await d.cue("C'est une page");
      await d.hover(
        page.getByRole("button", { name: "Actualiser" }),
        "« Actualiser »",
      );
    },
  },

  "5.1": {
    route: "/dashboard/admin/documents",
    run: async (d) => {
      const { page } = d;
      await d.cue("vous choisissez qui le voit");
      await d.hover(
        page.getByText(/^(Public|Membres)$/),
        "« Public » / « Membres » badge",
      );
      await d.cue("« Historique »");
      await d.click(page.getByRole("button", { name: more }), "row « ⋯ »");
      await d.hover(
        page.getByRole("menuitem", { name: "Historique" }),
        "« Historique »",
      );
      await d.cue("Archivez-le");
      await d.hover(
        page.getByRole("menuitem", { name: "Archiver" }),
        "« Archiver »",
      );
      await d.press("Escape");
    },
  },

  "5.2": {
    route: "/dashboard/admin/assemblies",
    run: async (d) => {
      const { page } = d;
      await d.click(
        page.getByRole("button", { name: "Modifier" }),
        "« Modifier »",
      );
      await d.cue("Tant qu'elle est en brouillon");
      await d.hover(
        page.getByText("Publiée sur le site"),
        "« Publiée sur le site »",
      );
      await d.cue("publiez-la");
      await d.cancel();
    },
  },

  "5.3": {
    route: "/dashboard/admin/ca",
    run: async (d) => {
      const { page } = d;
      await d.hover(
        page.getByRole("button", { name: "Ajouter un compte rendu" }),
        "« Ajouter un compte rendu »",
      );
      await d.cue("Les membres");
      await d.hover(
        page
          .getByRole("link", { name: /Ouvrir le PDF/ })
          .or(page.getByRole("button", { name: /Ouvrir le PDF/ })),
        "« Ouvrir le PDF »",
      );
    },
  },

  "5.4": {
    // The page itself is super-admin only (and opening a report marks it
    // read): the scene shows where reports come from instead.
    route: "/dashboard/admin/ca",
    run: async (d) => {
      const { page } = d;
      await d.cue("« Signaler un problème »");
      await d.click(
        page.getByRole("button", { name: /^Compte de/ }),
        "account menu",
      );
      await d.hover(
        page.getByRole("menuitem", { name: /Signaler un problème/ }),
        "« Signaler un problème »",
      );
      await d.cue("Si vous ne voyez pas");
      await d.press("Escape");
    },
  },

  "6.1": {
    route: "/dashboard/admin/anniversary",
    run: async (d) => {
      const { page } = d;
      // Each line shows its state as an icon; the word is for screen readers.
      const line = (word: string) =>
        page
          .locator("li")
          .filter({ hasText: `: ${word}.` })
          .locator("svg")
          .first();
      await d.cue("ce qui est prêt");
      await d.hover(line("Prêt"), "a « Prêt » line", 300);
      await d.cue("ce qui est à vérifier");
      await d.hover(line("À vérifier"), "an « À vérifier » line", 300);
      await d.cue("encore vide");
      await d.hover(line("Vide"), "a « Vide » line", 300);
    },
  },

  "6.2": {
    route: "/dashboard/admin/anniversary/hero",
    run: async (d) => {
      const { page } = d;
      await d.cue("rien ne change sur le site");
      await d.hover(page.getByText(/Rien ne change sur le site/), "save bar");
      await d.cue("Dans les listes");
      await d.goto("/dashboard/admin/anniversary/timeline");
      await d.hover(
        page.getByRole("button", { name: /^Masquer/ }),
        "« Masquer »",
      );
      await d.cue("avec les flèches");
      await d.hover(
        page.getByRole("button", { name: /Descendre/ }),
        "« Descendre »",
      );
    },
  },

  "6.3": {
    route: "/dashboard/admin/anniversary/memories",
    run: async (d) => {
      const { page } = d;
      await d.hover(
        page.getByRole("tab", { name: /En attente/ }),
        "« En attente »",
      );
      // « Tous », so there is something to point at even with nothing
      // waiting. Hover only: nothing is published during filming.
      await d.click(page.getByRole("tab", { name: "Tous" }), "« Tous »");
      await d.cue("lisez, publiez");
      await d.hover(
        page.getByRole("button", {
          name: /^(Publier|Retirer de la publication)/,
        }),
        "« Publier »",
      );
      await d.cue("à la une");
      await d.hover(
        page.getByRole("button", {
          name: /^(Mettre à la une|Retirer de la une)/,
        }),
        "« Mettre à la une »",
      );
    },
  },

  "6.4": {
    route: "/dashboard/admin/anniversary",
    run: async (d) => {
      const { page } = d;
      await d.scrollTo(page.getByText("Publication", { exact: true }));
      await d.click(
        page.getByRole("button", { name: /Publier la page|Masquer la page/ }),
        "« Publier la page »",
      );
      await d.cue("après une dernière confirmation");
      await d.hover(
        page.getByText(/J'ai vérifié le contenu|J'ai compris/),
        "confirmation checkbox",
      );
      await d.cue("Et on peut la masquer");
      await d.cancel();
    },
  },

  "7.1": {
    route: "/dashboard",
    run: async (d) => {
      await d.pause(500);
    },
  },
};
