import { getGalleryImages, isGalleryFolder } from "@/lib/galleryImages";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const folder = searchParams.get("folder");
  if (!isGalleryFolder(folder)) {
    return NextResponse.json(
      { message: "Invalid folder parameter" },
      { status: 400 },
    );
  }

  try {
    // Cached for an hour (lib/galleryImages.ts), expired by the admin's uploads.
    const images = await getGalleryImages(folder);
    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error fetching images from Cloudinary:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
