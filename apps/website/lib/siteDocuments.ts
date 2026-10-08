import type { Database } from "@repo/domain/database.types";
import {
  documentDateLabel,
  documentPath,
  sortDocuments,
} from "@repo/domain/utils/documents";
import type { SupabaseClient } from "@supabase/supabase-js";
import legacyAg from "../public/json/pdf_filesAG.json";
import legacyGazettes from "../public/json/pdf_filesGazettes.json";
import legacyPm from "../public/json/pdf_filesPM.json";
import manifest from "./mediaManifest.json";

/**
 * « Documents de l'association » (public.site_documents, managed in the
 * admin): what the members area and the app list, and where each document's
 * address leads. Until the table exists (its migration is applied by hand),
 * readers fall back to the lists that were hard-coded before.
 */

export type ListedDocument = {
  id: string;
  title: string;
  /** 21/06/2025, août 2024, 2024, or null. */
  dateLabel: string | null;
  visibility: "public" | "members";
  /** Path on the website: /documents/<collection>/<file>. */
  href: string;
};

export type ListedCollection = {
  slug: string;
  label: string;
  description: string | null;
  documents: ListedDocument[];
};

type Client = SupabaseClient<Database>;

/**
 * Published collections and documents the caller may read (row-level
 * security decides: visitors get public documents, members everything).
 * Empty collections are left out.
 */
export async function listDocumentCollections(
  supabase: Client,
): Promise<{ collections: ListedCollection[]; source: "table" | "legacy" }> {
  const [collectionsResult, documentsResult] = await Promise.all([
    supabase
      .from("document_collections")
      .select("id, slug, label, description, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("site_documents")
      .select(
        "id, collection_id, title, file_name, document_date, date_precision, visibility, sort_order",
      )
      .eq("status", "published"),
  ]);

  if (collectionsResult.error || documentsResult.error) {
    console.warn(
      "[siteDocuments] falling back to the legacy lists:",
      collectionsResult.error?.message ?? documentsResult.error?.message,
    );
    return { collections: legacyCollections(), source: "legacy" };
  }

  const collections = collectionsResult.data
    .map((collection) => ({
      slug: collection.slug,
      label: collection.label,
      description: collection.description,
      documents: sortDocuments(
        documentsResult.data.filter((d) => d.collection_id === collection.id),
      ).map((d) => ({
        id: d.id,
        title: d.title,
        dateLabel: documentDateLabel(d.document_date, d.date_precision),
        visibility: d.visibility === "public" ? "public" : "members",
        href: documentPath(collection.slug, d.file_name),
      })) satisfies ListedDocument[],
    }))
    .filter((collection) => collection.documents.length > 0);

  return { collections, source: "table" };
}

const storageKeys = new Set(manifest.files.map((file) => file.key));

/**
 * Public URL of an object in site-media. Files moved there by #344 are read
 * from the production bucket (the manifest's base URL), so they open on
 * staging too; new uploads from the project the site is connected to.
 */
export function documentObjectUrl(storageKey: string): string {
  const encoded = storageKey.split("/").map(encodeURIComponent).join("/");
  if (storageKeys.has(storageKey)) return `${manifest.baseUrl}/${encoded}`;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-media/${encoded}`;
}

type LegacyEntry = { name: string; date: string };

function legacyDocuments(
  folder: string,
  entries: LegacyEntry[],
  title: (entry: LegacyEntry) => string,
): ListedDocument[] {
  return entries.map((entry) => ({
    id: `${folder}/${entry.name}`,
    title: title(entry),
    dateLabel: null,
    visibility: "members",
    href: `/pdf/${folder}/${entry.name.split("/").map(encodeURIComponent).join("/")}`,
  }));
}

const legacyDate = (date: string) => date.replaceAll("-", "/");

/** The three lists the members area showed before the table. */
export function legacyCollections(): ListedCollection[] {
  return [
    {
      slug: "ag",
      label: "Comptes-rendus AG",
      description: "Archives des assemblées générales",
      documents: legacyDocuments("AG", legacyAg, (e) => `AG de ${e.date}`),
    },
    {
      slug: "gazettes",
      label: "Gazettes",
      description: "Archives des gazettes",
      documents: legacyDocuments(
        "Gazettes",
        legacyGazettes,
        (e) => `Gazette du ${legacyDate(e.date)}`,
      ),
    },
    {
      slug: "programmes",
      label: "Programmes de concert",
      description: "Les programmes distribués aux concerts",
      documents: [
        {
          id: "Programmes/Entre_Terre_et_Ciel_2025.pdf",
          title: "Entre Terre et Ciel",
          dateLabel: "2025",
          visibility: "public",
          href: "/pdf/Programmes/Entre_Terre_et_Ciel_2025.pdf",
        },
      ],
    },
    {
      slug: "pele-mele",
      label: "Pêle-Mêle",
      description: "Archives diverses",
      documents: legacyDocuments(
        "PM",
        legacyPm,
        (e) => `Pêle-Mêle N°${e.date}`,
      ),
    },
  ];
}
