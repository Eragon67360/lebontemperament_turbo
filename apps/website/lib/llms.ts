import {
  contactAddressLine,
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
} from "@repo/domain/utils/siteSettings";
import { CONTACT_FORM_PATH } from "./contact";

/** Public pages described in llms.txt, in reading order. */
const PAGES: { path: string; title: string; summary: string }[] = [
  {
    path: "",
    title: "Accueil",
    summary: "prochains concerts et actualités de l’ensemble",
  },
  {
    path: "/decouvrir",
    title: "Découvrir",
    summary: "histoire depuis 1987, chefs, chœurs et orchestre",
  },
  {
    path: "/concerts",
    title: "Concerts",
    summary: "programme des concerts, dates, lieux et réservations",
  },
  {
    path: "/concerts/autres",
    title: "CD",
    summary: "enregistrements de l’ensemble à écouter et à acheter",
  },
  { path: "/galerie", title: "Galerie", summary: "photos et vidéos" },
  {
    path: "/rejoindre",
    title: "Rejoindre",
    summary: "chœurs, répétitions, répétition d’essai et cotisation",
  },
  { path: "/faq", title: "FAQ", summary: "questions fréquentes" },
  {
    path: "/don",
    title: "Faire un don",
    summary: "soutenir l’association",
  },
  {
    path: CONTACT_FORM_PATH,
    title: "Contact",
    summary: "adresse, email et formulaire de contact",
  },
];

/**
 * The site summary served at /llms.txt (https://llmstxt.org): what the
 * association is, its pages, the joining facts and how to reach it, built
 * from the same site settings as the pages so they never disagree.
 */
export function buildLlmsTxt(
  baseUrl: string,
  settings: SiteSettings = DEFAULT_SITE_SETTINGS,
): string {
  const { contact, joining } = settings;
  const url = (path: string) => `${baseUrl}${path}`;
  const lines = [
    "# Le Bon Tempérament",
    "",
    "> Ensemble vocal et instrumental associatif fondé en 1987 à Saverne (Bas-Rhin, Alsace) par Simone Duclos : chœurs pour tous les âges et, depuis 2023, un orchestre symphonique dirigé par Charlotte Lienhard. Concerts en Alsace toute l’année et tournée d’été d’une dizaine de jours.",
    "",
    "Le site est en français. L’espace membres (/membres) est réservé aux membres de l’association.",
    "",
    "## Pages",
    "",
    ...PAGES.map(
      (page) => `- [${page.title}](${url(page.path)}): ${page.summary}`,
    ),
    "",
    "## Rejoindre l’ensemble",
    "",
    joining.intro,
    "",
    `- Lieux : ${joining.where}`,
    `- Horaires : ${joining.when}`,
    `- Âges : ${joining.ages}`,
    `- Audition : ${joining.audition}`,
    `- Lecture de la musique : ${joining.readingMusic}`,
    `- Cotisation : ${joining.fee}`,
    `- Inscription : ${joining.anyTime}`,
    "",
    "## Contact",
    "",
    `- Email : ${contact.email}`,
    `- Formulaire : ${url(CONTACT_FORM_PATH)}`,
    `- Siège : ${contactAddressLine(contact)}`,
    "",
  ];
  return lines.join("\n");
}
