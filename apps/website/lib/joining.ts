import type { Database } from "@repo/domain/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Facts about joining the ensemble, given by the owner on 2026-10-06 (#334)
 * and checked against the rehearsals table (places, weekdays and times of the
 * 2026-2027 season). The Join page, the FAQ and llms.txt all read them, so
 * search and AI engines get one answer.
 *
 * The rehearsal slots are now edited in the admin (`listRehearsalSlots`
 * below; REHEARSAL_SLOTS is their fallback). When the facts change, update
 * this file: the agenda in the members area stays the reference for exact
 * dates.
 */

export type RehearsalSlot = {
  group: string;
  day: string;
  time: string;
  /** Where, with its preposition: « à Wangen », « au Conservatoire… ». */
  place: string;
  rhythm: string;
};

export const REHEARSAL_SLOTS: readonly RehearsalSlot[] = [
  {
    group: "Pupitres de femmes",
    day: "mercredi",
    time: "20 h 30 – 22 h",
    place: "à Nordheim",
    rhythm: "toutes les deux semaines",
  },
  {
    group: "Pupitres d’hommes",
    day: "samedi",
    time: "10 h – 11 h 30",
    place: "à Wangen",
    rhythm: "toutes les deux semaines",
  },
  {
    group: "Chœur complet",
    day: "dimanche",
    time: "9 h 30 – 16 h",
    place: "à Wangen",
    rhythm: "environ une fois par mois",
  },
  {
    group: "Orchestre",
    day: "jeudi",
    time: "19 h 45 – 21 h 45",
    place: "au Conservatoire de Strasbourg",
    rhythm: "selon le calendrier de l’orchestre",
  },
];

export const JOINING_FACTS = {
  /** First paragraph of the Join page: who, what, where, when. */
  intro:
    "Le Bon Tempérament est un ensemble vocal et instrumental associatif, fondé en 1987 à Saverne (Bas-Rhin), avec des chœurs pour tous les âges et, depuis 2023, un orchestre symphonique. Il accueille les chanteurs et les instrumentistes de tous niveaux, sans audition et sans obligation de lire la musique. Le chœur d’adultes répète principalement à Wangen et à Nordheim : le mercredi soir pour les femmes, le samedi matin pour les hommes et un dimanche par mois pour le chœur complet ; l’orchestre répète le jeudi soir au Conservatoire de Strasbourg. Vous pouvez nous rejoindre à tout moment de l’année, en commençant par une répétition d’essai.",
  where:
    "Les répétitions ont lieu en plusieurs endroits du Bas-Rhin : principalement à Wangen et à Nordheim pour le chœur d’adultes, et au Conservatoire de Strasbourg pour l’orchestre. Nous vous indiquons le lieu de votre répétition d’essai quand vous nous contactez ; les membres retrouvent ensuite chaque répétition dans leur agenda.",
  when: "Pour le chœur d’adultes, en général : le mercredi de 20 h 30 à 22 h pour les pupitres de femmes et le samedi de 10 h à 11 h 30 pour les pupitres d’hommes, toutes les deux semaines ; le dimanche de 9 h 30 à 16 h, environ une fois par mois, pour le chœur complet. L’orchestre répète le jeudi de 19 h 45 à 21 h 45. Les chœurs d’enfants et de jeunes ont leurs propres horaires : demandez-les-nous.",
  ages: "Tous les âges sont les bienvenus, des enfants aux seniors : le chœur des tout-jeunes, le chœur de jeunes, le chœur d’adultes et l’orchestre mêlent les générations.",
  audition:
    "Il n’y a pas d’audition. Vous venez à une répétition d’essai, puis c’est vous qui décidez si vous restez.",
  readingMusic:
    "Non, il n’est pas nécessaire de savoir lire la musique pour chanter dans le chœur. L’important est l’envie de chanter ensemble.",
  fee: "La cotisation est d’environ 40 € par an pour un adulte qui travaille, partitions comprises. Une commission de solidarité aide les membres qui en ont besoin.",
  anyTime:
    "Vous pouvez nous rejoindre à tout moment de l’année, il n’y a pas de date limite d’inscription.",
} as const;

/**
 * The usual rehearsals shown on /rejoindre (public.joining_slots, managed in
 * the admin under Concerts et site public › « Rejoindre et FAQ »), in the
 * admin's order. While the table can't be read or holds no published slot,
 * the list above.
 */
export async function listRehearsalSlots(
  supabase: SupabaseClient<Database>,
): Promise<readonly RehearsalSlot[]> {
  const { data, error } = await supabase
    .from("joining_slots")
    .select("group_name, day, time_label, place, rhythm")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Rehearsal slots unavailable:", error.message);
    return REHEARSAL_SLOTS;
  }
  if (data.length === 0) return REHEARSAL_SLOTS;
  return data.map((row) => ({
    group: row.group_name,
    day: row.day,
    time: row.time_label,
    place: row.place,
    rhythm: row.rhythm,
  }));
}
