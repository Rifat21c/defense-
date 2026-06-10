"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell, EmptyState, Panel, RiskBadge, StatCard } from "@/components/AppShell";
import { createCourse, getData, getIntegritySummary, requireRole } from "@/lib/demoStore";
import type { AppData, User } from "@/lib/types";

export default function ProfessorDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const auth = requireRole(["professor"]);
    if (auth.redirect) {
      router.replace(auth.redirect);
      return;
    }
    setUser(auth.user);
    setData(getData());

    function refreshData() {
      setData(getData());
    }

    window.addEventListener("focus", refreshData);
    document.addEventListener("visibilitychange", refreshData);

    return () => {
      window.removeEventListener("focus", refreshData);
      document.removeEventListener("visibilitychange", refreshData);
    };
  }, [router]);

  const model = useMemo(() => {
    if (!user || !data) return null;
    const courses = data.courses.filter((course) => course.professor_id === user.id);
    const professorJoinCodes = courses.map((course) => course.join_code);
    const relatedCourseIds = data.courses
      .filter((course) => course.professor_id === user.id || professorJoinCodes.includes(course.join_code))
      .map((course) => course.id);
    const quizzes = data.quizzes.filter((quiz) => relatedCourseIds.includes(quiz.course_id));
    const quizIds = quizzes.map((quiz) => quiz.id);
    const submissions = data.submissions.filter((submission) => quizIds.includes(submission.quiz_id));
    const enrolledStudents = data.enrollments
      .filter((enrollment) => relatedCourseIds.includes(enrollment.course_id))
      .map((enrollment) => {
        const student = data.users.find((item) => item.id === enrollment.student_id);
        const course = data.courses.find((item) => item.id === enrollment.course_id);
        return { enrollment, student, course };
      })
      .filter((item) => item.student);
    return { courses, quizzes, submissions, students: enrolledStudents.length, enrolledStudents };
  }, [data, user]);

  function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim()) return;
    createCourse({ title, description, professor_id: user.id, department: user.department });
    setTitle("");
    setDescription("");
    setData(getData());
  }

  if (!user || !data || !model) return null;

  return (
    <AppShell user={user} title="Professor Dashboard" subtitle="Create assessments, review submissions, and monitor privacy-friendly integrity signals.">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Courses" value={model.courses.length} helper="Created by you" />
        <StatCard label="Quizzes" value={model.quizzes.length} helper="Across your courses" />
        <StatCard label="Students" value={model.students} helper="Total enrollments" />
        <StatCard label="Submissions" value={model.submissions.length} helper="Ready for review" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Create Course" eyebrow="course builder">
          <form onSubmit={handleCreateCourse} className="space-y-3">
            <input className="premium-input w-full rounded-lg p-3" placeholder="Course title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <textarea className="premium-input min-h-28 w-full rounded-lg p-3" placeholder="Course description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <button className="premium-button px-5 py-3">Create course</button>
          </form>
        </Panel>

        <Panel title="Courses" eyebrow="teaching spaces">
          <div className="space-y-3">
            {model.courses.map((course) => (
              <div key={course.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{course.title}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">Join code: <span className="font-semibold text-primary-fixed-dim">{course.join_code}</span></p>
                  </div>
                  <Link href={`/courses/${course.id}`} className="secondary-button px-3 py-2 text-sm">Open</Link>
                </div>
              </div>
            ))}
            {model.courses.length === 0 && <EmptyState title="No courses yet" text="Create your first course to publish quizzes and invite students." />}
          </div>
        </Panel>
      </div>

      <Panel title="Enrolled Students" eyebrow="course roster">
        <div className="overflow-x-auto">
          <table className="premium-table min-w-[720px] text-left text-sm">
            <thead>
              <tr>
                <th className="py-3">Student</th>
                <th>Email</th>
                <th>Course</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {model.enrolledStudents.map(({ enrollment, student, course }) => (
                <tr key={enrollment.id} className="border-t border-slate-100">
                  <td className="py-3 font-medium">{student?.name}</td>
                  <td>{student?.email}</td>
                  <td>{course?.title || "Course"}</td>
                  <td>{new Date(enrollment.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {model.enrolledStudents.length === 0 && (
                <tr>
                  <td className="py-4 text-on-surface-variant" colSpan={4}>
                    No enrolled students yet. Ask the student to log in and join one of your course codes, such as AI2026.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Recent Submissions" eyebrow="review queue" action={<Link className="secondary-button px-3 py-2 text-sm" href="/integrity">Integrity reports</Link>}>
        <div className="overflow-x-auto">
          <table className="premium-table min-w-[760px] text-left text-sm">
            <thead>
              <tr>
                <th className="py-3">Student</th>
                <th>Quiz</th>
                <th>Score</th>
                <th>Risk</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {model.submissions.map((submission) => {
                const student = data.users.find((item) => item.id === submission.student_id);
                const quiz = data.quizzes.find((item) => item.id === submission.quiz_id);
                const summary = getIntegritySummary(submission.quiz_id, submission.student_id);
                return (
                  <tr key={submission.id} className="border-t border-slate-100">
                    <td className="py-3 font-medium">{student?.name}</td>
                    <td>{quiz?.title}</td>
                    <td>{submission.score}/{quiz?.total_marks}</td>
                    <td><RiskBadge risk={summary.risk} /></td>
                    <td>{new Date(submission.submitted_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
              {model.submissions.length === 0 && (
                <tr>
                  <td className="py-4 text-on-surface-variant" colSpan={5}>
                    No submissions yet. Ask a student to submit a quiz from one of your course join codes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
