"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell, Panel, StatCard } from "@/components/AppShell";
import { getData, requireRole } from "@/lib/demoStore";
import type { AppData, User } from "@/lib/types";

export default function CourseDetailsPage() {
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
    const course = data.courses.find((item) => item.id === params.id);
    const relatedCourseIds = data.courses
      .filter((item) => item.id === params.id || item.join_code === course?.join_code)
      .map((item) => item.id);
    const professor = data.users.find((item) => item.id === course?.professor_id);
    const quizzes = data.quizzes.filter((item) => relatedCourseIds.includes(item.course_id));
    const enrollments = data.enrollments.filter((item) => relatedCourseIds.includes(item.course_id));
    const students = data.users.filter((item) => enrollments.some((enrollment) => enrollment.student_id === item.id));
    return { course, professor, quizzes, students };
  }, [data, params.id]);

  if (!user || !data || !model?.course) return null;

  const canManage = user.role === "admin" || model.course.professor_id === user.id;

  return (
    <AppShell user={user} title={model.course.title} subtitle={model.course.description}>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Join code" value={model.course.join_code} helper="Share with students" />
        <StatCard label="Quizzes" value={model.quizzes.length} helper="Assessments in course" />
        <StatCard label="Students" value={model.students.length} helper="Enrolled learners" />
        <StatCard label="Department" value={model.course.department} helper={`Professor: ${model.professor?.name || "Unassigned"}`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title="Quizzes"
          action={
            canManage ? (
              <Link href={`/quizzes/create?course=${model.course.id}`} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                Create quiz
              </Link>
            ) : null
          }
        >
          <div className="space-y-3">
            {model.quizzes.map((quiz) => {
              const questions = data.questions.filter((item) => item.quiz_id === quiz.id);
              const submitted = data.submissions.some((item) => item.quiz_id === quiz.id && item.student_id === user.id);
              return (
                <div key={quiz.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-semibold">{quiz.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{quiz.duration} min · {quiz.total_marks} marks · {quiz.difficulty}</p>
                      <p className="mt-1 text-sm text-slate-500">{questions.length} questions</p>
                    </div>
                    <div className="flex gap-2">
                      {user.role === "student" && (
                        <Link href={`/quizzes/${quiz.id}`} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                          {submitted ? "Retake" : "Take quiz"}
                        </Link>
                      )}
                      {canManage && (
                        <Link href={`/quizzes/${quiz.id}/questions`} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">
                          Questions
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {model.quizzes.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                <p>No quizzes have been created for this enrolled course yet.</p>
                {user.role === "student" && (
                  <p className="mt-2">
                    Ask your professor to confirm the quiz was created inside join code <b>{model.course.join_code}</b>.
                  </p>
                )}
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Enrolled Students">
          <div className="space-y-3">
            {model.students.map((student) => (
              <div key={student.id} className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold">{student.name}</p>
                <p className="text-sm text-slate-600">{student.email}</p>
              </div>
            ))}
            {model.students.length === 0 && <p className="text-sm text-slate-600">No students enrolled yet.</p>}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
