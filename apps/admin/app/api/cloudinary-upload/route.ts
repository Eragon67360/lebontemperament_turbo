import { cloudinary } from "@/lib/cloudinary";
import { checkAuthorization } from "@/utils/auth";
import {
  CLOUDINARY_IMAGE_FORMATS,
  isAllowedProjectImageFolder,
  PROJECT_IMAGE_DEFAULT_FOLDER,
  resolveUploadFolder,
  UPLOAD_RULES,
  validateUpload,
} from "@/utils/uploads";
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

    // Project images only: Site/concerts or Site/concerts/<slug>.
    const folder = resolveUploadFolder(
      formData.get("folder"),
      PROJECT_IMAGE_DEFAULT_FOLDER,
      isAllowedProjectImageFolder,
    );
    if (!folder) {
      return NextResponse.json(
        { error: "Dossier non autorisé" },
        { status: 400 },
      );
    }

    // JPEG, PNG, WebP, GIF, AVIF, 10 MB max.
    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = validateUpload(file, bytes, UPLOAD_RULES.projectImage);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    return new Promise<NextResponse>((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          // Cloudinary checks the actual format too (no SVG).
          allowed_formats: CLOUDINARY_IMAGE_FORMATS,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            resolve(
              NextResponse.json({ error: "Upload failed" }, { status: 500 }),
            );
          } else {
            // Return the public_id (path) instead of full URL
            // This allows us to use Cloudinary transformations
            resolve(
              NextResponse.json({
                url: result?.public_id || "",
                secure_url: result?.secure_url || "",
              }),
            );
          }
        },
      );

      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
