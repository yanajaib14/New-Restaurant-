import { GoogleGenAI } from "@google/genai";

const getGeminiKey = () =>
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.VITE_GEMINI_API_KEY ||
  "";

const getGroqKey = () => process.env.GROQ_API_KEY || "";

const VISION_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

const getErrorMessage = (error: any) =>
  error?.message || error?.error?.message || "Invoice AI request failed";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const geminiKey = getGeminiKey();
  const groqKey = getGroqKey();

  if (!geminiKey && !groqKey) {
    return res.status(500).json({ error: "AI service is not configured. Add GEMINI_API_KEY or GROQ_API_KEY." });
  }

  const { base64Data, mimeType } = req.body || {};
  if (!base64Data || !mimeType) {
    return res.status(400).json({ error: "Missing invoice image data" });
  }

  // Try Gemini vision models
  if (geminiKey) {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const prompt = "Extract invoice details: Vendor Name, Date (YYYY-MM-DD), Total Amount, Category (Operations, Food, Beverage, Marketing, Utilities), and a list of items (name, quantity, price). Return as JSON.";
    let lastError: any = null;

    for (const model of VISION_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              { text: prompt },
              { inlineData: { data: String(base64Data), mimeType: String(mimeType) } },
            ],
          },
          config: {
            responseMimeType: "application/json",
          },
        });

        return res.status(200).json({ text: response.text || "{}", provider: "gemini" });
      } catch (error: any) {
        lastError = error;
        console.warn(`Gemini invoice ${model} failed:`, error?.message);
      }
    }

    console.error("Gemini invoice extraction failed:", lastError);
  }

  // Groq does not support vision — return empty so the caller handles it gracefully
  if (groqKey) {
    console.warn("Gemini vision unavailable; Groq does not support image input. Returning empty invoice.");
    return res.status(200).json({ text: "{}", provider: "groq-fallback-no-vision" });
  }

  return res.status(500).json({ error: "Invoice AI extraction failed. Check your GEMINI_API_KEY." });
}
