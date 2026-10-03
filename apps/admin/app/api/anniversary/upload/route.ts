import { cloudinary } from "@/lib/cloudinary";
import { checkAuthorization } from "@/utils/auth";
import {
  ANNIVERSARY_DEFAULT_FOLDER,
  ANNIVERSARY_KINDS,
  anniversaryKind,
  CLOUDINARY_IMAGE_FORMATS,
  isAllowedAnniversaryFolder,
  resolveUploadFolder,
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

    // Only the anniversary CMS folders (photos, audio, archives, thumbnails).
    const folder = resolveUploadFolder(
      formData.get("folder"),
      ANNIVERSARY_DEFAULT_FOLDER,
      isAllowedAnniversaryFolder,
    );
    if (!folder) {
      return NextResponse.json(
        { error: "Dossier non autorisé" },
        { status: 400 },
      );
    }

    // resourceType "image" (10 MB), "audio" (50 MB) or "raw" for PDF/Word
    // documents (50 MB); audio and documents are stored as Cloudinary "raw".
    const kind = anniversaryKind(formData.get("resourceType"), file.type);
    if (!kind) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé" },
        { status: 400 },
      );
    }
    const { rule, resourceType } = ANNIVERSARY_KINDS[kind];

    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = validateUpload(file, bytes, rule);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    return new Promise<NextResponse>((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          // Cloudinary checks the actual format of images too (no SVG).
          ...(resourceType === "image"
            ? { allowed_formats: CLOUDINARY_IMAGE_FORMATS }
            : {}),
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            resolve(
              NextResponse.json({ error: "Upload failed" }, { status: 500 }),
            );
          } else {
            // Return the public_id (relative path) instead of full URL
            // This allows us to use Cloudinary transformations
            resolve(
              NextResponse.json({
                url: result?.public_id || "",
                secure_url: result?.secure_url || "",
                public_id: result?.public_id || "",
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
