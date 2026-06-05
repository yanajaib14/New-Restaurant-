import { GoogleGenAI } from "@google/genai";

const getGeminiKey = () =>
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.VITE_GEMINI_API_KEY ||
  "";

const getGroqKey = () =>
  process.env.GROQ_API_KEY || "";

const GEMINI_CHAT_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
const GROQ_CHAT_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];

const getErrorMessage = (error: any) =>
  error?.message || error?.error?.message || "AI request failed";

/** Call Groq via their OpenAI-compatible REST API (no SDK needed) */
async function callGroq(model: string, systemText: string, userText: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getGroqKey()}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemText },
        { role: "user", content: userText },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq HTTP ${res.status}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "";
}

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

  const { message, systemInstruction } = req.body || {};
  const text = String(message || "").trim();
  if (!text) {
    return res.status(400).json({ error: "Missing message" });
  }

  const systemText = String(systemInstruction || "You are a concise, practical restaurant operations assistant.");
  let lastError: any = null;

  // 1. Try Gemini first
  if (geminiKey) {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    for (const model of GEMINI_CHAT_MODELS) {
      try {
        const result = await ai.models.generateContent({
          model,
          contents: text,
          config: { systemInstruction: systemText },
        });
        return res.status(200).json({ text: result.text || "", provider: "gemini" });
      } catch (error: any) {
        lastError = error;
        console.warn(`Gemini ${model} failed:`, error?.message);
      }
    }
  }

  // 2. Fall back to Groq
  if (groqKey) {
    for (const model of GROQ_CHAT_MODELS) {
      try {
        const responseText = await callGroq(model, systemText, text);
        return res.status(200).json({ text: responseText, provider: "groq" });
      } catch (error: any) {
        lastError = error;
        console.warn(`Groq ${model} failed:`, error?.message);
      }
    }
  }

  console.error("All AI providers failed:", lastError);
  return res.status(500).json({ error: getErrorMessage(lastError) });
}
