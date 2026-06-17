// app/api/extract-skills/route.ts
import { NextResponse } from "next/server";
import { extractText } from "unpdf";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function parseJsonFromResponse(output: string) {
  if (!output || typeof output !== "string") return null;
  const jsonMatch = output.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fileUrl = body?.fileUrl;

    if (!fileUrl || typeof fileUrl !== "string" || fileUrl.trim() === "") {
      return NextResponse.json(
        { error: "No file URL provided" },
        { status: 400 },
      );
    }

    const pdfResp = await fetch(fileUrl);
    if (!pdfResp.ok) {
      return NextResponse.json(
        { error: `Failed to fetch PDF, status ${pdfResp.status}` },
        { status: pdfResp.status },
      );
    }

    const arrayBuffer = await pdfResp.arrayBuffer();
    const pdfData = (await extractText(new Uint8Array(arrayBuffer))) as unknown;

    let text = "";
    if (typeof pdfData === "string") {
      text = pdfData;
    } else if (Array.isArray(pdfData)) {
      text = pdfData.join("\n");
    } else if (
      pdfData &&
      typeof pdfData === "object" &&
      "text" in (pdfData as any)
    ) {
      const textValue = (pdfData as any).text;
      text = Array.isArray(textValue)
        ? textValue.join("\n")
        : String(textValue);
    }

    if (!text || text.trim() === "") {
      return NextResponse.json(
        { error: "Could not extract text from the PDF" },
        { status: 400 },
      );
    }

    // 🟢 FIX 1: Set temperature inside generationConfig
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json", // Pro-tip: This forces Gemini to return ONLY JSON!
      },
    });

    const prompt = `You are an expert HR AI. Extract the following from this CV and return ONLY valid JSON without markdown, explanation, or extra text.

    Please format exactly as:
    {
      "full_name": "",
      "email": "",
      "phone": "",
      "skills": [],
      "education":[],
      "experience": [],
      "certifications": [],
      "projects":[]
    }

    Extract from text below:

    ${text}
    `;

    // 🟢 FIX 2: Use generateContent() instead of generate()
    const result = await model.generateContent(prompt);

    // 🟢 FIX 3: Use the built-in .text() method to safely get the string
    const rawOutput = result.response.text();

    if (!rawOutput) {
      return NextResponse.json(
        { error: "No model output returned" },
        { status: 502 },
      );
    }

    // Clean and parse the JSON
    const extractedJson = parseJsonFromResponse(rawOutput);

    // 🟢 FIX 4: Return the JSON directly so your frontend (aiData.skills) can read it properly!
    return NextResponse.json(
      extractedJson || {
        full_name: "",
        email: "",
        phone: "",
        skills: [],
        education: [],
        experience: [],
        certifications: [],
        projects: [],
        rawOutput,
      },
    );
  } catch (error: any) {
    console.error("Extract skills error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
