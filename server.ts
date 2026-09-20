import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in the AI Studio Secrets panel.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function parseJsonSafely(raw: string | undefined): any {
  if (!raw) return {};
  let str = raw.trim();
  // Strip Markdown code blocks if present
  if (str.startsWith("```json")) {
    str = str.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  } else if (str.startsWith("```")) {
    str = str.replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
  }
  try {
    return JSON.parse(str);
  } catch (err) {
    const firstBrace = str.indexOf("{");
    const lastBrace = str.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(str.substring(firstBrace, lastBrace + 1));
      } catch (innerErr) {
        throw err;
      }
    }
    throw err;
  }
}

async function startServer() {
  const app = express();

  // Middleware to support JSON bodies with reasonable limits for OCR image uploads
  app.use(express.json({ limit: "25mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "ezlearn" });
  });

  // 1. Core explanation generation endpoint
  app.post("/api/explain", async (req, res) => {
    try {
      const { text, level } = req.body;

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ error: "Please provide textbook or study text to translate." });
      }

      const ai = getGeminiClient();

      const selectedLevel = (level as string) || "very_simple";

      const prompt = `You are a patient, encouraging study tutor. A student pasted the following text or question from their studies. It can be about ANY subject — science, math, history, language, economics, literature, coding, or a single term with no context.

Never say you cannot understand, simplify, or translate it. If the text is short or ambiguous (e.g. just one term), explain the most common academic meaning of that term and briefly note your assumption. Only if the text is truly empty or pure gibberish with no discernible topic should you set "unclear" to true — this should almost never happen.

Student's text:
"""
${text.trim()}
"""

Explanation level: ${selectedLevel}
- very_simple: Explain like the student is 5. Extremely simple words, short sentences, playful tone.
- simple: Explain like a patient tutor talking to an average middle/high schooler. Plain language, no unexplained jargon.
- detailed: A deeper explanation — the "why," not just the "what" — but still clear and well organized.

Respond with ONLY a JSON object, no markdown fences, no extra commentary:
{
  "topic": "short name of the concept",
  "simple": "2-5 sentence explanation in the requested style",
  "example": "one everyday analogy, 1-3 sentences, starting naturally (e.g. 'Imagine...')",
  "breakdown": [{"part": "component or step name", "explanation": "one short sentence"}],
  "keyPoints": ["3-5 short, concrete, memorable points"],
  "remember": "a very short memorable line or formula summing it up",
  "unclear": false,
  "quiz": [
    {
      "question": "clear conceptual question based on the content",
      "options": ["option 1", "option 2", "option 3", "option 4"],
      "correctIndex": 0,
      "explanation": "friendly explanation of why this answer is correct"
    }
  ]
}

Rules:
- "breakdown" gets 2-5 items ONLY if the concept genuinely has distinct parts/steps/components. Otherwise return [].
- Ground everything in the actual text given — no generic filler.
- Match the language of the student's text.
- Auto-generate 3-5 multiple-choice quiz questions with exactly 4 options each, one correctIndex (0-3), and an encouraging explanation.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topic: {
                type: Type.STRING,
                description: "short name of the concept",
              },
              simple: {
                type: Type.STRING,
                description: "2-5 sentence explanation in the requested style",
              },
              example: {
                type: Type.STRING,
                description: "one everyday analogy, 1-3 sentences, starting naturally (e.g. 'Imagine...')",
              },
              breakdown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    part: { type: Type.STRING, description: "component or step name" },
                    explanation: { type: Type.STRING, description: "one short sentence" },
                  },
                  required: ["part", "explanation"],
                },
                description: "2-5 items ONLY if the concept genuinely has distinct parts/steps/components. Otherwise empty array [].",
              },
              keyPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3-5 short, concrete, memorable points",
              },
              remember: {
                type: Type.STRING,
                description: "a very short memorable line or formula summing it up",
              },
              unclear: {
                type: Type.BOOLEAN,
                description: "only true if text is truly empty or pure gibberish with no discernible topic",
              },
              quiz: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: "A clear conceptual test question" },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Array of exactly 4 distinct answer options",
                    },
                    correctIndex: { type: Type.INTEGER, description: "Zero-based index of correct option (0, 1, 2, or 3)" },
                    explanation: { type: Type.STRING, description: "Encouraging explanation of why this answer is correct" },
                  },
                  required: ["question", "options", "correctIndex", "explanation"],
                },
                description: "3 to 5 multiple-choice self-check questions",
              },
            },
            required: ["topic", "simple", "example", "breakdown", "keyPoints", "remember", "unclear", "quiz"],
          },
        },
      });

      const rawText = response.text || "{}";
      const parsedData = parseJsonSafely(rawText);

      // Sanitize fields to guarantee predictable UI rendering
      const sanitized = {
        topic: parsedData.topic || "Study Concept",
        simple: parsedData.simple || "Here is the simple explanation.",
        example: parsedData.example || "",
        breakdown: Array.isArray(parsedData.breakdown)
          ? parsedData.breakdown.map((b: any) => ({
              part: b.part || "Component",
              explanation: b.explanation || b.description || "",
              description: b.explanation || b.description || "",
            }))
          : [],
        keyPoints: Array.isArray(parsedData.keyPoints) ? parsedData.keyPoints : [],
        remember: parsedData.remember || parsedData.mnemonic || "",
        mnemonic: parsedData.remember || parsedData.mnemonic || "",
        unclear: Boolean(parsedData.unclear),
        quiz: Array.isArray(parsedData.quiz)
          ? parsedData.quiz.map((q: any) => ({
              question: q.question || "Conceptual check",
              options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ["True", "False", "Partially", "None"],
              correctIndex: typeof q.correctIndex === "number" && q.correctIndex >= 0 ? q.correctIndex : 0,
              explanation: q.explanation || "Correct concept understanding.",
            }))
          : [],
      };

      return res.json({
        success: true,
        data: sanitized,
      });
    } catch (err: any) {
      console.error("Error in /api/explain:", err);
      return res.status(500).json({
        error: err.message || "Failed to generate explanation. Please try again.",
      });
    }
  });

  // 2. Focused point clarification endpoint: "I still don't understand [X]"
  // Crucial: receives BOTH originalContext and the specific point
  app.post("/api/simplify-point", async (req, res) => {
    try {
      const { originalContext, point, level } = req.body;

      if (!point || typeof point !== "string") {
        return res.status(400).json({ error: "Missing key point to clarify." });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are a patient, friendly tutor. A student looked at an explanation and clicked "I don't get this one" on a specific point.
They need an ultra-clear, even simpler re-explanation tailored specifically to this sub-point.
Keep the original context in mind so you don't lose the overarching subject.
Provide:
- simplifiedExplanation: 2-3 super clear, gentle sentences stripping away all confusion.
- analogy: A tiny, concrete physical analogy (like baking, playing with blocks, traffic, or smartphones).
- takeaway: One memorable takeaway sentence or rule of thumb.`;

      const prompt = `Overarching Subject Context:
"""
${(originalContext || "").trim()}
"""

The specific point the student is struggling with:
"""
${point.trim()}
"""

Explanation level preference: ${level || "very_simple"}

Re-explain ONLY this point in ultra-simple, reassuring terms so a student says 'Oh, I get it now!'`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              simplifiedExplanation: {
                type: Type.STRING,
                description: "Gentle, ultra-simple re-explanation of this specific point",
              },
              analogy: {
                type: Type.STRING,
                description: "A concrete physical analogy for this single point",
              },
              takeaway: {
                type: Type.STRING,
                description: "One snappy takeaway sentence to remember",
              },
            },
            required: ["simplifiedExplanation", "analogy", "takeaway"],
          },
        },
      });

      const rawText = response.text || "{}";
      const parsedData = parseJsonSafely(rawText);

      const sanitized = {
        simplifiedExplanation: parsedData.simplifiedExplanation || "Here is a simpler look at this specific point.",
        analogy: parsedData.analogy || "",
        takeaway: parsedData.takeaway || "",
      };

      return res.json({
        success: true,
        data: sanitized,
      });
    } catch (err: any) {
      console.error("Error in /api/simplify-point:", err);
      return res.status(500).json({
        error: err.message || "Failed to clarify this point. Please try again.",
      });
    }
  });

  // 3. OCR image transcription endpoint (for photographed textbook pages or handwritten notes)
  app.post("/api/ocr", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Please provide image data to transcribe." });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
      const cleanMimeType = mimeType || "image/jpeg";

      const ai = getGeminiClient();

      const imagePart = {
        inlineData: {
          mimeType: cleanMimeType,
          data: cleanBase64,
        },
      };

      const promptPart = {
        text: "You are an accurate academic OCR tool. Please transcribe all the academic text, notes, equations, or questions visible in this image. Clean up minor typos, preserve logical paragraphs, and return ONLY the transcribed study text so the student can study it.",
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: {
          parts: [imagePart, promptPart],
        },
      });

      const extractedText = (response.text || "").trim();

      return res.json({
        success: true,
        text: extractedText,
      });
    } catch (err: any) {
      console.error("Error in /api/ocr:", err);
      return res.status(500).json({
        error: err.message || "Failed to transcribe image. Please try again or type the text manually.",
      });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EZlearn server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
