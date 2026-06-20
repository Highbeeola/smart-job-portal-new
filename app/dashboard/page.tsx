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

  // --- Data Fetching (We now know this works perfectly) ---
  const { data: cvData } = await supabase
    .from("cv_data")
    .select("extracted_data")
    .eq("candidate_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: jobs } = await supabase.from("jobs").select("*");
  const { data: latestInterview } = await supabase
    .from("interview_sessions")
    .select("weak_topics")
    .eq("candidate_id", user.id)
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-blue-700">
              Smart Job Portal
            </h1>
            <p className="text-sm text-gray-500 hidden sm:block">
              Candidate Dashboard
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {userName}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
              >
                Log Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-1 flex flex-col gap-6 order-2 lg:order-1 mt-8 lg:mt-0">
            <UploadCV />
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

          <div className="lg:col-span-2 flex flex-col gap-6 order-1 lg:order-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Recommended Jobs
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Upload your CV to see personalized job matches.
              </p>
            </div>
            {matchedJobs.length > 0 ? (
              <div className="flex flex-col gap-4">
                {matchedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white border rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row gap-6 transition hover:shadow-lg"
                  >
                    <Link href={`/jobs/${job.id}`} className="flex-1 block">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {job.title}
                          </h3>
                          <p className="text-sm text-gray-600 font-medium">
                            {job.company} • {job.location}
                          </p>
                        </div>
                        <div
                          className={`sm:hidden px-3 py-1 rounded-full text-sm font-bold border ${job.score >= 80 ? "bg-green-50 text-green-700 border-green-200" : job.score >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-red-50 text-red-700 border-red-200"}`}
                        >
                          {job.score}% Match
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                        {job.description}
                      </p>
                      <div className="mt-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Skill Gaps (Missing)
                        </h4>
                        {job.missing.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {job.missing.map(
                              (missingSkill: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-md"
                                >
                                  {missingSkill}
                                </span>
                              ),
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-green-600 font-medium">
                            ✨ You have all the required skills!
                          </p>
                        )}
                      </div>
                    </Link>
                    <div className="hidden sm:flex flex-col items-end justify-between min-w-[120px]">
                      <div
                        className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 ${job.score >= 80 ? "border-green-400 text-green-700 bg-green-50" : job.score >= 50 ? "border-yellow-400 text-yellow-700 bg-yellow-50" : "border-red-400 text-red-700 bg-red-50"}`}
                      >
                        <span className="text-xl font-bold">{job.score}%</span>
                        <span className="text-[10px] uppercase font-bold text-gray-500">
                          Match
                        </span>
                      </div>
                      {skills.length > 0 ? (
                        <Link
                          href={`/interview/${job.id}`}
                          className="mt-4 w-full block px-4 py-2 bg-blue-600 text-white text-sm text-center font-medium rounded-lg hover:bg-blue-700 transition"
                        >
                          Practice AI Interview
                        </Link>
                      ) : (
                        <div className="mt-4 w-full text-center">
                          <button
                            disabled
                            className="w-full px-4 py-2 bg-gray-200 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed border"
                          >
                            Practice AI Interview
                          </button>
                          <p className="text-xs text-red-500 font-medium mt-2">
                            ⚠️ Upload your CV to unlock
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border rounded-2xl p-12 text-center shadow-sm">
                <h3 className="text-lg font-bold">No jobs available</h3>
                <p className="text-gray-500">Please check back later!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
