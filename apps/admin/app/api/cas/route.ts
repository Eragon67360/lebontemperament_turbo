import { UpdateCADTO } from "@/types/ca";
import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { CA } from "@repo/domain/types/ca";
import { getFileNameFromUrl } from "@repo/domain/utils/storage";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cas")
    .select("*")
    .order("date_from", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

  const supabase = await createClient();
  const caData: CA = await request.json();

  try {
    // First create the CA record
    const { data: newCA, error: caError } = await supabase
      .from("cas")
      .insert([{ ...caData, created_by: authCheck.user.id }])
      .select()
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
    console.error("Error creating CA:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du CA" },
      { status: 500 },
    );
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

  const supabase = await createClient();
  const ca: UpdateCADTO = await request.json();
  const { id, ...updateData } = ca;

  const { data, error } = await supabase
    .from("cas")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

  const { id } = await request.json();
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
    console.error("Delete operation error:", error);
    return NextResponse.json(
      { error: "Delete operation failed" },
      { status: 500 },
    );
  }
}
