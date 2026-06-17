"use client";

interface Job {
  missing: string[];
}

interface LearningHubProps {
  matchedJobs: Job[];
  weakTopics: string[]; // We now accept the weak topics from the last interview
}

export default function LearningHub({
  matchedJobs,
  weakTopics,
}: LearningHubProps) {
  // 1. Combine both sources of skills to learn into one list
  const uniqueSkillsToLearn = new Set<string>();

  // Add weak topics identified from the interview
  if (weakTopics) {
    weakTopics.forEach((topic) => uniqueSkillsToLearn.add(topic));
  }

  // Add missing skills from top job matches
  matchedJobs.slice(0, 5).forEach((job) => {
    if (job.missing) {
      job.missing.forEach((skill) => uniqueSkillsToLearn.add(skill));
    }
  });

  const skillsToLearn = Array.from(uniqueSkillsToLearn);

  const createYoutubeLink = (skill: string) => {
    const query = encodeURIComponent(`${skill} tutorial for beginners`);
    return `https://www.youtube.com/results?search_query=${query}`;
  };

  return (
    <div className="w-full bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Your Learning Hub
      </h2>

      {skillsToLearn.length > 0 ? (
        <>
          <p className="text-sm text-gray-500 mb-6">
            Here are topics to focus on, based on your interview performance and
            skill gaps for top jobs.
          </p>
          <div className="flex flex-col gap-4">
            {skillsToLearn.map((skill, index) => (
              <a
                key={index}
                href={createYoutubeLink(skill)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg transition group"
              >
                <div>
                  <p className="font-bold text-gray-800">{skill}</p>
                  {/* Differentiate the source for clarity */}
                  <p className="text-xs text-gray-500">
                    {weakTopics.includes(skill)
                      ? "From interview feedback"
                      : "Skill gap from job description"}
                  </p>
                </div>
                {
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
              </a>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500 italic">
          No skill gaps or areas for improvement detected. Great work!
        </p>
      )}
    </div>
  );
}
