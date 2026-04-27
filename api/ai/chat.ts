import { GoogleGenAI } from "@google/genai";

const getApiKey = () =>
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.VITE_GEMINI_API_KEY ||
  "";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(500).json({ error: "AI service is not configured" });
  }

  const { message, systemInstruction } = req.body || {};
  if (!message || !systemInstruction) {
    return res.status(400).json({ error: "Missing message or system instruction" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: String(message),
      config: {
        systemInstruction: String(systemInstruction),
      },
    });

    return res.status(200).json({ text: result.text || "" });
  } catch (error: any) {
    console.error("AI chat error:", error);
    return res.status(500).json({ error: error?.message || "AI request failed" });
  }
}
