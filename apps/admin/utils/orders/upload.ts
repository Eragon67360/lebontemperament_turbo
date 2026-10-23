"use client";
// Sends an order form straight from the admin's browser to the private bucket
// order-documents (Vercel functions refuse request bodies above about
// 4.5 MB). The storage policies let superadmins write only into the folder
// of an existing order.
import { createClient } from "@/utils/supabase/client";
import {
  ORDER_DOCUMENTS_BUCKET,
  orderDocumentFileName,
  orderDocumentMimeType,
  orderDocumentProblem,
  orderDocumentStorageKey,
} from "@repo/domain/utils/orderDocuments";

export type UploadedOrderDocument = {
  storage_key: string;
  file_name: string;
  mime_type: string;
};

export async function uploadOrderDocument(
  file: File,
  orderId: string,
): Promise<UploadedOrderDocument> {
  const problem = orderDocumentProblem(file);
  const mimeType = orderDocumentMimeType(file.name);
  const fileName = orderDocumentFileName(file.name);
  if (problem || !mimeType || !fileName) throw new Error(problem ?? "");
  const storageKey = orderDocumentStorageKey(
    orderId,
    fileName,
    crypto.randomUUID(),
  );
  const { error } = await createClient()
    .storage.from(ORDER_DOCUMENTS_BUCKET)
    .upload(storageKey, file, { contentType: mimeType, upsert: false });
  if (error) throw new Error("Le fichier n'a pas pu être envoyé.");
  return { storage_key: storageKey, file_name: fileName, mime_type: mimeType };
}
