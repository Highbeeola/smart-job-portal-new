import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/login/actions";

export default async function EmployerDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("employer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-700">
            Employer Dashboard
          </h1>
          <form action={logout}>
            <button className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg">
              Log Out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Your Job Postings
          </h2>
          <Link
            href="/employer/jobs/create"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg"
          >
            Post New Job
          </Link>
        </div>

        <div className="bg-white border rounded-2xl shadow-sm">
          <ul className="divide-y divide-gray-200">
            {jobs && jobs.length > 0 ? (
              jobs.map((job) => (
                <li
                  key={job.id}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                >
                  {/* 🟢 ENHANCED JOB DETAILS 🟢 */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                      <span>{job.company}</span>
                      <span className="hidden sm:inline">&bull;</span>
                      <span>{job.location}</span>
                      <span className="hidden sm:inline">&bull;</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded-md">
                        {job.job_type}
                      </span>
                    </div>
                  </div>
                  {/* 🟢 ACTION BUTTONS 🟢 */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <button
                      disabled
                      className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-200 rounded-lg cursor-not-allowed"
                    >
                      View Applicants
                    </button>
                    <button
                      disabled
                      className="text-sm font-medium text-gray-500 hover:text-red-600 cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li className="p-12 text-center text-gray-500">
                You have not posted any jobs yet.
              </li>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
