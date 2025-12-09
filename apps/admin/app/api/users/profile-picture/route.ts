// app/api/users/profile-picture/route.ts
import { checkAuthorization } from "@/utils/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Upload profile picture
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
    const userId = formData.get("userId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 },
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    // Get file extension
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}_${Date.now()}.${fileExt || "jpg"}`;

    // Delete old profile picture if it exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("profile_picture_url")
      .eq("id", userId)
      .single();

    if (existingProfile?.profile_picture_url) {
      // Extract the file path from the URL
      const url = new URL(existingProfile.profile_picture_url);
      const pathParts = url.pathname.split("/");
      const oldFileName = pathParts[pathParts.length - 1];

      // Delete old file from storage
      if (oldFileName && oldFileName.length > 0) {
        await supabase.storage.from("profile-pictures").remove([oldFileName]);
      }
    }

    // Upload new file to profile-picture bucket
    const { error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 },
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-pictures").getPublicUrl(fileName);

    // Update profile in database
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ profile_picture_url: publicUrl })
      .eq("id", userId);

    if (updateError) {
      // If database update fails, try to delete the uploaded file
      await supabase.storage.from("profile-pictures").remove([fileName]);
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Profile picture upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// Delete profile picture
export async function DELETE(request: Request) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    // Get current profile picture URL
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("profile_picture_url")
      .eq("id", userId)
      .single();

    if (profile?.profile_picture_url) {
      // Extract the file path from the URL
      const url = new URL(profile.profile_picture_url);
      const pathParts = url.pathname.split("/");
      const fileName = pathParts[pathParts.length - 1];

      // Delete file from storage
      if (fileName) {
        const { error: deleteError } = await supabase.storage
          .from("profile-pictures")
          .remove([fileName]);

        if (deleteError) {
          console.error("Delete error:", deleteError);
          // Continue even if file deletion fails
        }
      }
    }

    // Update profile to remove picture URL
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ profile_picture_url: null })
      .eq("id", userId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile picture delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
