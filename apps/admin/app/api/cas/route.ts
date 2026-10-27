import { CA_COLUMNS } from "@/lib/columns";
import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import {
  caCreateSchema,
  caDeleteSchema,
  caPatchSchema,
} from "@/utils/ca/apiSchemas";
import { databaseErrorResponse } from "@/utils/databaseErrors";
import { createClient } from "@/utils/supabase/server";
import { getFileNameFromUrl } from "@repo/domain/utils/storage";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { NextResponse } from "next/server";

export async function GET() {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cas")
    .select(CA_COLUMNS)
    .order("date_from", { ascending: false });

  if (error) {
    return databaseErrorResponse(
      error,
      "Les comptes rendus n'ont pas pu être chargés",
    );
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  // Only the columns the page sends; `created_by` is the signed-in admin.
  const parsed = parsePatchBody(caCreateSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: parsed.status },
    );
  }
  const supabase = await createClient();

  try {
    // First create the CA record
    const { data: newCA, error: caError } = await supabase
      .from("cas")
      .insert([{ ...parsed.data, created_by: authCheck.user.id }])
      .select(CA_COLUMNS)
      .single();

    if (caError) throw caError;

    // Then log the activity
    const { error: activityError } = await supabase.from("activities").insert({
      type: "ca_created",
      user_id: authCheck?.user?.id,
      target_id: newCA.id,
      title: "Nouveau compte-rendu CA",
      description: `Compte-rendu CA "${newCA.title}" ajouté pour le ${format(
        new Date(newCA.date_from),
        "d MMMM yyyy",
        { locale: fr },
      )}`,
      metadata: {
        ca_id: newCA.id,
        ca_title: newCA.title,
        ca_date: newCA.date_from,
      },
    });

    if (activityError) {
      console.error("Error logging activity:", activityError);
      // Don't throw here, just log the error
    }

    return NextResponse.json(newCA);
  } catch (error) {
    return databaseErrorResponse(error, "Erreur lors de la création du CA");
  }
}

export async function PATCH(request: Request) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  // Only the page's columns: unknown keys are refused.
  const parsed = parsePatchBody(caPatchSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: parsed.status },
    );
  }
  const { id, ...updateData } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cas")
    .update(updateData)
    .eq("id", id)
    .select(CA_COLUMNS)
    .single();

  if (error) {
    return databaseErrorResponse(error, "Erreur lors de la modification du CA");
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  const parsed = parsePatchBody(caDeleteSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: parsed.status },
    );
  }
  const { id } = parsed.data;
  const supabase = await createClient();

  try {
    // First, get the CA record to check if it has a file
    const { data: ca, error: fetchError } = await supabase
      .from("cas")
      .select("file_url")
      .eq("id", id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (ca?.file_url) {
      const fileName = getFileNameFromUrl(ca.file_url);

      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from("ca-documents")
          .remove([fileName]);

        if (storageError) {
          console.error("Error deleting file:", storageError);
        }
      }
    }

    // Delete the CA record
    const { error: deleteError } = await supabase
      .from("cas")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return databaseErrorResponse(error, "Erreur lors de la suppression du CA");
  }
}
