/**
 * Copy of the section link-preview cards, one entry per public page that
 * has its own `opengraph-image.tsx`. `label` is the small teal line, `title`
 * the headline, `lines` at most two lines under it, `path` the address in
 * the card's footer. `alt` is the image's description for screen readers
 * and the `og:image:alt` tag.
 */
export type OgSection = {
  label: string;
  title: string;
  lines: string[];
  path: string;
  alt: string;
  /** Shows a padlock before the label (members area). */
  locked?: boolean;
};

export const OG_SECTIONS = {
  concerts: {
    label: "Agenda",
    title: "Agenda des concerts",
    lines: ["Prochains concerts, tournées et histoires", "de nos concerts."],
    path: "/concerts",
    alt: "Agenda des concerts du Bon Tempérament",
  },
  disques: {
    label: "Écouter",
    title: "Nos disques",
    lines: [
      "Les enregistrements du chœur et de l’orchestre,",
      "dont King Arthur et Camino Latino.",
    ],
    path: "/concerts/autres",
    alt: "Les disques du Bon Tempérament",
  },
  decouvrir: {
    label: "Nous découvrir",
    title: "Chœur et orchestre à Saverne",
    lines: ["Notre histoire, nos ensembles et notre passion", "depuis 1987."],
    path: "/decouvrir",
    alt: "Découvrir Le Bon Tempérament, chœur et orchestre à Saverne",
  },
  galerie: {
    label: "Galerie",
    title: "Photos et vidéos",
    lines: ["Nos concerts, nos événements et nos répétitions", "en images."],
    path: "/galerie",
    alt: "Galerie photos et vidéos du Bon Tempérament",
  },
  rejoindre: {
    label: "Rejoindre le chœur ou l’orchestre",
    title: "Venez chanter avec nous",
    lines: [
      "Sans audition, sans savoir lire la musique :",
      "une répétition d’essai suffit pour commencer.",
    ],
    path: "/rejoindre",
    alt: "Rejoindre Le Bon Tempérament : venez chanter avec nous",
  },
  don: {
    label: "Soutenir l’association",
    title: "Faire un don",
    lines: [
      "Votre don fait vivre nos concerts.",
      "Il ouvre droit à une réduction d’impôt de 66 %.",
    ],
    path: "/don",
    alt: "Faire un don au Bon Tempérament",
  },
  faq: {
    label: "Questions fréquentes",
    title: "Vos questions, nos réponses",
    lines: ["Concerts, répétitions, adhésion et informations", "pratiques."],
    path: "/faq",
    alt: "Questions fréquentes sur Le Bon Tempérament",
  },
  contact: {
    label: "Contact",
    title: "Nous écrire",
    lines: [
      "Une question, l’envie de nous rejoindre ou de venir",
      "au concert ? Écrivez-nous.",
    ],
    path: "/contact",
    alt: "Contacter Le Bon Tempérament",
  },
  mentionsLegales: {
    label: "Informations légales",
    title: "Mentions légales",
    lines: [
      "Association éditrice, direction de la publication",
      "et hébergeurs du site.",
    ],
    path: "/mentions-legales",
    alt: "Mentions légales du site du Bon Tempérament",
  },
  confidentialite: {
    label: "Vos données",
    title: "Politique de confidentialité",
    lines: [
      "Données collectées, cookies, durées de conservation",
      "et vos droits.",
    ],
    path: "/politique-de-confidentialite",
    alt: "Politique de confidentialité du Bon Tempérament",
  },
  ag2026: {
    label: "Vie de l’association",
    title: "Assemblée générale 2026",
    lines: ["Convocation et formulaire de procuration."],
    path: "/ag-2026",
    alt: "Assemblée générale 2026 du Bon Tempérament",
  },
  membres: {
    label: "Espace membres",
    title: "Réservé aux choristes et musiciens",
    lines: ["Partitions, répétitions et agenda, après connexion."],
    path: "/membres",
    alt: "Espace membres du Bon Tempérament",
    locked: true,
  },
  anniversaire: {
    label: "Anniversaire",
    title: "40 ans du Bon Tempérament",
    lines: ["Souvenirs, témoignages et archives."],
    path: "/40-ans",
    alt: "Les 40 ans du Bon Tempérament",
  },
  archives: {
    label: "40 ans · Archives",
    title: "Archives des 40 ans",
    lines: [
      "Rapports d’assemblée générale, documents officiels",
      "et programmes de concerts.",
    ],
    path: "/40-ans/archives",
    alt: "Archives des 40 ans du Bon Tempérament",
  },
} satisfies Record<string, OgSection>;

export type OgSectionKey = keyof typeof OG_SECTIONS;
