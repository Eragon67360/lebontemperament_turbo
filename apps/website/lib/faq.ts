import type { Database } from "@repo/domain/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CONTACT_EMAIL } from "./contact";
import { JOINING_FACTS } from "./joining";

/**
 * The FAQ (public.faq_items, managed in the admin under Concerts et site
 * public › « Rejoindre et FAQ »): the /faq page and its FAQPage JSON-LD.
 * Until the table exists (its migration is applied by hand), the page shows
 * the questions that were written here before.
 */

export type FaqItem = {
  question: string;
  /** Plain text, rendered as is and copied into the FAQPage JSON-LD. */
  answer: string;
  /** Optional link shown under the answer (not part of the answer text). */
  link?: { href: string; label: string };
};

/** The FAQ as it was written in code before the admin managed it (fallback). */
export const LEGACY_FAQ: readonly FaqItem[] = [
  {
    question: "Qu'est-ce que Le Bon Tempérament?",
    answer:
      "Le Bon Tempérament est un ensemble vocal et instrumental renommé basé à Saverne, en Alsace. Fondé en 1987 par Simone Duclos, l'ensemble se distingue par le mélange des générations, la diversité des parcours des chanteurs et des instrumentistes, et l'esprit de convivialité qui l'anime. Nous interprétons un répertoire varié allant de la musique classique sacrée et profane à des pièces populaires et folkloriques.",
  },
  {
    question: "Quand ont lieu les concerts du Bon Tempérament?",
    answer:
      "Le Bon Tempérament organise des concerts tout au long de l'année, avec une tournée estivale de dix jours. Les dates exactes sont disponibles sur notre page concerts. Nous répétons également un dimanche par mois, et les répétitions de pupitres ont lieu tous les 15 jours.",
  },
  {
    question: "Comment rejoindre Le Bon Tempérament?",
    answer: `Le Bon Tempérament accueille des choristes amateurs, des chanteurs solistes professionnels et des instrumentistes de tous horizons. Écrivez-nous à ${CONTACT_EMAIL} ou par le formulaire de contact : nous vous proposerons une répétition d'essai, puis c'est vous qui décidez si vous restez. Notre page Rejoindre donne toutes les informations sur l'adhésion.`,
    link: { href: "/rejoindre", label: "Découvrir la page Rejoindre" },
  },
  {
    question: "Y a-t-il une audition pour entrer dans le chœur?",
    answer: JOINING_FACTS.audition,
  },
  {
    question: "Faut-il savoir lire la musique?",
    answer: JOINING_FACTS.readingMusic,
  },
  {
    question: "À partir de quel âge peut-on rejoindre Le Bon Tempérament?",
    answer: JOINING_FACTS.ages,
  },
  {
    question: "Quand peut-on rejoindre l'ensemble?",
    answer: JOINING_FACTS.anyTime,
  },
  {
    question: "Faut-il avoir de l'expérience musicale pour rejoindre?",
    answer:
      "Non, il n'est pas nécessaire d'avoir une expérience musicale préalable pour rejoindre certains de nos chœurs. Le Bon Tempérament accueille des membres de tous niveaux. Nous avons différents chœurs adaptés à différents niveaux : un chœur d'adultes, un chœur de jeunes, et un chœur des tout-jeunes. L'important est la motivation et l'envie de partager la passion pour la musique.",
  },
  {
    question: "Où se déroulent les concerts?",
    answer:
      "Nos concerts se déroulent principalement à Saverne et dans la région Alsace, mais nous organisons également des tournées dans d'autres régions de France. Les lieux exacts sont indiqués sur chaque affiche de concert et sur notre page concerts. Certains concerts peuvent également avoir lieu dans des églises, des salles de spectacle, ou lors de festivals.",
  },
  {
    question: "Les concerts sont-ils payants?",
    answer:
      "Les tarifs varient selon les concerts. Certains événements sont gratuits, d'autres nécessitent une réservation avec un tarif d'entrée. Les informations de tarification et de réservation sont toujours indiquées sur les affiches de concert et sur notre site web. Pour plus d'informations, n'hésitez pas à nous contacter.",
  },
  {
    question: "Qui dirige Le Bon Tempérament?",
    answer:
      "Le Bon Tempérament est dirigé par Simone Duclos depuis sa création en 1987. L'orchestre symphonique, créé en 2023, est dirigé par Charlotte Lienhard. Nous avons également Camille Gerlier-Lienhard qui dirige le chœur des enfants, et Chloé Rozaire qui dirige le chœur des jeunes.",
  },
  {
    question: "Quels types de musique sont interprétés?",
    answer:
      "Le Bon Tempérament se distingue par la diversité musicale de son répertoire. Nous interprétons des œuvres variées allant de la musique classique sacrée et profane à des pièces populaires et folkloriques, couvrant une large période musicale de la Renaissance à nos jours. Notre programme inclut notamment des opéras, de la musique baroque, des œuvres chorales contemporaines, et des adaptations de musique populaire.",
  },
  {
    question: "Comment puis-je être informé des prochains concerts?",
    answer:
      "Plusieurs moyens de rester informé : consultez régulièrement notre site web, abonnez-vous à notre newsletter en utilisant le formulaire sur la page contact, suivez-nous sur nos réseaux sociaux (Facebook, Instagram, YouTube, TikTok), ou contactez-nous directement pour être ajouté à notre liste de diffusion.",
  },
  {
    question: "Le Bon Tempérament propose-t-il des cours de musique?",
    answer:
      "Le Bon Tempérament est avant tout un ensemble de pratique musicale en groupe. Nous ne proposons pas de cours individuels, mais la participation aux répétitions et aux concerts permet d'apprendre et de progresser dans la pratique vocale et instrumentale. Les enfants découvrent la musique à travers le chant, la pratique instrumentale et l'interprétation de spectacles musicaux.",
  },
  {
    question: "Y a-t-il des frais d'adhésion?",
    answer: JOINING_FACTS.fee,
  },
  {
    question: "Le Bon Tempérament vend-il des CDs?",
    answer:
      "Oui, Le Bon Tempérament a enregistré plusieurs CDs que vous pouvez découvrir et acheter. Consultez notre page 'Autres concerts' pour voir nos productions disponibles. Les CDs sont également disponibles lors de certains de nos concerts.",
  },
  {
    question: "Le Bon Tempérament part-il en tournée?",
    answer:
      "Oui. Chaque été, Le Bon Tempérament organise une tournée d'une dizaine de jours dans une autre région de France. C'est au cours de ces séjours que se peaufine le programme de l'année et que se tissent les liens entre les membres de l'ensemble.",
  },
  {
    question: "Où ont lieu les répétitions?",
    answer: JOINING_FACTS.where,
  },
  {
    question: "Quand ont lieu les répétitions?",
    answer: JOINING_FACTS.when,
    link: { href: "/rejoindre#repetitions", label: "Voir les répétitions" },
  },
];

/** Published questions in the admin's order, or the legacy list. */
export async function listFaq(
  supabase: SupabaseClient<Database>,
): Promise<readonly FaqItem[]> {
  const { data, error } = await supabase
    .from("faq_items")
    .select("question, answer, link_href, link_label")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("FAQ unavailable, showing the built-in one:", error.message);
    return LEGACY_FAQ;
  }
  return data.map((row) => ({
    question: row.question,
    answer: row.answer,
    ...(row.link_href && row.link_label
      ? { link: { href: row.link_href, label: row.link_label } }
      : {}),
  }));
}
