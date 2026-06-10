"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell, Panel, StatCard } from "@/components/AppShell";
import {
  getData,
  getDraft,
  logIntegrityEvent,
  requireRole,
  saveDraft,
  submitQuiz,
} from "@/lib/demoStore";
import { riskPoints } from "@/lib/risk";
import type { AppData, IntegrityLog, User } from "@/lib/types";

export default function TakeQuizPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [events, setEvents] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const auth = requireRole(["student"]);
    if (auth.redirect) {
      router.replace(auth.redirect);
      return;
    }
    const appData = getData();
    const quiz = appData.quizzes.find((item) => item.id === params.id);
    setUser(auth.user);
    setData(appData);
    setAnswers(getDraft(params.id, auth.user.id));
    setTimeLeft((quiz?.duration || 1) * 60);
  }, [params.id, router]);

  const model = useMemo(() => {
    if (!data) return null;
    const quiz = data.quizzes.find((item) => item.id === params.id);
    const course = data.courses.find((item) => item.id === quiz?.course_id);
    const questions = data.questions.filter((item) => item.quiz_id === params.id);
    return { quiz, course, questions };
  }, [data, params.id]);

  useEffect(() => {
    if (!user || !model?.quiz?.integrity_enabled) return;

    function record(event_type: IntegrityLog["event_type"]) {
      const risk_points = riskPoints[event_type];
      logIntegrityEvent({
        quiz_id: params.id,
        student_id: user.id,
        event_type,
        risk_points,
        source: "web",
      });
      fetch("/api/monitor/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quiz_id: params.id,
          student_id: user.id,
          event_type,
          risk_points,
          source: "web",
          details: "Captured from browser exam mode.",
        }),
      }).catch(() => undefined);
      setEvents((count) => count + 1);
    }

    function onVisibility() {
      if (document.hidden) record("TAB_SWITCH");
    }

    function onPaste(e: ClipboardEvent) {
      e.preventDefault();
      record("COPY_PASTE");
    }

    function onFullscreen() {
      if (!document.fullscreenElement) record("FULLSCREEN_EXIT");
    }

    function onBlur() {
      record("WINDOW_BLUR");
    }

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("paste", onPaste);
    document.addEventListener("fullscreenchange", onFullscreen);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("fullscreenchange", onFullscreen);
      window.removeEventListener("blur", onBlur);
    };
  }, [model?.quiz?.integrity_enabled, params.id, user]);

  useEffect(() => {
    if (!user || !model?.quiz) return;

    fetch("/api/monitor/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quiz_id: model.quiz.id,
        quiz_title: model.quiz.title,
        student_id: user.id,
        student_name: user.name,
        active: true,
      }),
    }).catch(() => undefined);

    return () => {
      fetch("/api/monitor/session", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quiz_id: model.quiz?.id,
          student_id: user.id,
        }),
      }).catch(() => undefined);
    };
  }, [model?.quiz, user]);

  useEffect(() => {
    if (!user) return;
    saveDraft(params.id, user.id, answers);
  }, [answers, params.id, user]);

  useEffect(() => {
    if (!user || timeLeft <= 0) return;
    const timer = window.setInterval(() => setTimeLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [timeLeft, user]);

  useEffect(() => {
    if (user && timeLeft === 0 && Object.keys(answers).length > 0) {
      handleSubmit();
    }
  }, [timeLeft]);

  function updateAnswer(questionId: string, answer: string) {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  }

  function handleSubmit() {
    if (!user || !model?.quiz) return;
    fetch("/api/monitor/session", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quiz_id: model.quiz.id,
        student_id: user.id,
      }),
    }).catch(() => undefined);
    const submission = submitQuiz(model.quiz.id, user.id, answers);
    router.push(`/results/${submission.id}`);
  }

  function requestFullscreen() {
    document.documentElement.requestFullscreen?.();
  }

  if (!user || !model?.quiz) return null;

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <AppShell user={user} title={model.quiz.title} subtitle={model.quiz.description}>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Course" value={model.course?.title || "Course"} helper={model.quiz.difficulty} />
        <StatCard label="Timer" value={`${minutes}:${seconds}`} helper={`${model.quiz.duration} minute limit`} />
        <StatCard label="Answered" value={`${Object.keys(answers).length}/${model.questions.length}`} helper="Autosaved locally" />
        <StatCard label="Integrity signals" value={events} helper={model.quiz.integrity_enabled ? "Recorded for teacher/admin review" : "Detection off"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {model.questions.map((question, index) => (
            <Panel key={question.id} title={`${index + 1}. ${question.question_text}`}>
              <div className="space-y-3">
                {(["A", "B", "C", "D"] as const).map((option) => (
                  <label key={option} className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4 hover:border-slate-400">
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={(e) => updateAnswer(question.id, e.target.value)}
                    />
                    <span>{option}. {question[`option_${option.toLowerCase()}`]}</span>
                  </label>
                ))}
              </div>
            </Panel>
          ))}
        </div>

        <aside className="space-y-4">
          <Panel title="Exam Integrity Notice">
            <p className="text-sm text-slate-600">
              During the exam, privacy-friendly browser signals are recorded for professor/admin review. Students cannot access the monitoring dashboard.
            </p>
            <button onClick={requestFullscreen} className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold">
              Enter fullscreen
            </button>
          </Panel>
          <button onClick={handleSubmit} className="w-full rounded-xl bg-slate-950 px-5 py-4 font-semibold text-white">
            Submit quiz
          </button>
        </aside>
      </div>
    </AppShell>
  );
}
