"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createJob(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // This redirect is safer than throwing an error
    return redirect(
      "/login?role=employer&message=Authentication failed. Please log in again.",
    );
  }

  // Get the raw comma-separated skills string
  const skillsRaw = formData.get("required_skills") as string;
  const required_skills = skillsRaw
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  // Create the job data object with all fields
  const jobData = {
    title: formData.get("title") as string,
    company: formData.get("company") as string,
    location: formData.get("location") as string,
    description: formData.get("description") as string,
    required_skills: required_skills,
    employer_id: user.id, // Link the job to the employer
    job_type: formData.get("job_type") as string,
    salary_range: formData.get("salary_range") as string,
    employer_email: user.email,
  };

  // Insert into the database
  const { error } = await supabase.from("jobs").insert(jobData);

  if (error) {
    console.error("Error creating job:", error);
    return redirect(`/employer/jobs/create?message=Error: ${error.message}`);
  }

  // Revalidate the path and redirect back to the employer dashboard
  revalidatePath("/employer/dashboard");
  redirect("/employer/dashboard");
}

// 🟢 NEWLY ADDED DELETE FUNCTION 🟢
export async function deleteJob(jobId: string) {
  const supabase = await createClient();

  // 1. Get the current logged-in user to ensure they are the owner
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication failed.");
  }

  // 2. Perform the delete operation, but ONLY if the employer_id matches the user's id
  // This is a crucial security check that our RLS policy also enforces.
  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", jobId)
    .eq("employer_id", user.id); // Security check!

  if (error) {
    console.error("Error deleting job:", error);
    // In a real app, you might redirect with an error message
    throw new Error("Could not delete job posting.");
  }

  // 3. Revalidate the path to ensure the job list is updated on the dashboard
  revalidatePath("/employer/dashboard");
}
