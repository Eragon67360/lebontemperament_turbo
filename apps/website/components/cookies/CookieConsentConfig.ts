import { CookieConsentConfig } from "vanilla-cookieconsent";

const getConfig = () => {
  const config: CookieConsentConfig = {
    root: "body",
    autoShow: true,
    disablePageInteraction: false,
    hideFromBots: true,
    mode: "opt-in",
    revision: 0,

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
        autoClear: {
          cookies: [
            {
              name: "__cf_bm",
              domain: "clerk.lebontemperament.com",
            },
            {
              name: "CookieConsent",
              domain: "lebontemperament.com",
            },
            {
              name: "SERVERID",
              domain: "lebontemperament.com",
            },
            {
              name: "__clerk_db_jwt",
              domain: "lebontemperament.com",
            },
          ],
        },
      },
      analytics: {
        autoClear: {
          cookies: [
            {
              name: /^(_ga|_gid)/,
            },
            {
              name: "_gat", // string: exact cookie name
            },
            {
              name: "__utma", // string: exact cookie name
            },
            {
              name: "__utmb", // string: exact cookie name
            },
            {
              name: "__utmc", // string: exact cookie name
            },
            {
              name: "__utmz", // string: exact cookie name
            },
            {
              name: "__client_uat", // string: exact cookie name
            },
            {
              name: "__client", // string: exact cookie name
            },
            {
              name: "__initted", // string: exact cookie name
            },
          ],
        },

        services: {
          ga: {
            label: "Google Analytics",
          },
          hotjar: {
            label: "Hotjar",
          },
        },
      },
      ads: {
        autoClear: {
          cookies: [
            {
              name: "VISITOR_INFO1_LIVE", // string: exact cookie name
            },
            {
              name: "NID", // string: exact cookie name
            },
            {
              name: "yt-remote-fast-check-period", // string: exact cookie name
            },
            {
              name: "TESTCOOKIESENABLED", // string: exact cookie name
            },
            {
              name: "yt-remote-session-name", // string: exact cookie name
            },
            {
              name: "yt-remote-connected-devices", // string: exact cookie name
            },
            {
              name: "iU5q-!O9@$", // string: exact cookie name
            },
            {
              name: "YSC", // string: exact cookie name
            },
          ],
        },

        services: {
          youtube: {
            label: "Youtube Embed",
            onAccept: () => {},
            onReject: () => {},
          },
          google: {
            label: "Google Ads",
            onAccept: () => {},
            onReject: () => {},
          },
          facebook: {
            label: "Facebook Ads",
            onAccept: () => {},
            onReject: () => {},
          },
        },
      },
    },

    language: {
      default: "fr",
      translations: {
        en: {
          consentModal: {
            title: "We use cookies",
            description:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
            acceptAllBtn: "Accept all",
            acceptNecessaryBtn: "Reject all",
            showPreferencesBtn: "Manage Individual preferences",
            // closeIconLabel: 'Reject all and close modal',
            footer: `
                        <a href="/impressum" target="_blank" rel="noopener">Impressum</a>
                        <a href="/politique-de-confidentialite" target="_blank" rel="noopener">Privacy Policy</a>
                    `,
          },
          preferencesModal: {
            title: "Manage cookie preferences",
            acceptAllBtn: "Accept all",
            acceptNecessaryBtn: "Reject all",
            savePreferencesBtn: "Accept current selection",
            closeIconLabel: "Close modal",
            serviceCounterLabel: "Service|Services",
            sections: [
              {
                title: "Your Privacy Choices",
                description: `In this panel you can express some preferences related to the processing of your personal information. You may review and change expressed choices at any time by resurfacing this panel via the provided link. To deny your consent to the specific processing activities described below, switch the toggles to off or use the “Reject all” button and confirm you want to save your choices.`,
              },
              {
                title: "Strictly Necessary",
                description:
                  "These cookies are essential for the proper functioning of the website and cannot be disabled.",
                linkedCategory: "necessary",
              },
              {
                title: "Performance and Analytics",
                description:
                  "These cookies collect information about how you use our website. All of the data is anonymized and cannot be used to identify you.",
                linkedCategory: "analytics",
                cookieTable: {
                  caption: "Cookie table",
                  headers: {
                    name: "Cookie",
                    domain: "Domain",
                    desc: "Description",
                  },
                  body: [
                    {
                      name: "_ga",
                      domain: location.hostname,
                      desc: "This cookie is installed by Google Analytics. It stores and updates a unique value for each page visited and is used to maintain the state of session.",
                    },
                    {
                      name: "_gid",
                      domain: location.hostname,
                      desc: "This cookie is installed by Google Analytics. It stores and updates a unique value for each page visited and is used to count and track pageviews.",
                    },
                    {
                      name: "_gat",
                      domain: location.hostname,
                      desc: "This cookie is used by Google Analytics to throttle request rate.",
                    },
                    {
                      name: "_hjIncludedInSample",
                      domain: location.hostname,
                      desc: "This cookie is set to let Hotjar know whether the visitor is included in the sample which is used to generate funnels.",
                    },
                    {
                      name: "_hjid",
                      domain: location.hostname,
                      desc: "Hotjar cookie that is set when the customer first lands on a page with the Hotjar script. It is used to persist the Hotjar User ID, unique to that site on the browser.",
                    },
                    {
                      name: "AWSALB",
                      domain: location.hostname,
                      desc: "This cookie is managed by Amazon Web Services and is used for load balancing.",
                    },
                    {
                      name: "AWSALBCORS",
                      domain: location.hostname,
                      desc: "This cookie is managed by Amazon Web Services and is used for CORS (Cross-Origin Resource Sharing) support.",
                    },
                  ],
                },
              },
              {
                title: "Targeting and Advertising",
                description:
                  "These cookies are used to make advertising messages more relevant to you and your interests. The intention is to display ads that are relevant and engaging for the individual user and thereby more valuable for publishers and third party advertisers.",
                linkedCategory: "ads",
                cookieTable: {
                  caption: "Cookie table",
                  headers: {
                    name: "Cookie",
                    domain: "Domain",
                    desc: "Description",
                  },
                  body: [
                    {
                      name: "VISITOR_INFO1_LIVE",
                      domain: "youtube.com",
                      desc: "This cookie is used to track information about user interaction with embedded videos on YouTube.",
                    },
                    {
                      name: "NID",
                      domain: "google.com",
                      desc: "This cookie is used to display personalized advertisements on Google sites, based on recent searches and interactions.",
                    },
                    {
                      name: "IDE",
                      domain: "doubleclick.net",
                      desc: "This cookie is used by Google DoubleClick to register and report the website user's actions after viewing or clicking one of the advertiser's ads.",
                    },
                    {
                      name: "fr",
                      domain: "facebook.com",
                      desc: "This cookie is used by Facebook to deliver a series of advertisement products such as real-time bidding from third-party advertisers.",
                    },
                    {
                      name: "tr",
                      domain: "facebook.com",
                      desc: "This cookie is used by Facebook to deliver a series of advertisement products such as real-time bidding from third-party advertisers.",
                    },
                    {
                      name: "1P_JAR",
                      domain: "google.com",
                      desc: "This cookie is used to gather website statistics and track conversion rates.",
                    },
                    {
                      name: "APISID",
                      domain: "google.com",
                      desc: "This cookie is used by Google to store user preferences and information of Google maps.",
                    },
                    {
                      name: "HSID",
                      domain: "google.com",
                      desc: "This cookie is used by Google in combination with SID to verify a Google user account and most recent login time.",
                    },
                    {
                      name: "SAPISID",
                      domain: "google.com",
                      desc: "This cookie is used by Google to store user preferences and information of Google maps.",
                    },
                    {
                      name: "SID",
                      domain: "google.com",
                      desc: "This cookie is used by Google in combination with HSID to verify a Google user account and most recent login time.",
                    },
                    {
                      name: "SSID",
                      domain: "google.com",
                      desc: "This cookie is used by Google to store user preferences and information of Google maps.",
                    },
                    {
                      name: "SIDCC",
                      domain: "google.com",
                      desc: "This cookie is used by Google to provide services and extract anonymous information about browsing.",
                    },
                    {
                      name: "OGPC",
                      domain: "google.com",
                      desc: "This cookie is used by Google to provide services and extract anonymous information about browsing.",
                    },
                    {
                      name: "DV",
                      domain: "google.com",
                      desc: "This cookie is used by Google to provide services and extract anonymous information about browsing.",
                    },
                    {
                      name: "DSID",
                      domain: "doubleclick.net",
                      desc: "This cookie is used by Google DoubleClick to register and report the website user's actions after viewing or clicking one of the advertiser's ads.",
                    },
                    {
                      name: "FLC",
                      domain: "doubleclick.net",
                      desc: "This cookie is used by Google DoubleClick to register and report the website user's actions after viewing or clicking one of the advertiser's ads.",
                    },
                    {
                      name: "UULE",
                      domain: "google.com",
                      desc: "This cookie is used to collect information about how visitors use our site.",
                    },
                  ],
                },
              },
              {
                title: "More information",
                description:
                  'For any queries in relation to my policy on cookies and your choices, please <a href="/contact">contact us</a>',
              },
            ],
          },
        },
        fr: {
          consentModal: {
            title: "Bienvenue, cher visiteur! Discutons cookies!",
            description:
              "Eh oui, nous utilisons des cookies. Comme partout, me direz-vous... Certes, mais ici, vous choisissez ceux que vous voulez accepter (ou refuser, évidemment). Alors bon voyage!",
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
            savePreferencesBtn: "Accepter la sélection actuelle",
            closeIconLabel: "Fermer le modal",
            serviceCounterLabel: "Service|Services",
            sections: [
              {
                title: "Vos choix de confidentialité",
                description: `Dans ce panneau, vous pouvez exprimer certaines préférences liées au traitement de vos informations personnelles. Vous pouvez consulter et modifier les choix exprimés à tout moment en réaffichant ce panneau via le lien fourni. Pour refuser votre consentement aux activités de traitement spécifiques décrites ci-dessous, basculez les boutons à bascule sur désactivé ou utilisez le bouton "Tout refuser" et confirmez que vous souhaitez enregistrer vos choix.`,
              },
              {
                title: "Strictement nécessaire",
                description:
                  "Ces cookies sont essentiels au bon fonctionnement du site Web et ne peuvent pas être désactivés.",
                linkedCategory: "necessary",
                cookieTable: {
                  caption: "Tableau des cookies",
                  headers: {
                    name: "Cookie",
                    domain: "Domaine",
                    desc: "Description",
                    type: "Type",
                    expiry: "Expiration",
                  },
                  body: [
                    {
                      name: "__cf_bm",
                      domain: "clerk.lebontemperament.com",
                      desc: "Ce cookie est utilisé pour distinguer les humains des robots.",
                      type: "HTTP",
                      expiry: "1 jour",
                    },
                    {
                      name: "CookieConsent",
                      domain: "lebontemperament.com",
                      desc: "Stocke l'état de consentement aux cookies de l'utilisateur pour le domaine actuel.",
                      type: "HTTP",
                      expiry: "1 an",
                    },
                    {
                      name: "SERVERID",
                      domain: "lebontemperament.com",
                      desc: "Ce cookie est utilisé pour fournir une fonctionnalité d'équilibrage de charge.",
                      type: "HTTP",
                      expiry: "Session",
                    },
                  ],
                },
              },
              {
                title: "Performance et Analytique",
                description:
                  "Ces cookies collectent des informations sur la façon dont vous utilisez notre site Web. Toutes les données sont anonymisées et ne peuvent pas être utilisées pour vous identifier.",
                linkedCategory: "analytics",
                cookieTable: {
                  caption: "Tableau des cookies",
                  headers: {
                    name: "Cookie",
                    domain: "Domaine",
                    desc: "Description",
                  },
                  body: [
                    {
                      name: "_ga",
                      domain: location.hostname,
                      desc: "Ce cookie est installé par Google Analytics. Il stocke et met à jour une valeur unique pour chaque page visitée et est utilisé pour maintenir l'état de la session.",
                    },
                    {
                      name: "_gid",
                      domain: location.hostname,
                      desc: "Ce cookie est installé par Google Analytics. Il stocke et met à jour une valeur unique pour chaque page visitée et est utilisé pour compter et suivre les pages vues.",
                    },
                    {
                      name: "_gat",
                      domain: location.hostname,
                      desc: "Ce cookie est utilisé pour limiter le taux de requêtes.",
                    },
                    {
                      name: "__utma",
                      domain: location.hostname,
                      desc: "Ce cookie garde la trace du nombre de fois qu'un utilisateur a visité le site.",
                    },
                    {
                      name: "__utmb",
                      domain: location.hostname,
                      desc: "Ce cookie garde la trace de l'heure d'arrivée et de départ d'un utilisateur.",
                    },
                    {
                      name: "__utmc",
                      domain: location.hostname,
                      desc: "Ce cookie fonctionne en complément de __utmb pour déterminer si l'utilisateur est dans une nouvelle session/visite.",
                    },
                    {
                      name: "__utmz",
                      domain: location.hostname,
                      desc: "Ce cookie garde la trace de l'origine de l'utilisateur, du moteur de recherche utilisé, du lien cliqué, etc.",
                    },
                  ],
                },
              },
              {
                title: "Ciblage et Publicité",
                description:
                  "Ces cookies sont utilisés pour rendre les messages publicitaires plus pertinents pour vous et vos centres d'intérêt. L'intention est d'afficher des annonces pertinentes et engageantes pour l'utilisateur individuel et donc plus précieuses pour les éditeurs et les annonceurs tiers.",
                linkedCategory: "ads",
                cookieTable: {
                  caption: "Tableau des cookies",
                  headers: {
                    name: "Cookie",
                    domain: "Domaine",
                    desc: "Description",
                  },
                  body: [
                    {
                      name: "VISITOR_INFO1_LIVE",
                      domain: "youtube.com",
                      desc: "Ce cookie est utilisé pour suivre les informations sur l'interaction de l'utilisateur avec les vidéos intégrées sur YouTube.",
                    },
                    {
                      name: "NID",
                      domain: "google.com",
                      desc: "Ce cookie est utilisé pour afficher des publicités personnalisées sur les sites de Google, basées sur les recherches et interactions récentes.",
                    },
                    {
                      name: "yt-remote-fast-check-period",
                      domain: "youtube.com",
                      desc: "Ce cookie est utilisé pour stocker les préférences du lecteur vidéo de l'utilisateur utilisant les vidéos intégrées de YouTube.",
                    },
                    {
                      name: "TESTCOOKIESENABLED",
                      domain: "youtube.com",
                      desc: "Ce cookie est utilisé pour vérifier si le navigateur de l'utilisateur prend en charge les cookies.",
                    },
                    {
                      name: "yt-remote-session-name",
                      domain: "youtube.com",
                      desc: "Ce cookie stocke l'état de la session de l'utilisateur sur différentes vidéos YouTube.",
                    },
                    {
                      name: "yt-remote-connected-devices",
                      domain: "youtube.com",
                      desc: "Ce cookie stocke des informations sur les appareils connectés de l'utilisateur pour YouTube.",
                    },
                    {
                      name: "remote_sid",
                      domain: "youtube.com",
                      desc: "Ce cookie est utilisé pour suivre l'interaction de l'utilisateur avec le contenu intégré.",
                    },
                    {
                      name: "LAST_RESULT_ENTRY_KEY",
                      domain: "youtube.com",
                      desc: "Ce cookie est utilisé pour suivre les résultats des interactions de l'utilisateur avec les vidéos.",
                    },
                    {
                      name: "__Secure-3PSID",
                      domain: "google.com",
                      desc: "Utilisé pour des fins de ciblage afin de construire un profil des intérêts du visiteur du site web afin de montrer des publicités Google pertinentes.",
                    },
                    {
                      name: "__Secure-3PSIDCC",
                      domain: "google.com",
                      desc: "Utilisé pour des fins de ciblage afin de construire un profil des intérêts du visiteur du site web afin de montrer des publicités Google pertinentes.",
                    },
                    {
                      name: "__Secure-3PAPISID",
                      domain: "google.com",
                      desc: "Utilisé pour des fins de ciblage afin de construire un profil des intérêts du visiteur du site web afin de montrer des publicités Google pertinentes.",
                    },
                  ],
                },
              },
              {
                title: "Plus d'informations",
                description:
                  'Pour toute question concernant ma politique sur les cookies et vos choix, veuillez <a href="/contact">nous contacter</a>',
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
