import { cloudinary } from "@/lib/cloudinary";
import { checkAuthorization } from "@/utils/auth";
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
    const folder = formData.get("folder") as string | null;
    const resourceType = formData.get("resourceType") as string | null; // 'image', 'video', 'audio'

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine resource type if not provided
    let type: "image" | "video" | "raw" | "auto" = "auto";
    if (resourceType) {
      if (resourceType === "audio") {
        type = "raw"; // Audio files are uploaded as 'raw' in Cloudinary
      } else if (resourceType === "image" || resourceType === "video") {
        type = resourceType;
      }
    }

    // Upload to Cloudinary
    return new Promise<NextResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder || "Site/anniversary",
          resource_type: type,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(
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
