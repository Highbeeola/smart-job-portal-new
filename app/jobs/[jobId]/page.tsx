import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const resolvedParams = await params;
  const jobId = resolvedParams.jobId;

  const supabase = await createClient();
  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    redirect("/dashboard");
  }
  const employerEmail = job.employer_email;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg border p-6 sm:p-10 space-y-8">
            {/* Job Header */}
            <div>
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                {job.job_type}
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                {job.title}
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                {job.company} &bull; {job.location}
              </p>
              {job.salary_range && (
                <p className="mt-2 text-md font-medium text-green-700">
                  {job.salary_range}
                </p>
              )}
            </div>

            {/*  CORRECTED APPLY NOW BUTTON LOGIC  */}
            {employerEmail ? (
              <div className="border-t pt-8">
                <a
                  href={`mailto:${employerEmail}?subject=Application for the ${job.title} position`}
                  className="w-full block text-center bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition shadow-md"
                >
                  Apply Now
                </a>
                <p className="text-xs text-center text-gray-500 mt-2">
                  This will open your default email client.
                </p>
              </div>
            ) : (
              <div className="border-t pt-8 text-center">
                <p className="text-sm text-gray-500">
                  Applications for this role are not being accepted via email.
                </p>
              </div>
            )}

            {/* Job Description */}
            <div className="border-t pt-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Full Job Description
              </h2>
              <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap">
                {job.description}
              </div>
            </div>

            {/* Required Skills */}
            <div className="border-t pt-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Required Skills
              </h2>
              <div className="flex flex-wrap gap-3">
                {Array.isArray(job.required_skills) &&
                  job.required_skills.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gray-100 text-gray-800 border border-gray-200 text-sm font-medium rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
