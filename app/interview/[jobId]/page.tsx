import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import InterviewChat from "@/components/InterviewChat";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const resolvedParams = await params;
  const jobId = resolvedParams.jobId;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email || "unknown@email.com",
      full_name: "Candidate",
      role: "candidate",
    });
    if (profileError) {
      throw new Error(`Profile Creation Failed: ${profileError.message}`);
    }
  }

  // Fetch Job Details
  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (!job) redirect("/dashboard");

  // Fetch User's CV Data for AI context
  const { data: cvData } = await supabase
    .from("cv_data")
    .select("extracted_data")
    .eq("candidate_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const skills: string[] = Array.isArray(cvData?.extracted_data?.skills)
    ? cvData.extracted_data.skills
    : [];

  // This ensures a fresh start every single time the user clicks "Practice".
  const { data: newSession, error: sessionError } = await supabase
    .from("interview_sessions")
    .insert({
      candidate_id: user.id,
      job_id: jobId,
      chat_history: [], // Always start with a blank history
      status: "in_progress",
    })
    .select()
    .single();

  if (sessionError) {
    console.error(
      "Critical: Could not create new interview session.",
      sessionError,
    );
    // Redirect with an error message if the session can't be created
    return redirect(
      "/dashboard?message=Could not start the interview session.",
    );
  }

  // The session is now guaranteed to be the fresh one we just created.
  const session = newSession;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 py-4 px-6">
        <h1 className="text-xl font-bold text-gray-900">
          Interviewing for: <span className="text-blue-700">{job.title}</span>
        </h1>
        <p className="text-sm text-gray-500">{job.company}</p>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        <InterviewChat
          sessionId={session.id}
          jobTitle={job.title}
          initialHistory={session.chat_history || []}
          candidateSkills={skills}
        />
      </main>
    </div>
  );
}
