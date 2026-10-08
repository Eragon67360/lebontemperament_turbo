// app/api/videos/route.ts

import { VIDEO_COLUMNS } from "@/lib/columns";
import { checkAuthorization } from "@/utils/auth";
import {
  REVALIDATE,
  revalidateWebsiteAfterResponse,
} from "@/utils/revalidateWebsite";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("youtube_links")
      .select(VIDEO_COLUMNS)
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
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  try {
    const supabase = await createClient();
    const data = await request.json();

    const { error } = await supabase.from("youtube_links").insert([data]);

    if (error) throw error;

    revalidateWebsiteAfterResponse(REVALIDATE.videos);
    return NextResponse.json({ message: "Video added successfully" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error adding video" }, { status: 500 });
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

  try {
    const supabase = await createClient();
    const data = await request.json();
    const { id, ...updateData } = data;

    const { error } = await supabase
      .from("youtube_links")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;

    revalidateWebsiteAfterResponse(REVALIDATE.videos);
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
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  try {
    const supabase = await createClient();
    const { id } = await request.json();

    const { error } = await supabase
      .from("youtube_links")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidateWebsiteAfterResponse(REVALIDATE.videos);
    return NextResponse.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error deleting video" },
      { status: 500 },
    );
  }
}
