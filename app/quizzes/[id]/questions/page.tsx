"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell, Panel } from "@/components/AppShell";
import { addQuestion, generateAiQuestions, getData, requireRole } from "@/lib/demoStore";
import type { AppData, Difficulty, Question, User } from "@/lib/types";

export default function AddQuestionsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationDescription, setGenerationDescription] = useState("");
  const [form, setForm] = useState<Omit<Question, "id" | "quiz_id">>({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A",
    marks: 5,
    topic: "Course Topic",
    difficulty: "Medium",
  });

  useEffect(() => {
    const auth = requireRole(["professor", "admin"]);
    if (auth.redirect) {
      router.replace(auth.redirect);
      return;
    }
    setUser(auth.user);
    setData(getData());
  }, [router]);

  const model = useMemo(() => {
    if (!data) return null;
    const quiz = data.quizzes.find((item) => item.id === params.id);
    const questions = data.questions.filter((item) => item.quiz_id === params.id);
    return { quiz, questions };
  }, [data, params.id]);

  function update(key: keyof typeof form, value: string | number) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    addQuestion({ quiz_id: params.id, ...form });
    setForm((current) => ({
      ...current,
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
    }));
    setData(getData());
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generateAiQuestions(
        params.id,
        form.topic || "Course Topic",
        form.difficulty as Difficulty,
        generationDescription || model?.quiz?.description || "",
      );
      setData(getData());
    } finally {
      setGenerating(false);
    }
  }

  if (!user || !data || !model?.quiz) return null;

  return (
    <AppShell user={user} title="Question Builder" subtitle={model.quiz.title}>
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Panel title="Add Question Manually">
          <form onSubmit={handleAdd} className="space-y-3">
            <textarea className="min-h-24 w-full rounded-xl border border-slate-200 p-3" placeholder="Question text" value={form.question_text} onChange={(e) => update("question_text", e.target.value)} required />
            {(["a", "b", "c", "d"] as const).map((key) => (
              <input
                key={key}
                className="w-full rounded-xl border border-slate-200 p-3"
                placeholder={`Option ${key.toUpperCase()}`}
                value={form[`option_${key}`]}
                onChange={(e) => update(`option_${key}` as keyof typeof form, e.target.value)}
                required
              />
            ))}
            <div className="grid gap-3 sm:grid-cols-3">
              <select className="rounded-xl border border-slate-200 p-3" value={form.correct_answer} onChange={(e) => update("correct_answer", e.target.value)}>
                <option>A</option>
                <option>B</option>
                <option>C</option>
                <option>D</option>
              </select>
              <input className="rounded-xl border border-slate-200 p-3" type="number" min={1} value={form.marks} onChange={(e) => update("marks", Number(e.target.value))} />
              <select className="rounded-xl border border-slate-200 p-3" value={form.difficulty} onChange={(e) => update("difficulty", e.target.value)}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <input className="w-full rounded-xl border border-slate-200 p-3" placeholder="Topic" value={form.topic} onChange={(e) => update("topic", e.target.value)} required />
            <textarea
              className="min-h-24 w-full rounded-xl border border-slate-200 p-3"
              placeholder="Topic description for AI generation, for example: supervised learning, regression vs classification, overfitting, bias-variance tradeoff"
              value={generationDescription}
              onChange={(e) => setGenerationDescription(e.target.value)}
            />
            <div className="flex flex-wrap gap-3">
              <button className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">Save question</button>
              <button type="button" onClick={handleGenerate} disabled={generating} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60">
                {generating ? "Generating..." : "Generate AI questions"}
              </button>
            </div>
          </form>
        </Panel>

        <Panel title={`Questions (${model.questions.length})`}>
          <div className="space-y-3">
            {model.questions.map((question, index) => (
              <div key={question.id} className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold">{index + 1}. {question.question_text}</p>
                <p className="mt-2 text-sm text-slate-600">{question.topic} · {question.marks} marks · Answer {question.correct_answer}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
