import { CreateTourDTO, UpdateTourDTO } from "@/types/tours";
import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import type { TablesInsert } from "@repo/domain/database.types";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tours")
    .select(
      `
      *,
      concerts:concerts(count)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const toursWithCount = data?.map((tour) => ({
    ...tour,
    concert_count: tour.concerts?.[0]?.count || 0,
  }));

  return NextResponse.json(toursWithCount);
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
  const tour: CreateTourDTO = await request.json();

  try {
    const { data: newTour, error: tourError } = await supabase
      .from("tours")
      .insert([
        {
          ...tour,
          created_by: authCheck?.user?.id,
          is_active: tour.is_active ?? true,
        },
      ])
      .select()
      .single();

    if (tourError) throw tourError;

    // Log the activity
    const { error: activityError } = await supabase.from("activities").insert({
      // Preserve the existing value until the generated enum includes it.
      type: "tour_created" as TablesInsert<"activities">["type"],
      user_id: authCheck?.user?.id,
      target_id: newTour.id,
      title: "Nouvelle tournée",
      description: `Tournée "${newTour.name}" créée`,
      metadata: {
        tour_id: newTour.id,
        tour_name: newTour.name,
        tour_context: newTour.context,
      },
    });

    if (activityError) {
      console.error("Error logging activity:", activityError);
    }

    return NextResponse.json(newTour);
  } catch (error) {
    console.error("Error creating tour:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la tournée" },
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
  const tour: UpdateTourDTO = await request.json();
  const { id, ...updateData } = tour;

  const { data, error } = await supabase
    .from("tours")
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
    // Delete the tour (concerts will have their tour_id set to null due to ON DELETE SET NULL)
    const { error: deleteError } = await supabase
      .from("tours")
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
