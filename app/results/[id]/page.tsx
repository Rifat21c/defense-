"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell, Panel, RiskBadge, StatCard } from "@/components/AppShell";
import { getData, getIntegritySummary, gradeLabel, requireRole, scoreOutOf } from "@/lib/demoStore";
import type { AppData, User } from "@/lib/types";

export default function ResultDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    const auth = requireRole(["student", "professor", "admin"]);
    if (auth.redirect) {
      router.replace(auth.redirect);
      return;
    }
    setUser(auth.user);
    setData(getData());
  }, [router]);

  const model = useMemo(() => {
    if (!data) return null;
    const submission = data.submissions.find((item) => item.id === params.id);
    const quiz = data.quizzes.find((item) => item.id === submission?.quiz_id);
    const course = data.courses.find((item) => item.id === quiz?.course_id);
    const student = data.users.find((item) => item.id === submission?.student_id);
    const questions = data.questions.filter((item) => item.quiz_id === quiz?.id);
    const integrity = submission ? getIntegritySummary(submission.quiz_id, submission.student_id) : null;
    return { submission, quiz, course, student, questions, integrity };
  }, [data, params.id]);

  if (!user || !data || !model?.submission || !model.quiz || !model.integrity) return null;

  const canSeeIntegrity = user.role !== "student";

  return (
    <AppShell user={user} title="Result Details" subtitle={`${model.student?.name} / ${model.quiz.title}`}>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Score" value={`${scoreOutOf(model.submission.score, model.quiz.total_marks)}/${model.quiz.total_marks}`} helper={gradeLabel(model.submission.score, model.quiz.total_marks)} />
        <StatCard label="Course" value={model.course?.title || "Course"} helper={model.quiz.difficulty} />
        <StatCard label="Submitted" value={new Date(model.submission.submitted_at).toLocaleDateString()} helper="Assessment complete" />
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Risk level</p>
          <div className="mt-4">{canSeeIntegrity ? <RiskBadge risk={model.integrity.risk} /> : <span className="text-sm text-slate-600">Teacher/admin only</span>}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Panel title="AI Feedback">
          <p className="leading-7 text-slate-700">{model.submission.ai_feedback}</p>
        </Panel>

        <Panel title="Revision Guidance">
          <p className="text-sm text-slate-600">
            Revisit incorrect questions, summarize the topic in your own words, and practice with one higher-difficulty item before the next assessment.
          </p>
        </Panel>
      </div>

      <Panel title="Answer Review">
        <div className="space-y-3">
          {model.questions.map((question) => {
            const selected = model.submission.answers[question.id] || "Not answered";
            const correct = selected === question.correct_answer;
            return (
              <div key={question.id} className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold">{question.question_text}</p>
                <p className={`mt-2 text-sm ${correct ? "text-emerald-700" : "text-rose-700"}`}>
                  Your answer: {selected} / Correct answer: {question.correct_answer}
                </p>
                <p className="mt-1 text-xs text-slate-500">{question.topic}</p>
              </div>
            );
          })}
        </div>
      </Panel>

      {canSeeIntegrity && (
        <Panel title="Integrity Details">
          <p className="mb-4 text-sm text-slate-600">Integrity score: {model.integrity.integrityScore}/100 / Risk points: {model.integrity.points}</p>
          <div className="space-y-2">
            {model.integrity.logs.map((log) => (
              <div key={log.id} className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm">
                <span>{log.event_type}</span>
                <span>{log.risk_points} points</span>
              </div>
            ))}
            {model.integrity.logs.length === 0 && <p className="text-sm text-slate-600">No integrity events recorded.</p>}
          </div>
        </Panel>
      )}
    </AppShell>
  );
}
