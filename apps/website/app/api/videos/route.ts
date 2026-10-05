// app/api/videos/route.ts
import { PUBLIC_VIDEO_COLUMNS, type PublicVideo } from "@/lib/publicVideos";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: videos, error } = await supabase
      .from("youtube_links")
      .select(PUBLIC_VIDEO_COLUMNS)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching videos:", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    return NextResponse.json((videos || []) as PublicVideo[]); // view-model: youtube_links nullability handled by UI defaults
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
