"use server";

import { ERROR_CODES } from "@/consts/errorMessages";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
export async function login(formData: FormData) {
  const supabase = await createClient();

  const dataForm = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { data, error } = await supabase.auth.signInWithPassword(dataForm);

  if (error) {
    const redirection =
      RouteNames.AUTH.LOGIN + "?error=" + ERROR_CODES.INVALID_CREDENTIALS;
    redirect(redirection);
  }

  if (data?.user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      const redirection =
        RouteNames.AUTH.LOGIN + "?error=" + ERROR_CODES.PROFILE_NOT_FOUND;
      redirect(redirection);
    }

    if (profile?.role !== "admin" && profile?.role !== "superadmin") {
      await supabase.auth.signOut();
      const redirection =
        RouteNames.AUTH.LOGIN + "?error=" + ERROR_CODES.UNAUTHORIZED;
      redirect(redirection);
    }
  }

  revalidatePath("/", "layout");
  redirect(RouteNames.DASHBOARD.ROOT);
}
