// app/api/videos/route.ts

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("youtube_links")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error fetching videos" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const data = await request.json();

    const { error } = await supabase.from("youtube_links").insert([data]);

    if (error) throw error;

    return NextResponse.json({ message: "Video added successfully" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error adding video" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const data = await request.json();
    const { id, ...updateData } = data;

    const { error } = await supabase
      .from("youtube_links")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Video updated successfully" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error updating video" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { id } = await request.json();

    const { error } = await supabase
      .from("youtube_links")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error deleting video" },
      { status: 500 },
    );
  }
}
