import { Concert, UpdateConcertDTO } from "@/types/concerts";
import { checkAuthorization } from "@/utils/auth";
import { getFileNameFromUrl } from "@/utils/storage";
import { createClient } from "@/utils/supabase/server";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("concerts")
    .select("*")
    .order("date", { ascending: true });

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
      { status: authCheck.status }
    );
  }

  const supabase = await createClient();
  const concert: Concert = await request.json();

  try {
    // First create the concert
    const { data: newConcert, error: concertError } = await supabase
      .from("concerts")
      .insert([{ ...concert, created_by: authCheck?.user?.id }])
      .select()
      .single();

    if (concertError) throw concertError;

    // Then log the activity
    const { error: activityError } = await supabase.from("activities").insert({
      type: "concert_created",
      user_id: authCheck?.user?.id,
      target_id: newConcert.id,
      title: "Nouveau concert",
      description: `Concert ${newConcert.name ? `"${newConcert.name}"` : ""
        } ajouté à ${newConcert.place} pour le ${format(
          new Date(newConcert.date),
          "d MMMM yyyy",
          { locale: fr }
        )}`,
      metadata: {
        concert_id: newConcert.id,
        concert_name: newConcert.name || null,
        concert_date: newConcert.date,
        concert_place: newConcert.place,
      },
    });

    if (activityError) {
      console.error("Error logging activity:", activityError);
      // Don't throw here, just log the error
    }

    return NextResponse.json(newConcert);
  } catch (error) {
    console.error("Error creating concert:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du concert" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  const supabase = await createClient();
  const concert: UpdateConcertDTO = await request.json();
  const { id, ...updateData } = concert;

  const { data, error } = await supabase
    .from("concerts")
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
      { status: authCheck.status }
    );
  }

  const { id } = await request.json();
  const supabase = await createClient();

  try {
    // First, get the concert to check if it has a poster
    const { data: concert, error: fetchError } = await supabase
      .from("concerts")
      .select("affiche")
      .eq("id", id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (concert?.affiche) {
      const fileName = getFileNameFromUrl(concert.affiche);

      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from("concert-posters")
          .remove([fileName]);

        if (storageError) {
          console.error("Error deleting poster:", storageError);
        }
      }
    }

    // Delete the concert
    const { error: deleteError } = await supabase
      .from("concerts")
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
      { status: 500 }
    );
  }
}
