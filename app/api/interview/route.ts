import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function extractAndParseJson(text: string) {
  const jsonRegex = /```json\s*([\s\S]*?)\s*```|({[\s\S]*})/;
  const match = text.match(jsonRegex);
  if (!match) return null;
  const jsonString = match[1] || match[2];
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { sessionId, message, jobTitle, skills } = await request.json();
    const supabase = await createClient();

    const { data: session, error: sessionError } = await supabase
      .from("interview_sessions")
      .select("chat_history")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) throw new Error("Session not found");

    const history = session.chat_history || [];
    history.push({ role: "user", content: message });

    // Count how many questions have ALREADY been asked and logged
    const questionsAskedCount = history.filter(
      (msg: any) =>
        msg.role === "model" && msg.content.toLowerCase().includes("question"),
    ).length;

    // 🟢 FINAL, POLISHED PROMPT WITH STATE MACHINE LOGIC
    const systemInstruction = `
      You are a stateful AI Interview Coach for a candidate applying for the role of ${jobTitle}.
      Your task is to conduct a 3-question interview.

      **YOUR CURRENT STATE:**
      - You have already asked exactly ${questionsAskedCount} questions.

      **YOUR RULES:**

      RULE 1: **IF ${questionsAskedCount} === 0**, this is the START of the interview.
        - Your task is to greet the candidate warmly and then ask the FIRST entry-level technical question.
        - Your entire response should be a single, friendly message that includes the first question. For example: "Hi there! It's great to connect... Let's start with your first question: [Your Question Here]".

      RULE 2: **IF ${questionsAskedCount} > 0 AND ${questionsAskedCount} < 3**, the interview is IN PROGRESS.
        - Your task is to briefly acknowledge the user's last answer (e.g., "Thanks for that explanation," or "Understood.") and then IMMEDIATELY ask the NEXT distinct technical question.
        - Do not repeat questions. Do not get stuck.

      RULE 3: **IF ${questionsAskedCount} === 3**, the interview is OVER.
        - The user's last message was their answer to the final question. Your ONLY task is to evaluate all 3 user answers and provide a final JSON object.
        - Do NOT ask any more questions or say anything else. Your entire response must be ONLY the JSON object.
        - The JSON format MUST be exactly:
          {
            "is_finished": true,
            "score": <number between 0-100>,
            "feedback": "<Your detailed feedback>",
            "weak_topics": ["<List of 1-3 specific skills the candidate struggled with>"]
          }
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
    });

    const formattedHistory = history.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history: formattedHistory.slice(0, -1) });
    const result = await chat.sendMessage(message);
    const aiText = result.response.text();

    const finalData = extractAndParseJson(aiText);

    if (finalData && finalData.is_finished) {
      await supabase
        .from("interview_sessions")
        .update({
          status: "completed",
          score: finalData.score,
          feedback: finalData.feedback,
          weak_topics: finalData.weak_topics,
        })
        .eq("id", sessionId);
      return NextResponse.json(finalData);
    } else {
      history.push({ role: "model", content: aiText });
      await supabase
        .from("interview_sessions")
        .update({
          chat_history: history,
        })
        .eq("id", sessionId);
      return NextResponse.json({ is_finished: false, reply: aiText });
    }
  } catch (error: any) {
    console.error("Interview API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
