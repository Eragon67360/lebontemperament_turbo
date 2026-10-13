import type { Database } from "@repo/domain/database.types";
import { DEFAULT_SITE_SETTINGS } from "@repo/domain/utils/siteSettings";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Facts about joining the ensemble, given by the owner on 2026-10-06 (#334)
 * and checked against the rehearsals table (places, weekdays and times of the
 * 2026-2027 season). The Join page, the FAQ and llms.txt all read them, so
 * search and AI engines get one answer.
 *
 * The facts and the rehearsal slots are now edited in the admin (site
 * settings, and `listRehearsalSlots` below with REHEARSAL_SLOTS as its
 * fallback). JOINING_FACTS is the facts' fallback, the built-in FAQ's source
 * (server code only, like lib/contact.ts). The agenda in the members area
 * stays the reference for exact dates.
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

export const JOINING_FACTS = DEFAULT_SITE_SETTINGS.joining;

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
