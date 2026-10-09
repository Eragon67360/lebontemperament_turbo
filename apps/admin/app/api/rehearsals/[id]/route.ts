import { REHEARSAL_COLUMNS } from "@/lib/columns";
import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  try {
    const supabase = await createClient();
    const id = (await params).id;
    const { data, error } = await supabase
      .from("rehearsals")
      .select(REHEARSAL_COLUMNS)
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: "Rehearsal not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error fetching rehearsal" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  try {
    const supabase = await createClient();
    const id = (await params).id;
    const json = await request.json();

    // Validate the request body here if needed
    const { name, place, address, room, date, start_time, end_time } = json;
    const { group_type } = json;

    const { data, error } = await supabase
      .from("rehearsals")
      .update({
        name,
        place,
        address,
        room,
        date,
        start_time,
        end_time,
        group_type,
      })
      .eq("id", id)
      .select(REHEARSAL_COLUMNS)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: "Rehearsal not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error updating rehearsal" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  try {
    const supabase = await createClient();

    const id = (await params).id;
    const { error } = await supabase.from("rehearsals").delete().eq("id", id);

    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error deleting rehearsal" },
      { status: 500 },
    );
  }
}
