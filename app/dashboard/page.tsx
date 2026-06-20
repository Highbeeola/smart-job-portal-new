import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "../login/actions";
import UploadCV from "@/components/UploadCV";
import { createClient } from "@/utils/supabase/server";
import LearningHub from "@/components/LearningHub";

// This line is crucial to prevent data caching between users
export const dynamic = "force-dynamic";

function calculateMatch(userSkills: string[], jobSkills: string[]) {
  if (!jobSkills || jobSkills.length === 0) return { score: 0, missing: [] };
  if (!userSkills || userSkills.length === 0)
    return { score: 0, missing: jobSkills };

  const normalizedUser = userSkills.map((s) => s.toLowerCase().trim());
  const missing = jobSkills.filter(
    (js) => !normalizedUser.includes(js.toLowerCase().trim()),
  );
  const matchedCount = jobSkills.length - missing.length;
  const score = Math.round((matchedCount / jobSkills.length) * 100);

  return { score, missing };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Role-based redirect
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role === "employer") redirect("/employer/dashboard");

  // --- Data Fetching ---
  const { data: cvData } = await supabase
    .from("cv_data")
    .select("extracted_data")
    .eq("candidate_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: jobs } = await supabase.from("jobs").select("*");

  // THE FIX for Bug #1: This query now explicitly and only fetches the session for the currently logged-in user.
  const { data: latestInterview } = await supabase
    .from("interview_sessions")
    .select("weak_topics")
    .eq("candidate_id", user.id) // This line is the key
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // --- Data Processing ---
  // @ts-ignore
  const skills: string[] = cvData?.extracted_data?.skills || [];
  const userName = cvData?.extracted_data?.full_name || user.email;
  // @ts-ignore
  const weakTopics: string[] = latestInterview?.weak_topics || [];

  const matchedJobs = (jobs || [])
    .map((job) => {
      let jobSkills: string[] = [];
      if (Array.isArray(job.required_skills)) jobSkills = job.required_skills;
      else if (typeof job.required_skills === "string") {
        try {
          jobSkills = JSON.parse(job.required_skills);
        } catch (e) {
          jobSkills = [];
        }
      }
      const { score, missing } = calculateMatch(skills, jobSkills);
      return { ...job, score, missing };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        {/* ... existing navbar code ... */}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* THE FIX for Bug #2: Use flexbox for mobile ordering, and grid for desktop */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 lg:gap-8">
          {/* LEFT COLUMN - Order changed for mobile */}
          <div className="lg:col-span-1 flex flex-col gap-6 order-2 lg:order-1 mt-8 lg:mt-0">
            <UploadCV />

            {/* THE FIX for Bug #3: Only show Learning Hub if a CV has been uploaded */}
            {skills.length > 0 && (
              <LearningHub matchedJobs={matchedJobs} weakTopics={weakTopics} />
            )}

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Your AI Extracted Skills
              </h2>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 border text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No skills detected yet. Upload your CV to see your results.
                </p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Order changed for mobile */}
          <div className="lg:col-span-2 flex flex-col gap-6 order-1 lg:order-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Recommended Jobs
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Upload your CV to see personalized job matches.
              </p>
            </div>
            {/* The rest of the job listing code remains the same */}
            {matchedJobs.length > 0 ? (
              <div className="flex flex-col gap-4">
                {matchedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white border rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row gap-6 transition hover:shadow-lg"
                  >
                    {/* ... a single job card's code ... */}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border rounded-2xl p-12 text-center shadow-sm">
                {/* ... no jobs available message ... */}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
