// app/api/videos/route.ts
import { createClient } from "@/utils/supabase/server";
import { Video } from "@repo/domain/types/videos";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: videos, error } = await supabase
      .from("youtube_links")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json((videos || []) as Video[]); // view-model: youtube_links nullability handled by UI defaults
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
