"use server";

import { ERROR_CODES } from "@/consts/errorMessages";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const dataForm = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { data, error } = await supabase.auth.signInWithPassword(dataForm);

  if (error) {
    return {
      error: ERROR_CODES.INVALID_CREDENTIALS,
    };
  }

  if (data?.user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      return {
        error: ERROR_CODES.PROFILE_NOT_FOUND,
      };
    }

    revalidatePath("/", "layout");
    return { success: true };
  }
}
