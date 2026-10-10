import {
  removeProfilePhoto,
  replaceProfilePhoto,
  supabasePhotoStore,
  type PhotoResult,
} from "@/lib/profilePhoto";
import { checkAuthorization } from "@/utils/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

// Contract used by the mobile app (profile_photo_service.dart), with
// `Authorization: Bearer <access token>` (or the website's session cookie):
//   POST   multipart `file` (JPEG, PNG, WebP, GIF or AVIF, 5 MB max; the app
//          sends a resized JPEG, well under Vercel's 4.5 MB request cap)
//   DELETE no body
// Both answer `{ url }` (the new photo URL, or null) or `{ error }` in French.
// Only the caller's own photo changes: the user id comes from their token.

const respond = ({ status, body }: PhotoResult) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });

export async function POST(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized)
    return respond({ status: 401, body: { error: auth.error } });

  try {
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) {
      return respond({ status: 400, body: { error: "Aucune photo reçue" } });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const store = supabasePhotoStore(auth.supabase, createAdminClient());
    return respond(await replaceProfilePhoto(store, auth.user.id, file, bytes));
  } catch (error) {
    console.error("Profile photo upload failed:", error);
    return respond({
      status: 500,
      body: { error: "La photo n'a pas pu être enregistrée" },
    });
  }
}

export async function DELETE() {
  const auth = await checkAuthorization();
  if (!auth.authorized)
    return respond({ status: 401, body: { error: auth.error } });

  try {
    const store = supabasePhotoStore(auth.supabase, createAdminClient());
    return respond(await removeProfilePhoto(store, auth.user.id));
  } catch (error) {
    console.error("Profile photo removal failed:", error);
    return respond({
      status: 500,
      body: { error: "La photo n'a pas pu être retirée" },
    });
  }
}
