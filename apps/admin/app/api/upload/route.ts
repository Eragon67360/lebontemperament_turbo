// app/api/upload/route.ts
import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const supabase = await createClient();

    // Get the file extension
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;

    // Determine bucket based on file type
    let bucket = "concert-posters"; // default

    // If PDF, use ca-documents bucket
    if (fileExt?.toLowerCase() === "pdf") {
      bucket = "ca-documents";
    }

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
