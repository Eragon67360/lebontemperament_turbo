// app/api/rehearsals/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("rehearsals")
      .select("*")
      .order("date", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error fetching rehearsals" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const json = await request.json();

    // Validate the request body here if needed
    const { name, place, date, start_time, end_time, group_type } = json;

    const { data, error } = await supabase
      .from("rehearsals")
      .insert([{ name, place, date, start_time, end_time, group_type }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error creating rehearsal" },
      { status: 500 },
    );
  }
}
