import { CookieConsentConfig } from "vanilla-cookieconsent";

/**
 * What the site really sets or loads (checked 2026-10, issue #349):
 * - the consent choice itself (`cc_cookie`, this library) and the Supabase
 *   session of signed-in members: strictly necessary;
 * - Google Analytics 4, Vercel Analytics and Speed Insights: only after the
 *   "analytics" category is accepted (see ConditionalGoogleAnalytics and
 *   ConditionalVercelAnalytics).
 * YouTube videos and the Google map are not listed: they load only when the
 * visitor clicks their placeholder (VideoFacade, Maps).
 */
const getConfig = () => {
  const config: CookieConsentConfig = {
    root: "body",
    autoShow: true,
    disablePageInteraction: false,
    hideFromBots: true,
    mode: "opt-in",
    // Bumped when the categories changed (the unused "ads" one was removed),
    // so earlier choices are asked again once.
    revision: 1,
    cookie: {
      expiresAfterDays: 182,
    },

    // https://cookieconsent.orestbida.com/reference/configuration-reference.html#guioptions
    guiOptions: {
      consentModal: {
        layout: "box inline",
        position: "bottom left",
        equalWeightButtons: true,
        flipButtons: false,
      },
      preferencesModal: {
        layout: "box",
        equalWeightButtons: true,
        flipButtons: false,
      },
    },

    categories: {
      necessary: {
        enabled: true,
        readOnly: true,
      },
      analytics: {
        autoClear: {
          cookies: [{ name: /^_ga/ }],
        },
        services: {
          ga: {
            label: "Google Analytics",
          },
          vercel: {
            label: "Vercel Analytics et Speed Insights",
          },
        },
      },
    },

    language: {
      default: "fr",
      translations: {
        fr: {
          consentModal: {
            title: "Bienvenue, cher visiteur ! Discutons cookies.",
            description:
              "Le site fonctionne sans cookie de suivi. Avec votre accord, nous mesurons la fréquentation pour améliorer le site. Les vidéos YouTube et la carte Google Maps ne se chargent que si vous cliquez dessus.",
            acceptAllBtn: "Tout accepter",
            acceptNecessaryBtn: "Tout refuser",
            showPreferencesBtn: "Gérer les préférences",
            footer: `
                          <a href="/impressum" target="_blank" rel="noopener">Impressum</a>
                          <a href="/politique-de-confidentialite" target="_blank" rel="noopener">Politique de confidentialité</a>
                      `,
          },
          preferencesModal: {
            title: "Gérer les préférences de cookies",
            acceptAllBtn: "Tout accepter",
            acceptNecessaryBtn: "Tout refuser",
            savePreferencesBtn: "Enregistrer mes choix",
            closeIconLabel: "Fermer",
            serviceCounterLabel: "Service|Services",
            sections: [
              {
                title: "Vos choix",
                description:
                  "Vous pouvez modifier ces choix à tout moment depuis le lien « Gérer les cookies » en bas de page. Refuser n’enlève rien au site.",
              },
              {
                title: "Strictement nécessaire",
                description:
                  "Indispensables au fonctionnement du site : votre choix sur les cookies et, pour les membres connectés, la session de l’espace membres. Ils ne servent pas à vous suivre.",
                linkedCategory: "necessary",
                cookieTable: {
                  caption: "Tableau des cookies",
                  headers: {
                    name: "Cookie",
                    domain: "Domaine",
                    desc: "Description",
                    expiry: "Durée",
                  },
                  body: [
                    {
                      name: "cc_cookie",
                      domain: "lebontemperament.com",
                      desc: "Mémorise vos choix sur les cookies.",
                      expiry: "6 mois",
                    },
                    {
                      name: "sb-*-auth-token",
                      domain: "lebontemperament.com",
                      desc: "Session des membres connectés à l’espace membres (Supabase).",
                      expiry: "Session, renouvelée à chaque visite",
                    },
                  ],
                },
              },
              {
                title: "Mesure d’audience",
                description:
                  "Avec votre accord, Google Analytics et Vercel Analytics comptent les visites et mesurent la rapidité des pages. Ces outils sont chargés uniquement après acceptation.",
                linkedCategory: "analytics",
                cookieTable: {
                  caption: "Tableau des cookies",
                  headers: {
                    name: "Cookie",
                    domain: "Domaine",
                    desc: "Description",
                    expiry: "Durée",
                  },
                  body: [
                    {
                      name: "_ga",
                      domain: "lebontemperament.com",
                      desc: "Google Analytics : distingue les visiteurs.",
                      expiry: "13 mois",
                    },
                    {
                      name: "_ga_*",
                      domain: "lebontemperament.com",
                      desc: "Google Analytics : conserve l’état de la session.",
                      expiry: "13 mois",
                    },
                    {
                      name: "Vercel Analytics",
                      domain: "vercel-insights.com",
                      desc: "Fréquentation et vitesse des pages, sans cookie ni identifiant permanent.",
                      expiry: "Aucun cookie",
                    },
                  ],
                },
              },
              {
                title: "Plus d’informations",
                description:
                  'Pour toute question sur les cookies et vos choix, <a href="/contact">contactez-nous</a> ou consultez la <a href="/politique-de-confidentialite">politique de confidentialité</a>.',
              },
            ],
          },
        },
      },
    },
  };

  return config;
};

export default getConfig;
