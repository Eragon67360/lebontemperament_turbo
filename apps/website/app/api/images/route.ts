import { cloudinary } from "@/cloudinary.config";
import { ImageResourceProps, PhotoData } from "@/utils/types";
import { NextRequest, NextResponse } from "next/server";

const FOLDER_LABELS = new Map([
  ["concerts", "Photo de concert"],
  ["vie_bt", "Photo de la vie de l'ensemble"],
]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const folder = searchParams.get("folder");
  const label = folder ? FOLDER_LABELS.get(folder) : undefined;
  if (!label) {
    return NextResponse.json(
      { message: "Invalid folder parameter" },
      { status: 400 },
    );
  }

  try {
    const resources = await cloudinary.api.resources({
      type: "upload",
      prefix: `Site/galerie/${folder}`,
      max_results: 50,
    });

    const images: PhotoData[] = resources.resources.map(
      (resource: ImageResourceProps, index: number) => ({
        key: resource.public_id,
        src: resource.secure_url,
        width: resource.width,
        height: resource.height,
        // ponytail: generic fallback until Cloudinary DAM alt text is backfilled (context.custom.alt)
        alt: `${label} ${index + 1} — Le Bon Tempérament`,
      }),
    );

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error fetching images from Cloudinary:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
