import type { Database } from "@repo/domain/database.types";
import { documentPath } from "@repo/domain/utils/documents";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The general assembly shown at /ag and announced on the home page
 * (public.general_assemblies, edited in the admin under Association ›
 * Assemblée générale). Until the table exists (its migration is applied by
 * hand), readers fall back to the 2026 AG that used to be hard-coded.
 */

export type AssemblyDocument = { title: string; href: string };

export type Assembly = {
  heldAt: string;
  place: string;
  practicalNote: string | null;
  /** Markdown, each shown under its own heading when filled in. */
  reminders: string | null;
  votingRights: string | null;
  agenda: string | null;
  afterwards: string | null;
  convocation: AssemblyDocument | null;
  proxy: AssemblyDocument | null;
};

/** The page that /ag replaced (app/ag-2026), word for word. */
export const LEGACY_ASSEMBLY: Assembly = {
  heldAt: "2026-03-14T18:00:00.000Z",
  place: "Freihof, Wangen",
  practicalNote: "Le parking se fera devant la salle des fêtes.",
  reminders:
    "- Si vous ne pouvez pas être présent, il est **impératif** de donner une procuration pour que cette AG statutaire puisse se tenir valablement.\n- Un membre ne peut avoir que **deux procurations maximum**.\n- L'an dernier, l'AG a failli être annulée car il manquait une voix. Chaque procuration compte !",
  votingRights:
    "Ont le droit de vote tous les membres de plus de 16 ans à la date de l'AG, à jour de leurs cotisations pour l'année 2025, et membres depuis plus de 6 mois. Afin que les votes soient recevables, le CA rappelle l'importance que toutes les personnes répondant à ces critères et ne pouvant être présentes se fassent représenter par un membre présent à l'aide d'une procuration.",
  agenda:
    "Lors de cette AG, nous procéderons à l'élection du nouveau CA. C'est l'occasion de rejoindre cette instance qui gère l'association tout au long de l'année.",
  afterwards:
    "Cette AG sera suivie d'un apéritif dînatoire partagé amené par vos soins. La boisson sera fournie par l'association. **Apportez vos verres.**",
  convocation: {
    title: "Convocation",
    href: "/pdf/AG_2026/convocation_AG_2026.pdf",
  },
  proxy: {
    title: "Formulaire de procuration",
    href: "/pdf/AG_2026/procuration_AG_2026.pdf",
  },
};

type LinkedDocument = {
  title: string;
  file_name: string;
  status: string;
  document_collections: { slug: string } | null;
} | null;

function linkedDocument(row: LinkedDocument): AssemblyDocument | null {
  // Row-level security hides members-only documents from visitors: the
  // button only appears for documents marked public.
  if (!row || row.status !== "published" || !row.document_collections) {
    return null;
  }
  return {
    title: row.title,
    href: documentPath(row.document_collections.slug, row.file_name),
  };
}

/**
 * The newest published general assembly, `null` when none is published, or
 * the legacy 2026 AG when the table can't be read.
 */
export async function getCurrentAssembly(
  supabase: SupabaseClient<Database>,
): Promise<Assembly | null> {
  const { data, error } = await supabase
    .from("general_assemblies")
    .select(
      "held_at, place, practical_note, reminders, voting_rights, agenda, afterwards, convocation:site_documents!general_assemblies_convocation_document_id_fkey(title, file_name, status, document_collections(slug)), proxy:site_documents!general_assemblies_proxy_document_id_fkey(title, file_name, status, document_collections(slug))",
    )
    .eq("status", "published")
    .order("held_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("General assembly unavailable, showing 2026:", error.message);
    return LEGACY_ASSEMBLY;
  }
  if (!data) return null;

  return {
    heldAt: data.held_at,
    place: data.place,
    practicalNote: data.practical_note,
    reminders: data.reminders,
    votingRights: data.voting_rights,
    agenda: data.agenda,
    afterwards: data.afterwards,
    convocation: linkedDocument(data.convocation),
    proxy: linkedDocument(data.proxy),
  };
}
