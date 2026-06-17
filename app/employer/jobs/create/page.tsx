import { createJob } from "@/app/employer/actions";

export default function CreateJobPage({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex justify-center items-center">
      <form
        action={createJob}
        className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg border space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill out the details below to find your next great hire.
          </p>
        </div>

        {searchParams.message && (
          <p className="text-red-500 bg-red-50 p-3 rounded-md">
            {searchParams.message}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Job Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Company Name
            </label>
            <input
              type="text"
              name="company"
              id="company"
              required
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Location
          </label>
          <input
            type="text"
            name="location"
            id="location"
            required
            className="w-full p-2 border rounded-md"
            placeholder="e.g., Lagos, Nigeria"
          />
        </div>

        {/* 🟢 NEW FIELDS 🟢 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="job_type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Job Type
            </label>
            <select
              name="job_type"
              id="job_type"
              required
              className="w-full p-2 border rounded-md bg-white"
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
              <option>Internship</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="salary_range"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Salary Range (Optional)
            </label>
            <input
              type="text"
              name="salary_range"
              id="salary_range"
              className="w-full p-2 border rounded-md"
              placeholder="e.g., ₦150,000 - ₦250,000"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Job Description
          </label>
          <textarea
            name="description"
            id="description"
            rows={6}
            required
            className="w-full p-2 border rounded-md"
          ></textarea>
        </div>

        <div>
          <label
            htmlFor="required_skills"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Required Skills
          </label>
          <input
            type="text"
            name="required_skills"
            id="required_skills"
            required
            className="w-full p-2 border rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter skills separated by a comma (e.g., React, Node.js, SQL)
          </p>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700"
          >
            Submit Job Posting
          </button>
        </div>
      </form>
    </div>
  );
}
