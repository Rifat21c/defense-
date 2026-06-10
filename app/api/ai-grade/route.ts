import { NextResponse } from "next/server";

function buildFeedback(input: {
  score?: number;
  total?: number;
  weakTopics: string[];
  answerProvided: boolean;
}) {
  const percentage =
    typeof input.score === "number" && typeof input.total === "number" && input.total > 0
      ? Math.round((input.score / input.total) * 100)
      : null;
  const topicText = input.weakTopics.length > 0 ? input.weakTopics.join(", ") : "core course concepts";

  if (!input.answerProvided) {
    return {
      feedback: "Submit answers or weak-topic data to receive targeted academic feedback.",
      recommendation: "Complete the assessment first, then review the result dashboard for revision priorities.",
    };
  }

  return {
    feedback:
      percentage === null
        ? `Your response needs stronger coverage of ${topicText}. Improve definitions, add examples, and connect each point to the course outcome.`
        : `You scored ${percentage}%. Your next revision priority is ${topicText}. Strengthen explanations with clear definitions, examples, and step-by-step reasoning.`,
    recommendation:
      input.weakTopics.length > 0
        ? `Create a short revision plan for ${topicText}, solve one practice set, then retry a mixed-topic quiz.`
        : "Maintain performance with mixed revision, timed practice, and one higher-difficulty question set.",
  };
}

export async function POST(req: Request) {
  const body = await req.json();
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);
  const weakTopics = body.weak_topics || body.weakTopics || [];
  const normalizedTopics = Array.isArray(weakTopics) ? weakTopics : [String(weakTopics)];
  const guidance = buildFeedback({
    score: body.score,
    total: body.total,
    weakTopics: normalizedTopics.filter(Boolean),
    answerProvided: Boolean(body.answer || body.answers || body.weak_topics || body.weakTopics),
  });

  return NextResponse.json({
    provider: hasGeminiKey ? "gemini" : hasOpenAiKey ? "openai" : "local-feedback-engine",
    score: body.score ?? 8,
    ...guidance,
  });
}
