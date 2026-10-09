"use client";
// Sends a PDF straight from the admin's browser to the site-media bucket
// (Vercel functions refuse request bodies above about 4.5 MB, gazettes are
// bigger). The storage policies allow admins to write under documents/ only.
import { createClient } from "@/utils/supabase/client";
import {
  DOCUMENT_MAX_BYTES,
  documentFileName,
  documentStorageKey,
} from "@repo/domain/utils/documents";
import { DOCUMENTS_BUCKET } from "./storage";

export type UploadedDocument = { storageKey: string; fileName: string };

export async function uploadDocumentPdf(
  file: File,
  collectionSlug: string,
): Promise<UploadedDocument> {
  if (file.type !== "application/pdf") {
    throw new Error("Choisissez un fichier PDF.");
  }
  if (file.size > DOCUMENT_MAX_BYTES) {
    throw new Error("Le PDF dépasse 25 Mo.");
  }
  const fileName = documentFileName(file.name);
  const storageKey = documentStorageKey(
    collectionSlug,
    fileName,
    crypto.randomUUID(),
  );
  const { error } = await createClient()
    .storage.from(DOCUMENTS_BUCKET)
    .upload(storageKey, file, {
      contentType: "application/pdf",
      cacheControl: "31536000",
      upsert: false,
    });
  if (error) throw new Error("Le PDF n'a pas pu être envoyé.");
  return { storageKey, fileName };
}
