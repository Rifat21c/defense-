"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell, Panel } from "@/components/AppShell";
import { createQuiz, getData, requireRole } from "@/lib/demoStore";
import type { AppData, Difficulty, User } from "@/lib/types";

export default function QuizCreationPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(20);
  const [totalMarks, setTotalMarks] = useState(20);
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [integrityEnabled, setIntegrityEnabled] = useState(true);

  useEffect(() => {
    const auth = requireRole(["professor", "admin"]);
    if (auth.redirect) {
      router.replace(auth.redirect);
      return;
    }
    setUser(auth.user);
    const appData = getData();
    const selectedCourse = new URLSearchParams(window.location.search).get("course");
    const ownedCourses =
      auth.user.role === "admin"
        ? appData.courses
        : appData.courses.filter((course) => course.professor_id === auth.user.id);

    setData(appData);
    setCourseId(selectedCourse || ownedCourses[0]?.id || "");
  }, [router]);

  const courses = useMemo(() => {
    if (!data || !user) return [];
    if (user.role === "admin") return data.courses;
    return data.courses.filter((course) => course.professor_id === user.id);
  }, [data, user]);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !courseId || !title.trim()) return;
    const quiz = createQuiz({
      course_id: courseId,
      title,
      description,
      duration,
      total_marks: totalMarks,
      difficulty,
      integrity_enabled: integrityEnabled,
      professor_id: user.id,
    });
    router.push(`/quizzes/${quiz.id}/questions`);
  }

  if (!user || !data) return null;

  return (
    <AppShell user={user} title="Create Quiz" subtitle="Set assessment metadata, difficulty, marks, and integrity detection settings.">
      <Panel title="Quiz Setup">
        <form onSubmit={handleCreate} className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Course</label>
            <select className="mt-2 w-full rounded-xl border border-slate-200 p-3" value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
              <option value="">Select course</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Quiz title</label>
            <input className="mt-2 w-full rounded-xl border border-slate-200 p-3" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="lg:col-span-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Duration minutes</label>
            <input className="mt-2 w-full rounded-xl border border-slate-200 p-3" type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Total marks</label>
            <input className="mt-2 w-full rounded-xl border border-slate-200 p-3" type="number" min={1} value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Difficulty</label>
            <select className="mt-2 w-full rounded-xl border border-slate-200 p-3" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
            <input type="checkbox" checked={integrityEnabled} onChange={(e) => setIntegrityEnabled(e.target.checked)} />
            <span>
              <span className="block font-medium">Enable integrity detection</span>
              <span className="text-sm text-slate-600">Tracks tab switching, copy-paste, fullscreen exit, and blur events.</span>
            </span>
          </label>
          <div className="lg:col-span-2">
            <button className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">Create quiz and add questions</button>
          </div>
        </form>
      </Panel>
    </AppShell>
  );
}
