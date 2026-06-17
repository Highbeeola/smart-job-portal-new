"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Message = { role: "user" | "model"; content: string };

interface ChatProps {
  sessionId: string;
  jobTitle: string;
  initialHistory: Message[];
  candidateSkills: string[];
}

export default function InterviewChat({
  sessionId,
  jobTitle,
  initialHistory,
  candidateSkills,
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialHistory);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 1. Add new state to hold the final results separately
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [finalFeedback, setFinalFeedback] = useState<string>("");

  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
          jobTitle,
          skills: candidateSkills,
        }),
      });

      const data = await response.json();

      // 2. Update the API call logic to populate our new state
      if (data.is_finished) {
        setIsCompleted(true);
        setFinalScore(data.score);
        setFinalFeedback(data.feedback);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "model", content: data.reply },
        ]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      // Optional: Add an error message to the chat
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "Sorry, an error occurred. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Replace the entire return statement with this new conditional UI
  return (
    <div className="flex flex-col flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {isCompleted && finalScore !== null ? (
        // ===================================
        // ||   THE NEW RESULTS SCREEN UI   ||
        // ===================================
        <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-50 h-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Interview Complete!
          </h2>

          {/* SVG Donut Chart for the Score */}
          <div className="relative w-40 h-40 mb-4">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                className="text-gray-200 stroke-current"
                strokeWidth="10"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
              ></circle>
              {/* Progress circle */}
              <circle
                className="text-blue-600 stroke-current"
                strokeWidth="10"
                strokeLinecap="round"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - finalScore / 100)}`}
                transform="rotate(-90 50 50)"
              ></circle>
              <text
                x="50"
                y="50"
                fontFamily="Verdana"
                fontSize="20"
                textAnchor="middle"
                alignmentBaseline="middle"
                className="fill-current text-gray-800 font-bold"
              >
                {finalScore}%
              </text>
            </svg>
          </div>

          <div className="max-w-2xl w-full text-left bg-white p-6 rounded-lg border border-gray-200 overflow-y-auto max-h-[40vh]">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Interviewer's Feedback:
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {finalFeedback}
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="mt-8 w-full max-w-xs py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition shadow-md"
          >
            Return to Dashboard
          </button>
        </div>
      ) : (
        // ===================================
        // ||      THE CHAT INTERFACE       ||
        // ===================================
        <>
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50 flex flex-col gap-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 my-auto">
                <p className="text-lg font-medium text-gray-800">
                  The AI Interviewer is ready.
                </p>
                <p className="text-sm mt-2">
                  Send a message like "Hi, I'm ready" to begin.
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3 whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-500 rounded-2xl rounded-bl-none px-5 py-3 shadow-sm animate-pulse">
                  AI is typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer here..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 transition"
              >
                Send
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
