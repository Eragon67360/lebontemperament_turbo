// app/api/projects/[id]/route.ts
import { cloudinary } from "@/lib/cloudinary";
import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error fetching project" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const json = await request.json();

    const { data, error } = await supabase
      .from("projects")
      .update(json)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error updating project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  try {
    const supabase = await createClient();
    const { id } = await params;

    // First, get the project to retrieve image paths
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("image, banniere, image2, image3")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // Delete images from Cloudinary
    const imageFields = [
      project?.image,
      project?.banniere,
      project?.image2,
      project?.image3,
    ].filter((img): img is string => Boolean(img));

    if (imageFields.length > 0) {
      const deletePromises = imageFields.map((publicId) =>
        cloudinary.uploader.destroy(publicId).catch((error) => {
          console.error(`Failed to delete ${publicId} from Cloudinary:`, error);
          // Continue even if deletion fails
        }),
      );
      await Promise.all(deletePromises);
    }

    // Delete from database
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error deleting project" },
      { status: 500 },
    );
  }
}
