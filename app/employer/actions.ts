"use server";

// You don't need the createServerClient import here if we're using the helper
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createJob(formData: FormData) {
  // 🟢 THE FIX: We use our standard helper which handles cookies correctly
  const supabase = await createClient();

  // 1. This call will now work correctly because createClient handles the async cookies
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // This redirect is safer than throwing an error
    return redirect(
      "/login?role=employer&message=Authentication failed. Please log in again.",
    );
  }

  // 2. Get the raw comma-separated skills string
  const skillsRaw = formData.get("required_skills") as string;
  const required_skills = skillsRaw
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  // 3. Create the job data object with the new fields included
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

  // 4. Insert into the database
  const { error } = await supabase.from("jobs").insert(jobData);

  if (error) {
    console.error("Error creating job:", error);
    return redirect(`/employer/jobs/create?message=Error: ${error.message}`);
  }

  // 5. Revalidate the path and redirect back to the employer dashboard
  revalidatePath("/employer/dashboard");
  redirect("/employer/dashboard");
}
