import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "employer") {
      redirect("/employer/dashboard");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 text-center">
      <div className="max-w-2xl">
        <h1 className="text-5xl font-bold text-blue-700">Smart Job Portal</h1>
        <p className="mt-4 text-lg text-gray-600">
          AI-powered interview preparation, CV analysis, and skill gap detection
          to boost your employability.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login?role=candidate"
            className="w-full sm:w-auto rounded-lg bg-blue-600 px-8 py-3 text-base font-medium text-white shadow-md hover:bg-blue-700 transition"
          >
            Candidate Login
          </Link>
          <Link
            href="/login?role=employer"
            className="w-full sm:w-auto rounded-lg border-2 border-gray-300 px-8 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-100 transition"
          >
            Employer Access
          </Link>
        </div>
      </div>
    </main>
  );
}
