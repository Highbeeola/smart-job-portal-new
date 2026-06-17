"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  const roleFromForm = formData.get("role") as string;

  // Step 1: Authenticate the user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.signInWithPassword(data);

  if (authError || !user) {
    return redirect(
      `/login?role=${roleFromForm}&message=Could not authenticate user.`,
    );
  }

  // Step 2: Fetch the user's profile from the database.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return redirect(
      `/login?role=${roleFromForm}&message=Authentication successful, but could not find user profile.`,
    );
  }

  revalidatePath("/", "layout");

  // Step 3: Redirect based on the role stored securely in the DATABASE.
  if (profile.role === "employer") {
    redirect("/employer/dashboard");
  } else {
    redirect("/dashboard");
  }
}

// ... your existing, working signup and logout functions ...
export async function signup(formData: FormData) {
  const supabase = await createClient();
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  const role = formData.get("role") as string;

  if (!role) {
    return redirect("/login?message=Role not selected.");
  }

  const {
    data: { user },
    error: signUpError,
  } = await supabase.auth.signUp(data);

  if (signUpError || !user) {
    return redirect(`/login?role=${role}&message=${signUpError?.message}`);
  }

  const { error: roleError } = await supabase
    .from("profiles")
    .update({ role: role })
    .eq("id", user.id);

  if (roleError) {
    return redirect(
      `/login?role=${role}&message=Could not set user role after signup.`,
    );
  }

  revalidatePath("/", "layout");

  if (role === "employer") {
    redirect("/employer/dashboard");
  } else {
    redirect("/dashboard");
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
