// components/UploadCV.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function UploadCV() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "analyzing" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const supabase = createClient();
  const router = useRouter(); // 🟢 This allows us to refresh the page!

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus("idle");
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!file || file.type !== "application/pdf") {
      setMessage("Please select a valid PDF file.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setMessage("Uploading your CV to secure storage...");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in.");

      // 1. Upload PDF
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("cvs")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("cvs")
        .getPublicUrl(fileName);
      const fileUrl = publicUrlData.publicUrl;

      // 2. Extract Data with Gemini API
      setStatus("analyzing");
      setMessage("Analyzing CV and extracting data with AI...");

      const aiResponse = await fetch("/api/extract-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });

      const aiData = await aiResponse.json();
      if (!aiResponse.ok)
        throw new Error(aiData.error || "Failed to extract skills");

      // 3. 🟢 SAVE TO SUPABASE DATABASE
      const { error: dbError } = await supabase.from("cv_data").insert({
        candidate_id: user.id,
        file_url: fileUrl,
        extracted_data: aiData, // Saving the entire JSON profile!
      });

      if (dbError) throw dbError;

      setStatus("success");
      setMessage("✅ CV Analyzed and Saved Successfully!");
      setFile(null);

      // 4. 🟢 REFRESH THE DASHBOARD TO SHOW THE NEW SKILLS IN THE RIGHT COLUMN!
      router.refresh();
    } catch (error: any) {
      setStatus("error");
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="w-full bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-bold mb-2 text-gray-900">Upload your CV</h2>
      <p className="text-sm text-gray-500 mb-6">
        Our AI will extract your core skills automatically.
      </p>

      <div className="flex flex-col gap-4">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
        />

        <button
          onClick={handleUpload}
          disabled={status === "uploading" || status === "analyzing" || !file}
          className={`w-full py-3 rounded-lg text-white font-medium transition-all flex justify-center items-center ${
            status === "uploading" || status === "analyzing" || !file
              ? "bg-gray-300 cursor-not-allowed text-gray-500"
              : "bg-blue-600 hover:bg-blue-700 shadow-md"
          }`}
        >
          {status === "analyzing"
            ? "Analyzing with AI..."
            : status === "uploading"
              ? "Uploading..."
              : "Upload & Analyze"}
        </button>
      </div>

      {message && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm text-center font-medium ${status === "error" ? "bg-red-50 text-red-700" : status === "success" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
