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

      const levelDescriptions = {
        very_simple: "Explain Like I'm 5 (ELI5): Use the simplest possible language, zero academic jargon, relatable kindergarten/primary grade vocabulary, ultra-gentle tone.",
        simple: "Standard High School / Undergrad Student Level: Clear, intuitive, conversational, eliminating dense academic convolution while maintaining core concepts.",
        detailed: "Deep / Technical Breakdown: Thorough conceptual clarity with technical accuracy, breaking down nuances clearly without sacrificing depth."
      };

      const selectedLevelDesc = levelDescriptions[level as keyof typeof levelDescriptions] || levelDescriptions.simple;

      const systemInstruction = `You are a warm, encouraging, patient older sibling and master study mentor for stressed students.
Your mission is to translate difficult, dense academic text or questions into crystal-clear, structured explanations.
Tone guidelines:
- Warm, empathetic, and encouraging ("You've got this!", "Let's make sense of this together").
- Never condescending, never robotic, never textbook-dry.
- Use vivid, sensory real-life analogies that make abstract things immediately intuitive.
- Strictly adhere to the requested JSON structure. Every section must be rich, thoughtful, and immediately helpful for learning.`;

      const prompt = `Explanation Level Target: ${selectedLevelDesc}

Original Academic Text / Concept to Explain:
"""
${text.trim()}
"""

Please translate this into the structured format:
1. "simple": Super Simple — 1 to 2 plain, jargon-free sentences capturing the whole idea.
2. "example": Real-life example — an everyday "Imagine..." scenario or analogy that a student can immediately visualize in their living room, kitchen, sports, or everyday life.
3. "breakdown": 2 to 4 components showing: Concept → Parts → How they connect (each part has a name and a description of what it does).
4. "keyPoints": 3 to 5 clear, essential bullet takeaways.
5. "mnemonic": A catchy mnemonic rhyme, acronym, memory trick, or punchy formula to lock it into memory.
6. "quiz": 3 to 5 multiple-choice questions (each has a question, exactly 4 plausible options, correctIndex 0-3, and a friendly explanation of why the right answer is correct).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              simple: {
                type: Type.STRING,
                description: "Super Simple — one or two plain sentences, no jargon",
              },
              example: {
                type: Type.STRING,
                description: "Real-life example — an 'Imagine...' style everyday analogy",
              },
              breakdown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    part: { type: Type.STRING, description: "Name of the component or step" },
                    description: { type: Type.STRING, description: "What it does and how it connects to the whole" },
                  },
                  required: ["part", "description"],
                },
                description: "Break it down: Concept -> Parts -> How they connect",
              },
              keyPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 to 5 bullet points, auto-extracted",
              },
              mnemonic: {
                type: Type.STRING,
                description: "Remember it — a short mnemonic, formula, or one-line summary",
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
            required: ["simple", "example", "breakdown", "keyPoints", "mnemonic", "quiz"],
          },
        },
      });

      const rawText = response.text || "{}";
      const parsedData = JSON.parse(rawText);

      return res.json({
        success: true,
        data: parsedData,
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
      const parsedData = JSON.parse(rawText);

      return res.json({
        success: true,
        data: parsedData,
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
