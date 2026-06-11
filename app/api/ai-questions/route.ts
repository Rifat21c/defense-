import { NextResponse } from "next/server";
import type { Difficulty, Question } from "@/lib/types";

type GeneratedQuestion = Omit<Question, "id" | "quiz_id">;

const validDifficulties: Difficulty[] = ["Easy", "Medium", "Hard"];
const validAnswers = ["A", "B", "C", "D"] as const;

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function questionId(index: number) {
  return `q_ai_${Date.now().toString(36)}_${index}_${Math.random().toString(36).slice(2, 8)}`;
}

function keywordsFrom(topic: string, description: string) {
  const phrases = description
    .split(/[,;.\n]+/)
    .map((phrase) => phrase.trim())
    .filter((phrase) => phrase.length > 3)
    .slice(0, 6);

  if (phrases.length > 0) return phrases;

  const topicWords = new Set(topic.toLowerCase().split(/\s+/));
  const words = `${topic} ${description}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .filter((word) => !topicWords.has(word))
    .filter((word) => !["about", "which", "their", "there", "these", "those", "question"].includes(word));

  return Array.from(new Set(words)).slice(0, 6);
}

function makeQuestion(
  quizId: string,
  topic: string,
  difficulty: Difficulty,
  question: Omit<GeneratedQuestion, "topic" | "difficulty" | "marks">,
  index: number,
): Question {
  return {
    id: questionId(index),
    quiz_id: quizId,
    marks: difficulty === "Hard" ? 10 : 5,
    topic,
    difficulty,
    ...question,
  };
}

function buildLocalOriginalQuestions(input: {
  quizId: string;
  topic: string;
  description: string;
  difficulty: Difficulty;
  count: number;
  existingQuestionTexts: string[];
}) {
  const keywords = keywordsFrom(input.topic, input.description);
  const focus = keywords[0] || input.topic;
  const secondFocus = keywords[1] || "core concept";
  const thirdFocus = keywords[2] || "real-world application";
  const scenario = input.description || `a course assessment about ${input.topic}`;
  const candidates: Array<Omit<GeneratedQuestion, "topic" | "difficulty" | "marks">> = [
    {
      question_text: `In ${input.topic}, what is the main purpose of ${focus}?`,
      option_a: `To help explain or solve a specific ${input.topic} problem`,
      option_b: "To remove the need for assessment criteria",
      option_c: "To make every answer automatically correct",
      option_d: "To avoid explaining the concept to learners",
      correct_answer: "A",
    },
    {
      question_text: `Which example best demonstrates practical understanding of ${input.topic}?`,
      option_a: `Applying ${focus} within this context: ${scenario}`,
      option_b: "Memorizing unrelated definitions only",
      option_c: "Skipping the topic when it becomes difficult",
      option_d: "Choosing answers randomly without reasoning",
      correct_answer: "A",
    },
    {
      question_text: `A student misunderstands ${secondFocus} while studying ${input.topic}. What should they do first?`,
      option_a: "Ignore the weak area and move on",
      option_b: `Review the concept, compare examples, and practice ${secondFocus}`,
      option_c: "Submit the assessment without revision",
      option_d: "Delete the topic from the course outline",
      correct_answer: "B",
    },
    {
      question_text: `How does ${thirdFocus} help evaluate understanding of ${input.topic}?`,
      option_a: "It connects the concept to evidence and decision-making",
      option_b: "It guarantees full marks without reasoning",
      option_c: "It removes the need to compare alternatives",
      option_d: "It makes the topic unrelated to the course",
      correct_answer: "A",
    },
    {
      question_text: `For a ${input.difficulty.toLowerCase()} assessment on ${input.topic}, which question design is strongest?`,
      option_a: "A question with no correct answer",
      option_b: "A question unrelated to the topic",
      option_c: "A question that tests application, reasoning, and one clear answer",
      option_d: "A question where all options mean the same thing",
      correct_answer: "C",
    },
    {
      question_text: `Why is feedback important after assessing ${input.topic}?`,
      option_a: "It hides the result from the learner",
      option_b: "It replaces the professor completely",
      option_c: `It helps identify weak areas such as ${focus} and plan revision`,
      option_d: "It prevents students from reviewing mistakes",
      correct_answer: "C",
    },
    {
      question_text: `Which statement shows the best critical thinking about ${input.topic}?`,
      option_a: `${input.topic} should be connected to evidence, examples, and limitations`,
      option_b: `${input.topic} never needs examples`,
      option_c: `${input.topic} is only useful when no data is available`,
      option_d: `${input.topic} should be evaluated without context`,
      correct_answer: "A",
    },
  ];

  const existing = new Set(input.existingQuestionTexts.map(normalizeText));
  const unique = candidates
    .filter((question) => !existing.has(normalizeText(question.question_text)))
    .slice(0, input.count)
    .map((question, index) => makeQuestion(input.quizId, input.topic, input.difficulty, question, index));

  return unique.length > 0
    ? unique
    : [
        makeQuestion(
          input.quizId,
          input.topic,
          input.difficulty,
          {
            question_text: `Which new scenario best tests ${input.topic} in relation to ${Date.now().toString(36)}?`,
            option_a: "A realistic case that requires applying the concept",
            option_b: "A repeated question with identical options",
            option_c: "A question without a correct answer",
            option_d: "An unrelated memory-only prompt",
            correct_answer: "A",
          },
          0,
        ),
      ];
}

function promptFor(
  topic: string,
  description: string,
  difficulty: Difficulty,
  count: number,
  existingQuestionTexts: string[],
) {
  return `Generate ${count} original multiple-choice quiz questions for an academic assessment.
Topic: ${topic}
Topic description/context: ${description || "No extra description provided."}
Difficulty: ${difficulty}
Do not repeat or paraphrase these existing questions:
${existingQuestionTexts.length > 0 ? existingQuestionTexts.map((text) => `- ${text}`).join("\n") : "- None"}

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
- Questions must be specific to the topic description/context, not generic study advice.
- Avoid duplicate wording and avoid repeating existing questions.
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

function removeDuplicates(questions: GeneratedQuestion[], existingQuestionTexts: string[]) {
  const seen = new Set(existingQuestionTexts.map(normalizeText));
  return questions.filter((question) => {
    const normalized = normalizeText(question.question_text);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

async function generateWithGemini(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
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
    description?: string;
    difficulty?: Difficulty;
    count?: number;
    existingQuestionTexts?: string[];
  };

  const quizId = body.quizId?.trim();
  const topic = body.topic?.trim() || "Course Topic";
  const description = body.description?.trim() || "";
  const difficulty = validDifficulties.includes(body.difficulty as Difficulty)
    ? (body.difficulty as Difficulty)
    : "Medium";
  const count = Math.min(Math.max(Number(body.count) || 3, 1), 5);
  const existingQuestionTexts = Array.isArray(body.existingQuestionTexts)
    ? body.existingQuestionTexts.map((text) => String(text))
    : [];

  if (!quizId) {
    return NextResponse.json({ error: "Missing quizId." }, { status: 400 });
  }

  const fallback = buildLocalOriginalQuestions({
    quizId,
    topic,
    description,
    difficulty,
    count,
    existingQuestionTexts,
  });
  const prompt = promptFor(topic, description, difficulty, count, existingQuestionTexts);

  try {
    const provider = process.env.GEMINI_API_KEY ? "gemini" : process.env.OPENAI_API_KEY ? "openai" : "local-generator";
    const raw = (await generateWithGemini(prompt)) || (await generateWithOpenAI(prompt));

    if (!raw) {
      return NextResponse.json({ provider, questions: fallback });
    }

    const parsed = extractJson(raw);
    const generated = removeDuplicates(
      sanitizeQuestions(parsed.questions, topic, difficulty),
      existingQuestionTexts,
    ).map((question, index) => ({
      id: questionId(index),
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
