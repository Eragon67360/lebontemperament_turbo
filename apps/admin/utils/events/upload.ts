"use client";
// Sends an event file straight from the admin's browser to the site-media
// bucket (Vercel functions refuse request bodies above about 4.5 MB). The
// storage policies allow admins to write under events/ only.
import { createClient } from "@/utils/supabase/client";
import {
  EVENT_DOCUMENT_MAX_BYTES,
  eventDocumentFileName,
  eventDocumentMimeType,
  eventDocumentStorageKey,
} from "@repo/domain/utils/eventDocuments";
import { EVENT_DOCUMENTS_BUCKET } from "./bucket";

export type UploadedEventFile = {
  storageKey: string;
  fileName: string;
  mimeType: string;
};

/** Why `file` can't be attached, or null when it can. */
export function eventFileProblem(file: File): string | null {
  if (!eventDocumentMimeType(file.name)) {
    return "Choisissez un fichier PDF, Word (.doc, .docx) ou Excel (.xls, .xlsx).";
  }
  if (file.size === 0) return "Le fichier est vide.";
  if (file.size > EVENT_DOCUMENT_MAX_BYTES) {
    return "Le fichier dépasse 20 Mo.";
  }
  return null;
}

export async function uploadEventFile(
  file: File,
  eventId: string,
): Promise<UploadedEventFile> {
  const problem = eventFileProblem(file);
  const mimeType = eventDocumentMimeType(file.name);
  const fileName = eventDocumentFileName(file.name);
  if (problem || !mimeType || !fileName) throw new Error(problem ?? "");
  const storageKey = eventDocumentStorageKey(
    eventId,
    fileName,
    crypto.randomUUID(),
  );
  const { error } = await createClient()
    .storage.from(EVENT_DOCUMENTS_BUCKET)
    .upload(storageKey, file, {
      contentType: mimeType,
      cacheControl: "31536000",
      upsert: false,
    });
  if (error) throw new Error("Le fichier n'a pas pu être envoyé.");
  return { storageKey, fileName, mimeType };
}
