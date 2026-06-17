"use client";

import { useSearchParams } from 'next/navigation';
import { login, signup } from "./actions";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'candidate'; // Default to candidate if no role is in URL

  // Determine the title and subtitle based on the role
  const isEmployer = role === 'employer';
  const title = isEmployer ? "Employer Portal" : "Candidate Portal";
  const subtitle = isEmployer 
    ? "Sign in to post jobs and manage applicants." 
    : "Sign in to analyze your CV and practice for interviews.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-2xl shadow-lg border">
          
          {/* DYNAMIC HEADER */}
          <h2 className="text-2xl font-bold text-center text-gray-900">
            {title}
          </h2>
          <p className="text-sm text-center text-gray-500 mb-6">
            {subtitle}
          </p>

          <form className="flex flex-col gap-4">
            {searchParams.get('message') && (
              <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm text-center">
                {searchParams.get('message')}
              </p>
            )}

            {/* This hidden input passes the role to the server action */}
            <input type="hidden" name="role" value={role} />

            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
              <input id="email" name="email" type="email" required className="rounded-md border p-2" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
              <input id="password" name="password" type="password" required className="rounded-md border p-2" />
            </div>

            <div className="flex gap-4 mt-4">
              <button
                formAction={login}
                className="flex-1 rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 transition"
              >
                Log In
              </button>
              <button
                formAction={signup}
                className="flex-1 rounded-md border border-gray-300 p-2 text-gray-700 hover:bg-gray-50 transition"
              >
                Sign Up
              </button>
            </div>
          </form>

          {/* DYNAMIC LINK TO SWITCH FORMS */}
          <div className="text-center mt-6">
            {isEmployer ? (
              <a href="/login?role=candidate" className="text-sm text-blue-600 hover:underline">
                Are you a job seeker?
              </a>
            ) : (
              <a href="/login?role=employer" className="text-sm text-blue-600 hover:underline">
                Are you an employer?
              </a>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}