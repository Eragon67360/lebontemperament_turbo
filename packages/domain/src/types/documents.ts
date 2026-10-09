import type { Tables } from "../database.types";

export type DocumentCollection = Tables<"document_collections">;
export type SiteDocument = Tables<"site_documents">;

export type DocumentVisibility = "public" | "members";
export type DocumentStatus = "published" | "archived";
export type DatePrecision = "day" | "month" | "year";

/** A collection with its published documents, as the website lists them. */
export type DocumentCollectionWithDocuments = Pick<
  DocumentCollection,
  "id" | "slug" | "label" | "description" | "sort_order"
> & {
  documents: Pick<
    SiteDocument,
    | "id"
    | "title"
    | "file_name"
    | "document_date"
    | "date_precision"
    | "visibility"
    | "sort_order"
  >[];
};
