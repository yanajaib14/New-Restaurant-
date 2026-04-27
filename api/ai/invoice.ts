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

  const { base64Data, mimeType } = req.body || {};
  if (!base64Data || !mimeType) {
    return res.status(400).json({ error: "Missing invoice image data" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = "Extract invoice details: Vendor Name, Date (YYYY-MM-DD), Total Amount, Category (Operations, Food, Beverage, Marketing, Utilities), and a list of items (name, quantity, price). Return as JSON.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

    return res.status(200).json({ text: response.text || "{}" });
  } catch (error: any) {
    console.error("AI invoice error:", error);
    return res.status(500).json({ error: error?.message || "Invoice AI request failed" });
  }
}
