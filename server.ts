import dotenv from "dotenv";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { getDatabasePool } from "./server/database";
import { createRecordsHandler } from "./server/records";
import { createDatabaseReadinessHandler } from "./server/readiness";
import { GoogleGenAI } from "@google/genai";
import { createSettingsTitleHandlers } from "./server/settings";
import { listAccessUsers, revokeAccess, restoreAccess } from "./db/appRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env.local") });
dotenv.config({ path: path.resolve(__dirname, ".env") });


async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || process.env.APP_PORT || 4173);
  const pool = getDatabasePool();
  if (!pool) {
    console.warn("[preview] DATABASE_URL is not set. Running local preview mode with DB-backed routes disabled.");
  }
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
  const chatModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  const visionModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  const groqChatModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];
  const groqApiKey = process.env.GROQ_API_KEY || "";
  const getAiErrorMessage = (error: any) =>
    error?.message || error?.error?.message || "AI request failed";

  const callGroq = async (model: string, systemText: string, userText: string): Promise<string> => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
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
      throw new Error((err as any)?.error?.message || `Groq HTTP ${res.status}`);
    }
    const data: any = await res.json();
    return data?.choices?.[0]?.message?.content || "";
  };

  // Schema changes are versioned SQL migrations, never implicit application startup writes.

  app.use(express.json({ limit: '50mb' }));

  // Previous provider authentication is not a Neon Postgres service.
  // Same-origin application API; DATABASE_URL never enters the browser.
  app.all("/api/records/:table", createRecordsHandler(getDatabasePool));

  app.get("/api/health/database", createDatabaseReadinessHandler(getDatabasePool));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/ai/chat", async (req, res) => {
    if (!geminiApiKey && !groqApiKey) {
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
    if (geminiApiKey) {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      for (const model of chatModels) {
        try {
          const result = await ai.models.generateContent({
            model,
            contents: text,
            config: { systemInstruction: systemText },
          });
          return res.json({ text: result.text || "", provider: "gemini" });
        } catch (error: any) {
          lastError = error;
          console.warn(`Gemini ${model} failed:`, error?.message);
        }
      }
    }

    // 2. Fall back to Groq
    if (groqApiKey) {
      for (const model of groqChatModels) {
        try {
          const responseText = await callGroq(model, systemText, text);
          return res.json({ text: responseText, provider: "groq" });
        } catch (error: any) {
          lastError = error;
          console.warn(`Groq ${model} failed:`, error?.message);
        }
      }
    }

    console.error("All AI providers failed:", lastError);
    return res.status(500).json({ error: getAiErrorMessage(lastError) });
  });

  app.get("/api/dropbox/photos", async (_req, res) => {
    try {
      const { fetchDropboxPhotos } = await import("./api/dropbox/photos");
      const photos = await fetchDropboxPhotos();
      res.json({ photos, configured: Boolean(process.env.DROPBOX_ACCESS_TOKEN) });
    } catch (error: any) {
      console.error("Dropbox photos error:", error?.message || error);
      res.json({ photos: [], configured: false });
    }
  });

  app.post("/api/ai/invoice", async (req, res) => {
    if (!geminiApiKey && !groqApiKey) {
      return res.status(500).json({ error: "AI service is not configured. Add GEMINI_API_KEY or GROQ_API_KEY." });
    }

    const { base64Data, mimeType } = req.body || {};
    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: "Missing invoice image data" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const prompt = "Extract invoice details: Vendor Name, Date (YYYY-MM-DD), Total Amount, Category (Operations, Food, Beverage, Marketing, Utilities), and a list of items (name, quantity, price). Return as JSON.";
      let lastError: any = null;

      for (const model of visionModels) {
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

          return res.json({ text: response.text || "{}" });
        } catch (error: any) {
          lastError = error;
        }
      }

      // Groq doesn't support vision — skip image extraction, return empty JSON so caller handles it
      if (groqApiKey) {
        console.warn("Gemini vision unavailable; Groq does not support image input. Invoice extraction skipped.");
        return res.status(200).json({ text: "{}", provider: "groq-fallback-no-vision" });
      }

      throw lastError || new Error("No AI model could process the invoice");
    } catch (error: any) {
      console.error("AI invoice error:", error);
      return res.status(500).json({ error: getAiErrorMessage(error) || "Invoice AI request failed" });
    }
  });

  // Access list (shared with the Vercel functions in api/access/*).
  const send = (res: any, r: { status: number; body: unknown }) => res.status(r.status).json(r.body);
  app.get("/api/access/users", async (_req, res) => send(res, await listAccessUsers(pool)));
  app.post("/api/access/revoke", async (req, res) => send(res, await revokeAccess(pool, req.body?.email, req.body?.revokedBy)));
  app.post("/api/access/restore", async (req, res) => send(res, await restoreAccess(pool, req.body?.email)));

  const settingsTitleHandlers = createSettingsTitleHandlers(pool);
  app.get("/api/settings/title", settingsTitleHandlers.get);
  app.post("/api/settings/title", settingsTitleHandlers.post);

  app.post("/api/auth/change-password", (_req, res) => {
    res.status(503).json({ error: "Account authentication is not configured. Neon Postgres alone does not provide sign-in." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
