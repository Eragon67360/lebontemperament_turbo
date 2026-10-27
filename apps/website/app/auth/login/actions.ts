"use server";

import { signInMember } from "@/lib/memberSession";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const dataForm = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Only a member keeps the session: an account without a profile row is
  // signed out again (PROFILE_NOT_FOUND).
  const result = await signInMember(supabase, dataForm);

  if (result.success) revalidatePath("/", "layout");
  return result;
}
