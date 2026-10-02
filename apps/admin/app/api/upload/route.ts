// app/api/upload/route.ts
import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { UPLOAD_RULES, validateUpload } from "@/utils/uploads";
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
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Posters (JPEG, PNG, WebP, GIF, AVIF) and CA documents (PDF), 5 MB max.
    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = validateUpload(file, bytes, UPLOAD_RULES.storage);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const supabase = await createClient();

    // Name and type come from the validated type, not from the client.
    const fileName = `${crypto.randomUUID()}.${check.extension}`;
    const bucket =
      check.mimeType === "application/pdf" ? "ca-documents" : "concert-posters";

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, bytes, { contentType: check.mimeType });

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
