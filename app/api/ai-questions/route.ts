import { NextResponse } from "next/server";
import { buildGeneratedQuestions } from "@/lib/seedData";
import type { Difficulty, Question } from "@/lib/types";

type GeneratedQuestion = Omit<Question, "id" | "quiz_id">;

const validDifficulties: Difficulty[] = ["Easy", "Medium", "Hard"];
const validAnswers = ["A", "B", "C", "D"] as const;

function promptFor(topic: string, difficulty: Difficulty, count: number) {
  return `Generate ${count} original multiple-choice quiz questions for an academic assessment.
Topic: ${topic}
Difficulty: ${difficulty}

Return only valid JSON with this exact shape:
{
  "questions": [
    {
      "question_text": "Question text",
      "option_a": "Option A",
      "option_b": "Option B",
      "option_c": "Option C",
      "option_d": "Option D",
      "correct_answer": "A",
      "marks": 5,
      "topic": "${topic}",
      "difficulty": "${difficulty}"
    }
  ]
}

Rules:
- correct_answer must be one of A, B, C, D.
- Make all options plausible but only one correct.
- Do not include markdown, explanation, comments, or extra text.`;
}

function extractJson(text: string) {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("AI response did not contain JSON.");
  return JSON.parse(cleaned.slice(start, end + 1)) as { questions?: GeneratedQuestion[] };
}

function sanitizeQuestions(input: unknown, topic: string, difficulty: Difficulty): GeneratedQuestion[] {
  const questions = Array.isArray(input) ? input : [];

  return questions
    .map((item) => item as Partial<GeneratedQuestion>)
    .filter(
      (item) =>
        item.question_text &&
        item.option_a &&
        item.option_b &&
        item.option_c &&
        item.option_d &&
        item.correct_answer &&
        validAnswers.includes(item.correct_answer),
    )
    .slice(0, 5)
    .map((item) => ({
      question_text: String(item.question_text).trim(),
      option_a: String(item.option_a).trim(),
      option_b: String(item.option_b).trim(),
      option_c: String(item.option_c).trim(),
      option_d: String(item.option_d).trim(),
      correct_answer: item.correct_answer as "A" | "B" | "C" | "D",
      marks: Number.isFinite(Number(item.marks)) ? Math.max(1, Number(item.marks)) : 5,
      topic,
      difficulty,
    }));
}

async function generateWithGemini(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    },
  );

  if (!response.ok) throw new Error(`Gemini request failed with ${response.status}.`);
  const payload = await response.json();
  return payload?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
}

async function generateWithOpenAI(prompt: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You generate concise academic MCQ questions and return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) throw new Error(`OpenAI request failed with ${response.status}.`);
  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content as string | undefined;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    quizId?: string;
    topic?: string;
    difficulty?: Difficulty;
    count?: number;
  };

  const quizId = body.quizId?.trim();
  const topic = body.topic?.trim() || "Course Topic";
  const difficulty = validDifficulties.includes(body.difficulty as Difficulty)
    ? (body.difficulty as Difficulty)
    : "Medium";
  const count = Math.min(Math.max(Number(body.count) || 3, 1), 5);

  if (!quizId) {
    return NextResponse.json({ error: "Missing quizId." }, { status: 400 });
  }

  const fallback = buildGeneratedQuestions(quizId, topic, difficulty);
  const prompt = promptFor(topic, difficulty, count);

  try {
    const provider = process.env.GEMINI_API_KEY ? "gemini" : process.env.OPENAI_API_KEY ? "openai" : "local-generator";
    const raw = (await generateWithGemini(prompt)) || (await generateWithOpenAI(prompt));

    if (!raw) {
      return NextResponse.json({ provider, questions: fallback });
    }

    const parsed = extractJson(raw);
    const generated = sanitizeQuestions(parsed.questions, topic, difficulty).map((question, index) => ({
      id: `q_ai_${Date.now().toString(36)}_${index}_${Math.random().toString(36).slice(2, 8)}`,
      quiz_id: quizId,
      ...question,
    }));

    return NextResponse.json({
      provider,
      questions: generated.length > 0 ? generated : fallback,
    });
  } catch (error) {
    return NextResponse.json({
      provider: "local-generator",
      warning: error instanceof Error ? error.message : "AI generation failed.",
      questions: fallback,
    });
  }
}
