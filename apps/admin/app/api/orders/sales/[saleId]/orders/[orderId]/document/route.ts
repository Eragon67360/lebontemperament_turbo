import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import {
  checkUploadedOrderDocument,
  documentColumns,
  orderDocumentSchema,
  removeOrderDocuments,
} from "@/utils/orders/documents";
import { dbErrorResponse, requireSuperadmin } from "@/utils/orders/server";
import { createClient } from "@/utils/supabase/server";
import { ORDER_DOCUMENTS_BUCKET } from "@repo/domain/utils/orderDocuments";
import { isUuid } from "@repo/domain/utils/orders";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ saleId: string; orderId: string }> };

// A function: a Response body can only be read once, so each request
// needs its own.
const unknown = () =>
  NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

const COLUMNS =
  "id, document_key, document_name, document_mime_type, document_size_bytes, document_added_at";

/**
 * The order form attached to an order (« bon de commande »).
 * GET: a one-minute link to the file (redirect), for « Ouvrir ».
 * PUT: attaches a file the browser has just uploaded to the private bucket,
 * after checking its first bytes; the previous file is removed.
 * DELETE: detaches and removes the file.
 */
export async function GET(_request: Request, { params }: Params) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;
  const { saleId, orderId } = await params;
  if (!isUuid(saleId) || !isUuid(orderId)) return unknown();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("document_key, document_name")
    .eq("id", orderId)
    .eq("sale_id", saleId)
    .maybeSingle();
  if (error) return dbErrorResponse(error, "La commande n'a pas pu être lue");
  if (!data?.document_key) {
    return NextResponse.json(
      { error: "Aucun bon de commande joint" },
      { status: 404 },
    );
  }
  const { data: signed, error: signError } = await supabase.storage
    .from(ORDER_DOCUMENTS_BUCKET)
    .createSignedUrl(data.document_key, 60, {
      download: data.document_name ?? true,
    });
  if (signError || !signed?.signedUrl) {
    return NextResponse.json(
      { error: "Le fichier est introuvable" },
      { status: 404 },
    );
  }
  return NextResponse.redirect(signed.signedUrl, 303);
}

export async function PUT(request: Request, { params }: Params) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;
  const { saleId, orderId } = await params;
  if (!isUuid(saleId) || !isUuid(orderId)) return unknown();

  const parsed = parsePatchBody(
    orderDocumentSchema(orderId),
    await readJson(request),
  );
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const body = parsed.data;

  const supabase = await createClient();
  const { data: before, error: readError } = await supabase
    .from("orders")
    .select("document_key, personal_data_erased_at")
    .eq("id", orderId)
    .eq("sale_id", saleId)
    .maybeSingle();
  if (readError) {
    return dbErrorResponse(readError, "La commande n'a pas pu être lue");
  }
  if (!before) {
    await removeOrderDocuments(supabase, [body.storage_key]);
    return unknown();
  }
  if (before.personal_data_erased_at) {
    await removeOrderDocuments(supabase, [body.storage_key]);
    return NextResponse.json(
      { error: "Les données de cette commande ont été effacées" },
      { status: 409 },
    );
  }

  const check = await checkUploadedOrderDocument(
    supabase,
    body.storage_key,
    body.mime_type,
  );
  if (!check.ok) {
    await removeOrderDocuments(supabase, [body.storage_key]);
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("orders")
    .update(documentColumns({ ...body, size_bytes: check.sizeBytes }))
    .eq("id", orderId)
    .eq("sale_id", saleId)
    .select(COLUMNS)
    .maybeSingle();
  if (error) {
    await removeOrderDocuments(supabase, [body.storage_key]);
    return dbErrorResponse(error, "Le bon de commande n'a pas pu être joint");
  }
  if (!data) return unknown();

  if (before.document_key && before.document_key !== body.storage_key) {
    await removeOrderDocuments(supabase, [before.document_key]);
  }
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;
  const { saleId, orderId } = await params;
  if (!isUuid(saleId) || !isUuid(orderId)) return unknown();

  const supabase = await createClient();
  const { data: before, error: readError } = await supabase
    .from("orders")
    .select("document_key")
    .eq("id", orderId)
    .eq("sale_id", saleId)
    .maybeSingle();
  if (readError) {
    return dbErrorResponse(readError, "La commande n'a pas pu être lue");
  }
  if (!before) return unknown();

  const { error } = await supabase
    .from("orders")
    .update(documentColumns(null))
    .eq("id", orderId)
    .eq("sale_id", saleId);
  if (error) {
    return dbErrorResponse(error, "Le bon de commande n'a pas pu être retiré");
  }
  await removeOrderDocuments(supabase, [before.document_key]);
  return NextResponse.json({ ok: true });
}
