import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import {
  concertCreateSchema,
  concertPatchSchema,
} from "@/utils/concerts/apiSchemas";
import { generateConcertEventDataAfterResponse } from "@/utils/concerts/eventData";
import { touchesEventDataInputs } from "@/utils/concerts/eventDataSummary";
import {
  REVALIDATE,
  revalidateWebsiteAfterResponse,
} from "@/utils/revalidateWebsite";
import { createClient } from "@/utils/supabase/server";
import { getFileNameFromUrl } from "@repo/domain/utils/storage";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { NextResponse } from "next/server";

// The AI fill of the event data runs after the response (#328).
export const maxDuration = 60;

/** The admin's access token, forwarded to the event-data function. */
async function accessToken(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | undefined> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
}

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
      { status: authCheck.status },
    );
  }

  // Only the columns the concert dialog sends (#489).
  const parsed = parsePatchBody(concertCreateSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: parsed.status },
    );
  }
  const concert = parsed.data;
  const supabase = await createClient();

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
      description: `Concert ${
        newConcert.name ? `"${newConcert.name}"` : ""
      } ajouté à ${newConcert.place} pour le ${format(
        new Date(newConcert.date),
        "d MMMM yyyy",
        { locale: fr },
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

    revalidateWebsiteAfterResponse(REVALIDATE.agenda);
    generateConcertEventDataAfterResponse(
      newConcert.id,
      await accessToken(supabase),
    );
    return NextResponse.json(newConcert);
  } catch (error) {
    console.error("Error creating concert:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du concert" },
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

  // Only the columns the screen edits (#489): unknown keys are refused.
  const parsed = parsePatchBody(concertPatchSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: parsed.status },
    );
  }
  const { id, ...updateData } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("concerts")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateWebsiteAfterResponse(REVALIDATE.agenda);
  if (touchesEventDataInputs(updateData)) {
    generateConcertEventDataAfterResponse(id, await accessToken(supabase));
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

    revalidateWebsiteAfterResponse(REVALIDATE.agenda);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete operation error:", error);
    return NextResponse.json(
      { error: "Delete operation failed" },
      { status: 500 },
    );
  }
}
