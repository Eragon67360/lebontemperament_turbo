import { NextRequest, NextResponse } from "next/server";
import { cloudinary } from "@/cloudinary.config";
import { ImageResourceProps, PhotoData } from "@/utils/types";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const folder = searchParams.get('folder');
    if (!folder) {
        return NextResponse.json({ message: 'Folder parameter is required' }, { status: 400 });
    }

    try {
        const resources = await cloudinary.api.resources({
            type: 'upload',
            prefix: `Site/galerie/${folder}`,
            max_results:50,
        });

        const images: PhotoData = resources.resources.map((resource: ImageResourceProps) => ({
            src: resource.secure_url,
            width: resource.width,
            height: resource.height,
        }));

        return NextResponse.json({ images });

    } catch (error) {
        console.error('Error fetching images from Cloudinary:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
